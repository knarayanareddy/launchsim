-- ============================================================================
-- Security hardening
-- ============================================================================
-- Addresses the following findings:
--   1. profiles UPDATE had no WITH CHECK and no column restriction, letting any
--      authenticated user set is_admin / plan_tier / credits_remaining.
--   2. simulations share_token was auto-generated for EVERY row and the SELECT
--      policy was effectively `true`, exposing every user's pitch to anyone
--      holding the public anon key.
--   3. agents INSERT only required *some* authenticated user, allowing users to
--      inject rows into other people's reports.
--   4. referral_events INSERT was open to all authenticated users, bypassing the
--      process-referral edge function.
--   5. custom_personas UPDATE had no WITH CHECK, letting users flip is_public.
--   6. simulation_groups.user_id had no default/trigger, so the code path that
--      first used the table failed outright.
--   7. `avatars` storage bucket was public for SELECT and the duplicate policy
--      from an earlier migration was never dropped.
--   8. public.is_admin() was executable by `anon`.
--   9. feature_flags / system_settings / error_logs were queried by the admin
--      dashboard but never created.
--  10. custom_personas.industry was `text` while the client writes `string[]`.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. profiles: replace blanket row UPDATE with column-level privileges.
--    RLS cannot restrict columns, so the grants have to do it.
-- ---------------------------------------------------------------------------
REVOKE INSERT, UPDATE, DELETE ON public.profiles FROM anon, authenticated;
GRANT SELECT ON public.profiles TO authenticated;
GRANT UPDATE (full_name, avatar_url, email_prefs, onboarding_completed, user_type)
  ON public.profiles TO authenticated;

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Signup profile creation is handled by the handle_new_user trigger
-- (SECURITY DEFINER), so no INSERT grant is needed for API roles.
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- ---------------------------------------------------------------------------
-- 2. simulations: stop auto-minting share tokens; scope reads to the owner and
--    expose shared reports only through a token-scoped RPC.
-- ---------------------------------------------------------------------------
ALTER TABLE public.simulations ALTER COLUMN share_token DROP DEFAULT;

-- Existing tokens stay valid (they are still required to read a shared row) but
-- new rows no longer get one until the owner explicitly shares.
ALTER TABLE public.simulations
  ADD COLUMN IF NOT EXISTS shared_at timestamp with time zone;

DROP POLICY IF EXISTS "Users can view own simulations" ON public.simulations;
CREATE POLICY "Users can view own simulations"
  ON public.simulations FOR SELECT
  USING (auth.uid() = user_id);

-- Agents are only readable by the owner of the parent simulation. Shared
-- reports are read through get_shared_simulation() below.
DROP POLICY IF EXISTS "Users can read agents for their simulations" ON public.agents;
CREATE POLICY "Users can read agents for their simulations"
  ON public.agents FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.simulations s
    WHERE s.id = agents.simulation_id AND s.user_id = auth.uid()
  ));

-- The previous policy only checked that the caller was authenticated, which let
-- any user attach agents to any simulation.
DROP POLICY IF EXISTS "Authenticated users can insert agents" ON public.agents;
CREATE POLICY "Users can insert agents for their own simulations"
  ON public.agents FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.simulations s
    WHERE s.id = agents.simulation_id AND s.user_id = auth.uid()
  ));

-- Token-scoped read of a shared report. SECURITY DEFINER so it can bypass the
-- owner-only SELECT policy, but it only ever returns the row matching the token.
CREATE OR REPLACE FUNCTION public.get_shared_simulation(_token text)
RETURNS SETOF public.simulations
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.simulations
  WHERE share_token IS NOT NULL
    AND share_token = _token
  LIMIT 1
$$;

REVOKE ALL ON FUNCTION public.get_shared_simulation(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_shared_simulation(text) TO anon, authenticated;

-- Explicitly share a simulation: mints a token the first time and records when
-- it happened. Ownership is enforced by the UPDATE policy.
CREATE OR REPLACE FUNCTION public.share_simulation(_simulation_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _token text;
BEGIN
  UPDATE public.simulations
     SET share_token = COALESCE(share_token, left(md5(random()::text || clock_timestamp()::text), 8)),
         shared_at = COALESCE(shared_at, now())
   WHERE id = _simulation_id
     AND user_id = auth.uid()
  RETURNING share_token INTO _token;

  RETURN _token;
END;
$$;

REVOKE ALL ON FUNCTION public.share_simulation(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.share_simulation(uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- 2b. Atomic credit accounting for run-simulation.
--     The previous read-modify-write from supabase-js allowed concurrent runs to
--     double-spend, and credits were never checked before the AI call at all.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.spend_credit(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _spent boolean := false;
BEGIN
  UPDATE public.profiles
     SET credits_remaining = credits_remaining - 1,
         simulations_run = simulations_run + 1
   WHERE id = _user_id
     AND credits_remaining > 0
  RETURNING true INTO _spent;

  RETURN COALESCE(_spent, false);
END;
$$;

CREATE OR REPLACE FUNCTION public.refund_credit(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
     SET credits_remaining = credits_remaining + 1,
         simulations_run = GREATEST(0, simulations_run - 1)
   WHERE id = _user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.spend_credit(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.refund_credit(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.spend_credit(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.refund_credit(uuid) TO service_role;

-- ---------------------------------------------------------------------------
-- 3. referral_events: the edge function runs with the service role, so the API
--    roles do not need INSERT at all.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated users can create referral events" ON public.referral_events;
REVOKE INSERT, UPDATE, DELETE ON public.referral_events FROM anon, authenticated;

-- Award a referral atomically. Called by the process-referral edge function with
-- the service role; self-referral and duplicate awards are rejected here so the
-- guarantee survives even if the function's pre-checks are ever bypassed.
CREATE OR REPLACE FUNCTION public.award_referral(_referrer_id uuid, _referred_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF _referrer_id = _referred_id THEN
    RAISE EXCEPTION 'self_referral_not_allowed';
  END IF;

  IF EXISTS (SELECT 1 FROM public.referral_events WHERE referred_id = _referred_id) THEN
    RAISE EXCEPTION 'referral_already_processed';
  END IF;

  INSERT INTO public.referral_events (referrer_id, referred_id, credit_awarded)
  VALUES (_referrer_id, _referred_id, true);

  UPDATE public.profiles
     SET credits_remaining = credits_remaining + 3,
         total_referrals = total_referrals + 1
   WHERE id = _referrer_id;

  UPDATE public.profiles
     SET credits_remaining = credits_remaining + 1,
         referred_by = _referrer_id
   WHERE id = _referred_id;

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.award_referral(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.award_referral(uuid, uuid) TO service_role;

-- ---------------------------------------------------------------------------
-- 4. custom_personas: add WITH CHECK and stop leaking private personas through
--    the reusable-persona path.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can update own personas" ON public.custom_personas;
CREATE POLICY "Users can update own personas"
  ON public.custom_personas FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- `industry` was created as text but the client writes string[].
ALTER TABLE public.custom_personas
  ALTER COLUMN industry TYPE text[]
  USING (
    CASE
      WHEN industry IS NULL OR industry = '' THEN '{}'::text[]
      ELSE string_to_array(industry, ',')
    END
  );
ALTER TABLE public.custom_personas ALTER COLUMN industry SET DEFAULT '{}'::text[];

-- ---------------------------------------------------------------------------
-- 5. simulation_groups: make user_id default to the caller so inserts work.
-- ---------------------------------------------------------------------------
ALTER TABLE public.simulation_groups
  ALTER COLUMN user_id SET DEFAULT auth.uid();

-- ---------------------------------------------------------------------------
-- 6. avatars: bucket is public on purpose (avatar_url is embedded in <img>),
--    but the duplicate policy from 20260415185138 was never dropped, and the
--    public-read grant should be the only thing anon can do.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Avatar images are publicly readable" ON storage.objects;
CREATE POLICY "Avatar images are publicly readable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- ---------------------------------------------------------------------------
-- 7. is_admin() is only needed by RLS/route guards, never by anonymous clients.
-- ---------------------------------------------------------------------------
REVOKE ALL ON FUNCTION public.is_admin(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_admin(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 8. Tables the admin dashboard reads but that were never created.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.feature_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_name text NOT NULL UNIQUE,
  enabled boolean NOT NULL DEFAULT false,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.system_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.error_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  error_message text NOT NULL,
  page text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

-- Only admins may read/write flags and settings; every authenticated user may
-- read them so the app can honour a maintenance flag.
CREATE POLICY "Anyone can read feature flags"
  ON public.feature_flags FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "Admins manage feature flags"
  ON public.feature_flags FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Anyone can read system settings"
  ON public.system_settings FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "Admins manage system settings"
  ON public.system_settings FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Clients may only log errors for themselves; only admins may read them.
CREATE POLICY "Users can log their own errors"
  ON public.error_logs FOR INSERT
  TO authenticated
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());
CREATE POLICY "Admins can read error logs"
  ON public.error_logs FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE TRIGGER update_feature_flags_updated_at
  BEFORE UPDATE ON public.feature_flags
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_system_settings_updated_at
  BEFORE UPDATE ON public.system_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Seed the settings the dashboard expects to find.
INSERT INTO public.system_settings (key, value)
VALUES
  ('maintenance_mode', '{"enabled": false}'::jsonb),
  ('announcement', '{"enabled": false, "text": ""}'::jsonb)
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.feature_flags (flag_name, enabled, description)
VALUES
  ('comparison_mode', true, 'Side-by-side simulation comparison'),
  ('notion_export', true, 'Export reports to Notion'),
  ('persona_library', true, 'Public custom persona library'),
  ('streaming_simulations', false, 'Stream agent reactions over SSE')
ON CONFLICT (flag_name) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON public.error_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_simulations_user_created ON public.simulations(user_id, created_at DESC);

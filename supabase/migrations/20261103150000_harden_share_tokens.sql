-- Harden share tokens.
--
-- A share token is a bearer capability: GET /wiki/:token is authorised purely
-- by knowing the token, with no session. Anyone who can guess a token can read
-- somebody else's report.
--
-- The previous implementation minted one with
--
--     left(md5(random()::text || clock_timestamp()), 8)
--
-- which has two problems:
--
--   1. `random()` is a deterministic PRNG seeded per backend, not a CSPRNG, so
--      its output is not unpredictable to an attacker who can observe any other
--      output from the same backend.
--   2. Truncating md5 to 8 hex characters leaves a 32-bit space. At even a modest
--      request rate that is enumerable.
--
-- Replace it with gen_random_uuid(), which is core PostgreSQL (13+) and backed
-- by pg_strong_random(). Sixteen hex characters from a UUID gives 64 bits of
-- CSPRNG entropy with no extension dependency — pgcrypto's gen_random_bytes()
-- would need an explicit schema qualification to survive the function's
-- `SET search_path = public`.
--
-- Existing tokens are left in place so live share links keep working; the
-- app-side helpers rewrite a token on the next publish/unpublish cycle, and an
-- admin can revoke any link via unshareSimulation().

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
     SET share_token = COALESCE(
           share_token,
           left(replace(gen_random_uuid()::text, '-', ''), 16)
         ),
         shared_at = COALESCE(shared_at, now())
   WHERE id = _simulation_id
     AND user_id = auth.uid()
  RETURNING share_token INTO _token;

  RETURN _token;
END;
$$;

-- Re-assert privileges: CREATE OR REPLACE does not reset grants, but keeping
-- them next to the definition means the intent survives a copy-paste.
REVOKE ALL ON FUNCTION public.share_simulation(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.share_simulation(uuid) TO authenticated;

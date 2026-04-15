
-- Add referral columns to profiles
ALTER TABLE public.profiles
ADD COLUMN referral_code text UNIQUE,
ADD COLUMN referred_by uuid,
ADD COLUMN total_referrals integer NOT NULL DEFAULT 0;

-- Generate referral codes for existing profiles
UPDATE public.profiles
SET referral_code = left(md5(id::text || random()::text), 8)
WHERE referral_code IS NULL;

-- Make referral_code NOT NULL after backfill
ALTER TABLE public.profiles
ALTER COLUMN referral_code SET NOT NULL,
ALTER COLUMN referral_code SET DEFAULT left(md5(random()::text || clock_timestamp()::text), 8);

-- Create referral_events table
CREATE TABLE public.referral_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL,
  referred_id uuid NOT NULL UNIQUE,
  credit_awarded boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.referral_events ENABLE ROW LEVEL SECURITY;

-- Users can see referral events where they are the referrer
CREATE POLICY "Users can view own referral events"
ON public.referral_events
FOR SELECT
USING (auth.uid() = referrer_id);

-- Allow inserts from authenticated users (edge function uses service role)
CREATE POLICY "Authenticated users can create referral events"
ON public.referral_events
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Create index for fast lookups
CREATE INDEX idx_referral_events_referrer ON public.referral_events(referrer_id);
CREATE INDEX idx_profiles_referral_code ON public.profiles(referral_code);

-- Update handle_new_user to generate referral codes
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, referral_code)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    left(md5(NEW.id::text || random()::text), 8)
  );
  RETURN NEW;
END;
$$;

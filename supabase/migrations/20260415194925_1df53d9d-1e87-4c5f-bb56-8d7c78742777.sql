
-- Add new columns to custom_personas
ALTER TABLE public.custom_personas
  ADD COLUMN IF NOT EXISTS last_initial text,
  ADD COLUMN IF NOT EXISTS age_range text,
  ADD COLUMN IF NOT EXISTS gender_presentation text,
  ADD COLUMN IF NOT EXISTS job_title text,
  ADD COLUMN IF NOT EXISTS years_experience integer DEFAULT 5,
  ADD COLUMN IF NOT EXISTS secondary_traits text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS risk_tolerance integer DEFAULT 5,
  ADD COLUMN IF NOT EXISTS early_adopter_score integer DEFAULT 5,
  ADD COLUMN IF NOT EXISTS enterprise_mindset integer DEFAULT 5,
  ADD COLUMN IF NOT EXISTS influence_level integer DEFAULT 5,
  ADD COLUMN IF NOT EXISTS domain_expertise_level integer DEFAULT 5,
  ADD COLUMN IF NOT EXISTS domain_expertise_tags text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS tools_used text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS products_loved text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS products_hated text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS pain_points text,
  ADD COLUMN IF NOT EXISTS communication_style text,
  ADD COLUMN IF NOT EXISTS vocabulary_level text,
  ADD COLUMN IF NOT EXISTS signature_phrases text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS wins_them_over text,
  ADD COLUMN IF NOT EXISTS turns_them_off text,
  ADD COLUMN IF NOT EXISTS posting_behavior text,
  ADD COLUMN IF NOT EXISTS backstory text,
  ADD COLUMN IF NOT EXISTS pitches_evaluated text,
  ADD COLUMN IF NOT EXISTS has_built_product boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_invested boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_been_burned boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS burn_story text,
  ADD COLUMN IF NOT EXISTS current_mission text,
  ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS times_used integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- Add updated_at trigger
CREATE TRIGGER update_custom_personas_updated_at
  BEFORE UPDATE ON public.custom_personas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Update RLS: allow reading public personas too
DROP POLICY IF EXISTS "Users can view own personas" ON public.custom_personas;
CREATE POLICY "Users can view own and public personas"
  ON public.custom_personas
  FOR SELECT
  USING (auth.uid() = user_id OR is_public = true);

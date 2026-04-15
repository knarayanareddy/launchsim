
CREATE TABLE public.custom_personas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  emoji text NOT NULL DEFAULT '👤',
  archetype text NOT NULL,
  personality_type text NOT NULL,
  skepticism_level integer NOT NULL DEFAULT 5,
  price_sensitivity integer NOT NULL DEFAULT 5,
  tech_savviness integer NOT NULL DEFAULT 5,
  cares_about text[] NOT NULL DEFAULT '{}',
  rejection_triggers text,
  signature_phrase text,
  company_type text,
  industry text,
  company_size text,
  seniority text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.custom_personas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own personas" ON public.custom_personas FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own personas" ON public.custom_personas FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own personas" ON public.custom_personas FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own personas" ON public.custom_personas FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_custom_personas_user ON public.custom_personas(user_id);

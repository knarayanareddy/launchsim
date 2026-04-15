
ALTER TABLE public.profiles
ADD COLUMN email_prefs jsonb NOT NULL DEFAULT '{"simulation_complete": true, "credit_warnings": true, "product_updates": true}'::jsonb;

-- Create simulation_groups table
CREATE TABLE public.simulation_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  product_name TEXT NOT NULL,
  simulation_ids UUID[] NOT NULL DEFAULT '{}',
  latest_score INTEGER NOT NULL DEFAULT 0,
  score_delta INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.simulation_groups ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own groups"
  ON public.simulation_groups FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own groups"
  ON public.simulation_groups FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own groups"
  ON public.simulation_groups FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own groups"
  ON public.simulation_groups FOR DELETE
  USING (auth.uid() = user_id);

-- Timestamp trigger
CREATE TRIGGER update_simulation_groups_updated_at
  BEFORE UPDATE ON public.simulation_groups
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add group_id to simulations
ALTER TABLE public.simulations
  ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES public.simulation_groups(id) ON DELETE SET NULL;
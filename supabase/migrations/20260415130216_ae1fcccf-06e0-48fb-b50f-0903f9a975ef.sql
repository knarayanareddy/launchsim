-- Create simulations table
CREATE TABLE public.simulations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  product_description TEXT NOT NULL,
  simulation_question TEXT,
  crowd_size INTEGER NOT NULL DEFAULT 200,
  audience_mix TEXT[] NOT NULL DEFAULT '{}',
  platform TEXT NOT NULL DEFAULT 'both',
  depth TEXT NOT NULL DEFAULT 'standard',
  overall_score INTEGER NOT NULL DEFAULT 0,
  sentiment_breakdown JSONB,
  top_objections JSONB,
  top_strengths JSONB,
  sharpened_pitch TEXT,
  key_quote TEXT,
  key_quote_agent TEXT,
  agent_posts JSONB,
  share_token TEXT UNIQUE DEFAULT left(md5(random()::text), 8)
);

-- Create agents table
CREATE TABLE public.agents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  simulation_id UUID NOT NULL REFERENCES public.simulations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  archetype TEXT NOT NULL,
  personality_type TEXT NOT NULL,
  reaction_post TEXT,
  upvotes INTEGER DEFAULT 0,
  emoji TEXT
);

-- Enable RLS
ALTER TABLE public.simulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;

-- Public read access for wiki/share links
CREATE POLICY "Anyone can read simulations" ON public.simulations
  FOR SELECT USING (true);

CREATE POLICY "Anyone can read agents" ON public.agents
  FOR SELECT USING (true);

-- Allow inserts from the app (anon key)
CREATE POLICY "Anyone can insert simulations" ON public.simulations
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can insert agents" ON public.agents
  FOR INSERT WITH CHECK (true);

-- Index for share token lookups
CREATE INDEX idx_simulations_share_token ON public.simulations(share_token);

-- Index for agents by simulation
CREATE INDEX idx_agents_simulation_id ON public.agents(simulation_id);
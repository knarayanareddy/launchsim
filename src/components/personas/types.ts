export interface PersonaForm {
  name: string;
  last_initial: string | null;
  age_range: string | null;
  gender_presentation: string | null;
  emoji: string;
  archetype: string;
  seniority: string | null;
  years_experience: number;
  company_type: string | null;
  company_size: string | null;
  industry: string[];
  personality_type: string;
  secondary_traits: string[];
  skepticism: number;
  tech_savviness: number;
  price_sensitivity: number;
  risk_tolerance: number;
  early_adopter_score: number;
  enterprise_mindset: number;
  influence_level: number;
  domain_expertise_level: number;
  domain_expertise_tags: string[];
  tools_used: string[];
  products_loved: string[];
  products_hated: string[];
  pain_points: string | null;
  communication_style: string | null;
  vocabulary_level: string | null;
  signature_phrases: string[];
  wins_them_over: string | null;
  turns_them_off: string | null;
  posting_behavior: string | null;
  backstory: string | null;
  pitches_evaluated: string | null;
  has_built_product: boolean;
  has_invested: boolean;
  has_been_burned: boolean;
  burn_story: string | null;
  current_mission: string | null;
  is_public: boolean;
}

export const EMPTY_FORM: PersonaForm = {
  name: "",
  last_initial: null,
  age_range: null,
  gender_presentation: null,
  emoji: "👤",
  archetype: "",
  seniority: null,
  years_experience: 5,
  company_type: null,
  company_size: null,
  industry: [],
  personality_type: "pragmatist",
  secondary_traits: [],
  skepticism: 5,
  tech_savviness: 5,
  price_sensitivity: 5,
  risk_tolerance: 5,
  early_adopter_score: 5,
  enterprise_mindset: 5,
  influence_level: 5,
  domain_expertise_level: 5,
  domain_expertise_tags: [],
  tools_used: [],
  products_loved: [],
  products_hated: [],
  pain_points: null,
  communication_style: null,
  vocabulary_level: null,
  signature_phrases: [],
  wins_them_over: null,
  turns_them_off: null,
  posting_behavior: null,
  backstory: null,
  pitches_evaluated: null,
  has_built_product: false,
  has_invested: false,
  has_been_burned: false,
  burn_story: null,
  current_mission: null,
  is_public: false,
};

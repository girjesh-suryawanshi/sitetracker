-- Add site_id to credits table
ALTER TABLE public.credits
ADD COLUMN site_id UUID REFERENCES public.sites(id);

-- Create index for better query performance
CREATE INDEX idx_credits_site_id ON public.credits(site_id);
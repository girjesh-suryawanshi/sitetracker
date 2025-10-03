-- Create credits/income table
CREATE TABLE public.credits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL,
  date DATE NOT NULL,
  amount NUMERIC NOT NULL,
  payment_method payment_method NOT NULL DEFAULT 'cash',
  bank_account_id UUID REFERENCES public.bank_accounts(id) ON DELETE SET NULL,
  description TEXT,
  category TEXT NOT NULL
);

-- Enable RLS
ALTER TABLE public.credits ENABLE ROW LEVEL SECURITY;

-- RLS Policies for credits
CREATE POLICY "All authenticated users can view credits"
ON public.credits
FOR SELECT
USING (true);

CREATE POLICY "Site managers and admins can insert credits"
ON public.credits
FOR INSERT
WITH CHECK (
  check_user_has_role(ARRAY['admin'::user_role, 'site_manager'::user_role])
  AND created_by = auth.uid()
);

CREATE POLICY "Site managers and admins can update credits"
ON public.credits
FOR UPDATE
USING (check_user_has_role(ARRAY['admin'::user_role, 'site_manager'::user_role]));

CREATE POLICY "Admins can delete credits"
ON public.credits
FOR DELETE
USING (check_user_role('admin'::user_role));

-- Trigger to update updated_at
CREATE TRIGGER update_credits_updated_at
BEFORE UPDATE ON public.credits
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to update bank balance on credit insert/update
CREATE OR REPLACE FUNCTION public.update_bank_balance_on_credit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only update if payment method is bank_transfer and bank_account_id is set
  IF NEW.payment_method = 'bank_transfer' AND NEW.bank_account_id IS NOT NULL THEN
    IF TG_OP = 'INSERT' THEN
      -- Add credit amount to bank balance
      UPDATE public.bank_accounts 
      SET balance = balance + NEW.amount
      WHERE id = NEW.bank_account_id;
    ELSIF TG_OP = 'UPDATE' THEN
      -- Revert old balance change if bank account was used
      IF OLD.payment_method = 'bank_transfer' AND OLD.bank_account_id IS NOT NULL THEN
        UPDATE public.bank_accounts 
        SET balance = balance - OLD.amount
        WHERE id = OLD.bank_account_id;
      END IF;
      
      -- Apply new balance change
      UPDATE public.bank_accounts 
      SET balance = balance + NEW.amount
      WHERE id = NEW.bank_account_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger for insert/update
CREATE TRIGGER update_bank_balance_on_credit_trigger
AFTER INSERT OR UPDATE ON public.credits
FOR EACH ROW
EXECUTE FUNCTION public.update_bank_balance_on_credit();

-- Function to revert bank balance on credit delete
CREATE OR REPLACE FUNCTION public.revert_bank_balance_on_credit_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Revert balance if payment method was bank_transfer
  IF OLD.payment_method = 'bank_transfer' AND OLD.bank_account_id IS NOT NULL THEN
    UPDATE public.bank_accounts 
    SET balance = balance - OLD.amount
    WHERE id = OLD.bank_account_id;
  END IF;
  
  RETURN OLD;
END;
$$;

-- Trigger for delete
CREATE TRIGGER revert_bank_balance_on_credit_delete_trigger
AFTER DELETE ON public.credits
FOR EACH ROW
EXECUTE FUNCTION public.revert_bank_balance_on_credit_delete();
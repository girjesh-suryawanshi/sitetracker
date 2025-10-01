-- Create bank_accounts table
CREATE TABLE public.bank_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  bank_name TEXT NOT NULL,
  ifsc_code TEXT,
  balance NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for bank_accounts
CREATE POLICY "All authenticated users can view bank accounts"
ON public.bank_accounts
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins and site managers can insert bank accounts"
ON public.bank_accounts
FOR INSERT
TO authenticated
WITH CHECK (public.check_user_has_role(ARRAY['admin'::user_role, 'site_manager'::user_role]));

CREATE POLICY "Admins and site managers can update bank accounts"
ON public.bank_accounts
FOR UPDATE
TO authenticated
USING (public.check_user_has_role(ARRAY['admin'::user_role, 'site_manager'::user_role]));

CREATE POLICY "Admins can delete bank accounts"
ON public.bank_accounts
FOR DELETE
TO authenticated
USING (public.check_user_role('admin'::user_role));

-- Add trigger for updated_at
CREATE TRIGGER update_bank_accounts_updated_at
BEFORE UPDATE ON public.bank_accounts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create payment_method enum
CREATE TYPE public.payment_method AS ENUM ('cash', 'bank_transfer');

-- Add payment_method and bank_account_id to expenses table
ALTER TABLE public.expenses 
ADD COLUMN payment_method payment_method NOT NULL DEFAULT 'cash',
ADD COLUMN bank_account_id UUID REFERENCES public.bank_accounts(id) ON DELETE SET NULL;

-- Create function to update bank balance when expense is created/updated
CREATE OR REPLACE FUNCTION public.update_bank_balance()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only update if payment method is bank_transfer and bank_account_id is set
  IF NEW.payment_method = 'bank_transfer' AND NEW.bank_account_id IS NOT NULL THEN
    -- If it's an INSERT or the payment status changed to paid
    IF TG_OP = 'INSERT' THEN
      IF NEW.payment_status = 'paid' THEN
        UPDATE public.bank_accounts 
        SET balance = balance - NEW.amount
        WHERE id = NEW.bank_account_id;
      ELSIF NEW.payment_status = 'partial' THEN
        -- For partial, deduct half (you can customize this logic)
        UPDATE public.bank_accounts 
        SET balance = balance - (NEW.amount / 2)
        WHERE id = NEW.bank_account_id;
      END IF;
    ELSIF TG_OP = 'UPDATE' THEN
      -- Revert old balance change if bank account was used
      IF OLD.payment_method = 'bank_transfer' AND OLD.bank_account_id IS NOT NULL THEN
        IF OLD.payment_status = 'paid' THEN
          UPDATE public.bank_accounts 
          SET balance = balance + OLD.amount
          WHERE id = OLD.bank_account_id;
        ELSIF OLD.payment_status = 'partial' THEN
          UPDATE public.bank_accounts 
          SET balance = balance + (OLD.amount / 2)
          WHERE id = OLD.bank_account_id;
        END IF;
      END IF;
      
      -- Apply new balance change
      IF NEW.payment_status = 'paid' THEN
        UPDATE public.bank_accounts 
        SET balance = balance - NEW.amount
        WHERE id = NEW.bank_account_id;
      ELSIF NEW.payment_status = 'partial' THEN
        UPDATE public.bank_accounts 
        SET balance = balance - (NEW.amount / 2)
        WHERE id = NEW.bank_account_id;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for updating bank balance
CREATE TRIGGER update_bank_balance_on_expense
AFTER INSERT OR UPDATE ON public.expenses
FOR EACH ROW
EXECUTE FUNCTION public.update_bank_balance();

-- Create function to revert bank balance when expense is deleted
CREATE OR REPLACE FUNCTION public.revert_bank_balance_on_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Revert balance if payment method was bank_transfer
  IF OLD.payment_method = 'bank_transfer' AND OLD.bank_account_id IS NOT NULL THEN
    IF OLD.payment_status = 'paid' THEN
      UPDATE public.bank_accounts 
      SET balance = balance + OLD.amount
      WHERE id = OLD.bank_account_id;
    ELSIF OLD.payment_status = 'partial' THEN
      UPDATE public.bank_accounts 
      SET balance = balance + (OLD.amount / 2)
      WHERE id = OLD.bank_account_id;
    END IF;
  END IF;
  
  RETURN OLD;
END;
$$;

-- Create trigger for reverting bank balance on delete
CREATE TRIGGER revert_bank_balance_on_expense_delete
AFTER DELETE ON public.expenses
FOR EACH ROW
EXECUTE FUNCTION public.revert_bank_balance_on_delete();
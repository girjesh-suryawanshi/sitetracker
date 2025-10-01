-- Create security definer function to check user role
CREATE OR REPLACE FUNCTION public.check_user_role(required_role user_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
    AND role = required_role
  );
$$;

-- Create function to check if user has any of the specified roles
CREATE OR REPLACE FUNCTION public.check_user_has_role(required_roles user_role[])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
    AND role = ANY(required_roles)
  );
$$;

-- Update vendors table policies
DROP POLICY IF EXISTS "Admins and site managers can insert vendors" ON public.vendors;
DROP POLICY IF EXISTS "Admins and site managers can update vendors" ON public.vendors;
DROP POLICY IF EXISTS "Admins can delete vendors" ON public.vendors;

CREATE POLICY "Admins and site managers can insert vendors"
ON public.vendors
FOR INSERT
TO authenticated
WITH CHECK (public.check_user_has_role(ARRAY['admin'::user_role, 'site_manager'::user_role]));

CREATE POLICY "Admins and site managers can update vendors"
ON public.vendors
FOR UPDATE
TO authenticated
USING (public.check_user_has_role(ARRAY['admin'::user_role, 'site_manager'::user_role]));

CREATE POLICY "Admins can delete vendors"
ON public.vendors
FOR DELETE
TO authenticated
USING (public.check_user_role('admin'::user_role));

-- Update sites table policies
DROP POLICY IF EXISTS "Admins can insert sites" ON public.sites;
DROP POLICY IF EXISTS "Admins can update sites" ON public.sites;
DROP POLICY IF EXISTS "Admins can delete sites" ON public.sites;

CREATE POLICY "Admins can insert sites"
ON public.sites
FOR INSERT
TO authenticated
WITH CHECK (public.check_user_role('admin'::user_role));

CREATE POLICY "Admins can update sites"
ON public.sites
FOR UPDATE
TO authenticated
USING (public.check_user_role('admin'::user_role));

CREATE POLICY "Admins can delete sites"
ON public.sites
FOR DELETE
TO authenticated
USING (public.check_user_role('admin'::user_role));

-- Update categories table policies
DROP POLICY IF EXISTS "Admins can insert categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can update categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can delete categories" ON public.categories;

CREATE POLICY "Admins can insert categories"
ON public.categories
FOR INSERT
TO authenticated
WITH CHECK (public.check_user_role('admin'::user_role));

CREATE POLICY "Admins can update categories"
ON public.categories
FOR UPDATE
TO authenticated
USING (public.check_user_role('admin'::user_role));

CREATE POLICY "Admins can delete categories"
ON public.categories
FOR DELETE
TO authenticated
USING (public.check_user_role('admin'::user_role));

-- Update expenses table policies
DROP POLICY IF EXISTS "Site managers and admins can insert expenses" ON public.expenses;
DROP POLICY IF EXISTS "Site managers and admins can update expenses" ON public.expenses;
DROP POLICY IF EXISTS "Admins can delete expenses" ON public.expenses;

CREATE POLICY "Site managers and admins can insert expenses"
ON public.expenses
FOR INSERT
TO authenticated
WITH CHECK (
  public.check_user_has_role(ARRAY['admin'::user_role, 'site_manager'::user_role])
  AND created_by = auth.uid()
);

CREATE POLICY "Site managers and admins can update expenses"
ON public.expenses
FOR UPDATE
TO authenticated
USING (public.check_user_has_role(ARRAY['admin'::user_role, 'site_manager'::user_role]));

CREATE POLICY "Admins can delete expenses"
ON public.expenses
FOR DELETE
TO authenticated
USING (public.check_user_role('admin'::user_role));
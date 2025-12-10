-- 修复 update_updated_at_column 函数的 search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 修复 generate_project_code 函数的 search_path
CREATE OR REPLACE FUNCTION public.generate_project_code()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.project_code = 'P' || LPAD(NEXTVAL('project_code_seq')::TEXT, 4, '0');
  RETURN NEW;
END;
$$;
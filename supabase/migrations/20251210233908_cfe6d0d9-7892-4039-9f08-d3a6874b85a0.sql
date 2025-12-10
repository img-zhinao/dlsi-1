-- 创建用户角色枚举
CREATE TYPE public.app_role AS ENUM ('applicant', 'platform', 'underwriter');

-- 创建用户档案表
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT,
  contact_name TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 创建用户角色表（安全：角色必须单独存储）
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'applicant',
  UNIQUE(user_id, role)
);

-- 创建项目/询价表
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  project_code TEXT UNIQUE,
  name TEXT NOT NULL,
  company_name TEXT,
  trial_phase TEXT,
  subject_count INTEGER DEFAULT 0,
  drug_type TEXT,
  indication TEXT,
  duration_months INTEGER,
  site_count INTEGER,
  protocol_url TEXT,
  ai_risk_score INTEGER,
  risk_factors TEXT[],
  premium_min DECIMAL(12,2),
  premium_max DECIMAL(12,2),
  final_premium DECIMAL(12,2),
  coverage_per_subject DECIMAL(12,2) DEFAULT 500000,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'quoted', 'underwriting', 'approved', 'rejected', 'insured')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 创建理赔表
CREATE TABLE public.claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subject_name TEXT NOT NULL,
  invoice_amount DECIMAL(12,2) NOT NULL,
  medical_insurance_amount DECIMAL(12,2) DEFAULT 0,
  deductible DECIMAL(12,2) DEFAULT 1000,
  payment_ratio DECIMAL(4,2) DEFAULT 0.80,
  claimed_amount DECIMAL(12,2),
  approved_amount DECIMAL(12,2),
  invoice_url TEXT,
  medical_record_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'ai_reviewed', 'platform_review', 'approved', 'rejected', 'paid')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 启用 RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claims ENABLE ROW LEVEL SECURITY;

-- 创建角色检查函数（安全定义器，避免RLS递归）
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Profiles RLS 策略
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- User Roles RLS 策略
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Platform users can view all roles"
  ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(), 'platform'));

-- Projects RLS 策略
CREATE POLICY "Users can view own projects"
  ON public.projects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Platform/Underwriter can view all projects"
  ON public.projects FOR SELECT
  USING (
    public.has_role(auth.uid(), 'platform') OR 
    public.has_role(auth.uid(), 'underwriter')
  );

CREATE POLICY "Users can create own projects"
  ON public.projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects"
  ON public.projects FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Platform can update any project"
  ON public.projects FOR UPDATE
  USING (public.has_role(auth.uid(), 'platform'));

-- Claims RLS 策略
CREATE POLICY "Users can view own claims"
  ON public.claims FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Platform can view all claims"
  ON public.claims FOR SELECT
  USING (public.has_role(auth.uid(), 'platform'));

CREATE POLICY "Users can create own claims"
  ON public.claims FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own claims"
  ON public.claims FOR UPDATE
  USING (auth.uid() = user_id);

-- 创建自动更新 updated_at 的函数和触发器
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_claims_updated_at
  BEFORE UPDATE ON public.claims
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 创建新用户注册时自动创建 profile 和默认角色的函数
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, company_name, contact_name)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'company_name',
    NEW.raw_user_meta_data ->> 'contact_name'
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'applicant');
  
  RETURN NEW;
END;
$$;

-- 创建触发器
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 生成项目编号的函数
CREATE OR REPLACE FUNCTION public.generate_project_code()
RETURNS TRIGGER AS $$
BEGIN
  NEW.project_code = 'P' || LPAD(NEXTVAL('project_code_seq')::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE IF NOT EXISTS project_code_seq START 1;

CREATE TRIGGER set_project_code
  BEFORE INSERT ON public.projects
  FOR EACH ROW
  WHEN (NEW.project_code IS NULL)
  EXECUTE FUNCTION public.generate_project_code();
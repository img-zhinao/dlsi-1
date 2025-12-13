-- 询价申请表
CREATE TABLE public.inquiry_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  sponsor_info JSONB DEFAULT '{}',
  trial_info JSONB DEFAULT '{}',
  coverage_requirements JSONB DEFAULT '{}',
  special_notes TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  pdf_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 投保申请表
CREATE TABLE public.insurance_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  applicant_info JSONB DEFAULT '{}',
  insured_info JSONB DEFAULT '{}',
  coverage_details JSONB DEFAULT '{}',
  signature_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  submitted_at TIMESTAMP WITH TIME ZONE,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 聊天消息表（保险问答）
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'platform')),
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.inquiry_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insurance_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for inquiry_applications
CREATE POLICY "Users can view own inquiry applications"
ON public.inquiry_applications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own inquiry applications"
ON public.inquiry_applications FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own inquiry applications"
ON public.inquiry_applications FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Platform can view all inquiry applications"
ON public.inquiry_applications FOR SELECT
USING (has_role(auth.uid(), 'platform'::app_role));

-- RLS policies for insurance_applications
CREATE POLICY "Users can view own insurance applications"
ON public.insurance_applications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own insurance applications"
ON public.insurance_applications FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own insurance applications"
ON public.insurance_applications FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Platform can view all insurance applications"
ON public.insurance_applications FOR SELECT
USING (has_role(auth.uid(), 'platform'::app_role));

CREATE POLICY "Platform can update all insurance applications"
ON public.insurance_applications FOR UPDATE
USING (has_role(auth.uid(), 'platform'::app_role));

-- RLS policies for chat_messages
CREATE POLICY "Users can view own chat messages"
ON public.chat_messages FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own chat messages"
ON public.chat_messages FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Platform can view all chat messages"
ON public.chat_messages FOR SELECT
USING (has_role(auth.uid(), 'platform'::app_role));

CREATE POLICY "Platform can create chat messages"
ON public.chat_messages FOR INSERT
WITH CHECK (has_role(auth.uid(), 'platform'::app_role));

-- Triggers for updated_at
CREATE TRIGGER update_inquiry_applications_updated_at
BEFORE UPDATE ON public.inquiry_applications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_insurance_applications_updated_at
BEFORE UPDATE ON public.insurance_applications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
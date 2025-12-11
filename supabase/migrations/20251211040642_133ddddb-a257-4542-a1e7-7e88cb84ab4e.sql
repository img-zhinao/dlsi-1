-- Create file versions table
CREATE TABLE public.file_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  file_type TEXT NOT NULL, -- 'protocol', 'quote', 'policy', 'attachment'
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  version_number INTEGER NOT NULL DEFAULT 1,
  file_size INTEGER,
  notes TEXT,
  uploaded_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.file_versions ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view file versions of own projects"
ON public.file_versions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = file_versions.project_id 
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Platform can view all file versions"
ON public.file_versions
FOR SELECT
USING (has_role(auth.uid(), 'platform'::app_role));

CREATE POLICY "Users can upload file versions to own projects"
ON public.file_versions
FOR INSERT
WITH CHECK (
  auth.uid() = uploaded_by AND
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = file_versions.project_id 
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Platform can upload file versions"
ON public.file_versions
FOR INSERT
WITH CHECK (
  auth.uid() = uploaded_by AND
  has_role(auth.uid(), 'platform'::app_role)
);

-- Create index for faster queries
CREATE INDEX idx_file_versions_project ON public.file_versions(project_id);
CREATE INDEX idx_file_versions_type ON public.file_versions(project_id, file_type);
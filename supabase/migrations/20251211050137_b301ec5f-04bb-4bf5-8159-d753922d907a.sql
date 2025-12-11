-- Drop overly permissive policies
DROP POLICY IF EXISTS "Anyone can view file versions" ON public.file_versions;
DROP POLICY IF EXISTS "Anyone can update file versions" ON public.file_versions;
DROP POLICY IF EXISTS "Anyone can delete file versions" ON public.file_versions;
DROP POLICY IF EXISTS "Anyone can upload file versions" ON public.file_versions;

-- Create owner-based policies for regular users
CREATE POLICY "Users can view own file versions" 
ON public.file_versions 
FOR SELECT 
TO authenticated
USING (auth.uid() = uploaded_by);

CREATE POLICY "Users can upload file versions" 
ON public.file_versions 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "Users can update own file versions" 
ON public.file_versions 
FOR UPDATE 
TO authenticated
USING (auth.uid() = uploaded_by);

CREATE POLICY "Users can delete own file versions" 
ON public.file_versions 
FOR DELETE 
TO authenticated
USING (auth.uid() = uploaded_by);

-- Add platform role access for administrative needs
CREATE POLICY "Platform can view all file versions" 
ON public.file_versions 
FOR SELECT 
TO authenticated
USING (has_role(auth.uid(), 'platform'::app_role));

CREATE POLICY "Platform can update all file versions" 
ON public.file_versions 
FOR UPDATE 
TO authenticated
USING (has_role(auth.uid(), 'platform'::app_role));

CREATE POLICY "Platform can delete all file versions" 
ON public.file_versions 
FOR DELETE 
TO authenticated
USING (has_role(auth.uid(), 'platform'::app_role));
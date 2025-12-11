-- 删除现有的限制性策略
DROP POLICY IF EXISTS "Platform can upload file versions" ON public.file_versions;
DROP POLICY IF EXISTS "Platform can view all file versions" ON public.file_versions;
DROP POLICY IF EXISTS "Users can upload file versions to own projects" ON public.file_versions;
DROP POLICY IF EXISTS "Users can view file versions of own projects" ON public.file_versions;

-- 测试阶段：允许所有认证用户查看所有文件版本
CREATE POLICY "Anyone can view file versions" 
ON public.file_versions 
FOR SELECT 
TO authenticated
USING (true);

-- 测试阶段：允许所有认证用户上传文件版本
CREATE POLICY "Anyone can upload file versions" 
ON public.file_versions 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = uploaded_by);

-- 测试阶段：允许所有认证用户更新文件版本
CREATE POLICY "Anyone can update file versions" 
ON public.file_versions 
FOR UPDATE 
TO authenticated
USING (true);

-- 测试阶段：允许所有认证用户删除文件版本
CREATE POLICY "Anyone can delete file versions" 
ON public.file_versions 
FOR DELETE 
TO authenticated
USING (true);
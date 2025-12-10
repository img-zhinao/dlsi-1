-- 创建存储桶用于临床试验方案文档
INSERT INTO storage.buckets (id, name, public) 
VALUES ('protocols', 'protocols', false);

-- 创建存储策略：用户只能上传和查看自己的文件
CREATE POLICY "Users can upload their own protocols"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'protocols' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own protocols"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'protocols' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own protocols"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'protocols' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);
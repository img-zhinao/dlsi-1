-- Create inquiry folders table
CREATE TABLE public.inquiry_folders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.inquiry_folders ENABLE ROW LEVEL SECURITY;

-- RLS policies for folders
CREATE POLICY "Users can view own folders"
ON public.inquiry_folders
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own folders"
ON public.inquiry_folders
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own folders"
ON public.inquiry_folders
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own folders"
ON public.inquiry_folders
FOR DELETE
USING (auth.uid() = user_id);

-- Add folder_id to projects table
ALTER TABLE public.projects ADD COLUMN folder_id UUID REFERENCES public.inquiry_folders(id) ON DELETE SET NULL;

-- Create trigger for updated_at
CREATE TRIGGER update_inquiry_folders_updated_at
BEFORE UPDATE ON public.inquiry_folders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
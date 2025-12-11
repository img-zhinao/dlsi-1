import { useState, useRef } from "react";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import {
  FileText,
  Upload,
  Download,
  Clock,
  User,
  ChevronDown,
  ChevronUp,
  File,
  FileCheck,
  FilePlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface FileVersion {
  id: string;
  project_id: string;
  file_type: string;
  file_name: string;
  file_url: string;
  version_number: number;
  file_size: number | null;
  notes: string | null;
  uploaded_by: string;
  created_at: string;
}

interface FileVersionManagerProps {
  projectId: string;
  versions: FileVersion[];
  onVersionsChange: () => void;
}

const fileTypeConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  protocol: { label: "试验方案", color: "bg-blue-100 text-blue-800", icon: FileText },
  quote: { label: "报价文件", color: "bg-green-100 text-green-800", icon: FileCheck },
  policy: { label: "保单文件", color: "bg-purple-100 text-purple-800", icon: File },
  attachment: { label: "附件", color: "bg-gray-100 text-gray-800", icon: FilePlus },
};

export function FileVersionManager({
  projectId,
  versions,
  onVersionsChange,
}: FileVersionManagerProps) {
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [expandedTypes, setExpandedTypes] = useState<string[]>(["protocol", "quote"]);
  const [uploadingType, setUploadingType] = useState<string>("protocol");
  const [uploadNotes, setUploadNotes] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Group versions by file type
  const versionsByType = versions.reduce((acc, version) => {
    if (!acc[version.file_type]) {
      acc[version.file_type] = [];
    }
    acc[version.file_type].push(version);
    return acc;
  }, {} as Record<string, FileVersion[]>);

  // Sort each group by version number descending
  Object.keys(versionsByType).forEach((type) => {
    versionsByType[type].sort((a, b) => b.version_number - a.version_number);
  });

  const toggleType = (type: string) => {
    setExpandedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("未登录");

      // Get next version number
      const existingVersions = versionsByType[uploadingType] || [];
      const nextVersion = existingVersions.length > 0 
        ? Math.max(...existingVersions.map(v => v.version_number)) + 1 
        : 1;

      // Upload file to storage
      const fileExt = file.name.split(".").pop();
      const filePath = `${projectId}/${uploadingType}/v${nextVersion}_${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from("protocols")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("protocols")
        .getPublicUrl(filePath);

      // Save version record
      const { error: insertError } = await supabase.from("file_versions").insert({
        project_id: projectId,
        file_type: uploadingType,
        file_name: file.name,
        file_url: urlData.publicUrl,
        version_number: nextVersion,
        file_size: file.size,
        notes: uploadNotes || null,
        uploaded_by: user.id,
      });

      if (insertError) throw insertError;

      toast({ title: "上传成功", description: `版本 ${nextVersion} 已保存` });
      setIsUploadOpen(false);
      setUploadNotes("");
      onVersionsChange();
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "上传失败",
        description: error instanceof Error ? error.message : "请稍后重试",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "-";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const allTypes = ["protocol", "quote", "policy", "attachment"];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="w-5 h-5" />
          文件版本管理
        </CardTitle>
        <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Upload className="w-4 h-4 mr-2" />
              上传新版本
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>上传文件新版本</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">文件类型</label>
                <Select value={uploadingType} onValueChange={setUploadingType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {allTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {fileTypeConfig[type]?.label || type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">版本备注（可选）</label>
                <Textarea
                  placeholder="描述本次更新的内容..."
                  value={uploadNotes}
                  onChange={(e) => setUploadNotes(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">选择文件</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileUpload}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
                />
                <Button
                  variant="outline"
                  className="w-full h-20 border-dashed"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    "上传中..."
                  ) : (
                    <>
                      <Upload className="w-5 h-5 mr-2" />
                      点击选择文件
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="space-y-4">
        {allTypes.map((type) => {
          const config = fileTypeConfig[type];
          const typeVersions = versionsByType[type] || [];
          const isExpanded = expandedTypes.includes(type);
          const Icon = config?.icon || File;

          return (
            <div key={type} className="border rounded-lg overflow-hidden">
              <button
                onClick={() => toggleType(type)}
                className="w-full flex items-center justify-between p-3 bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5 text-muted-foreground" />
                  <span className="font-medium">{config?.label || type}</span>
                  <Badge variant="secondary" className="text-xs">
                    {typeVersions.length} 个版本
                  </Badge>
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>

              {isExpanded && (
                <div className="divide-y">
                  {typeVersions.length === 0 ? (
                    <p className="p-4 text-sm text-muted-foreground text-center">
                      暂无文件版本
                    </p>
                  ) : (
                    typeVersions.map((version, index) => (
                      <div
                        key={version.id}
                        className={cn(
                          "p-4 flex items-start justify-between gap-4",
                          index === 0 && "bg-primary/5"
                        )}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Badge
                              className={cn(
                                "text-xs",
                                index === 0 ? "bg-primary" : "bg-muted text-muted-foreground"
                              )}
                            >
                              v{version.version_number}
                              {index === 0 && " (最新)"}
                            </Badge>
                            <span className="text-sm font-medium truncate">
                              {version.file_name}
                            </span>
                          </div>
                          {version.notes && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {version.notes}
                            </p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {format(new Date(version.created_at), "yyyy/MM/dd HH:mm", {
                                locale: zhCN,
                              })}
                            </span>
                            <span>{formatFileSize(version.file_size)}</span>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(version.file_url, "_blank")}
                        >
                          <Download className="w-4 h-4 mr-1" />
                          下载
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

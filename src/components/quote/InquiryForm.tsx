import { useState, useRef } from "react";
import { Upload, FileText, Loader2, Sparkles, CheckCircle, AlertCircle, Edit3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface InquiryFormData {
  protocolNumber: string;
  protocolName: string;
  trialDrug: string;
  trialPhase: string;
  sponsor: string;
  subjectCount: number;
  indication: string;
  durationMonths: number;
  siteCount: number;
  risks: string[];
}

interface InquiryFormProps {
  onFormDataChange: (data: InquiryFormData) => void;
  onFileUploaded: (file: File | null) => void;
}

// Helper function to extract text from file
async function extractTextFromFile(file: File): Promise<string> {
  if (file.type === "text/plain") {
    return await file.text();
  }
  return `临床试验方案文档: ${file.name}\n\n这是一个${file.type}类型的文件，大小为${(file.size / 1024).toFixed(1)}KB。\n\n为了演示AI分析功能，请假设这是一个II期非小细胞肺癌的靶向药物临床试验，计划入组200例受试者，在8个研究中心开展，预计持续24个月。该试验涉及肿瘤患者，需多次给药。`;
}

export function InquiryForm({ onFormDataChange, onFileUploaded }: InquiryFormProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [autoFilledFields, setAutoFilledFields] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState<InquiryFormData>({
    protocolNumber: "",
    protocolName: "",
    trialDrug: "",
    trialPhase: "",
    sponsor: "",
    subjectCount: 0,
    indication: "",
    durationMonths: 0,
    siteCount: 0,
    risks: [],
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newFiles = Array.from(files);
    setUploadedFiles((prev) => [...prev, ...newFiles]);
    onFileUploaded(newFiles[0]);

    // Start AI analysis
    setIsAnalyzing(true);

    try {
      const documentText = await extractTextFromFile(newFiles[0]);

      const { data: result, error } = await supabase.functions.invoke("analyze-protocol", {
        body: { documentText },
      });

      if (error) throw new Error(error.message);
      if (!result.success) throw new Error(result.error || "分析失败");

      const extractedData = result.data;

      // Map extracted data to form fields
      const newFormData: InquiryFormData = {
        protocolNumber: extractedData.protocolNumber || `PROT-${Date.now().toString().slice(-6)}`,
        protocolName: extractedData.protocolName || `${extractedData.indication || "临床试验"}研究`,
        trialDrug: extractedData.drugType || "",
        trialPhase: extractedData.trialPhase || "",
        sponsor: extractedData.sponsor || "",
        subjectCount: extractedData.subjectCount || 0,
        indication: extractedData.indication || "",
        durationMonths: extractedData.durationMonths || 0,
        siteCount: extractedData.siteCount || 0,
        risks: extractedData.risks || [],
      };

      // Track which fields were auto-filled
      const autoFilled = new Set<string>();
      if (newFormData.protocolNumber) autoFilled.add("protocolNumber");
      if (newFormData.protocolName) autoFilled.add("protocolName");
      if (newFormData.trialDrug) autoFilled.add("trialDrug");
      if (newFormData.trialPhase) autoFilled.add("trialPhase");
      if (newFormData.sponsor) autoFilled.add("sponsor");
      if (newFormData.subjectCount > 0) autoFilled.add("subjectCount");
      if (newFormData.indication) autoFilled.add("indication");
      if (newFormData.durationMonths > 0) autoFilled.add("durationMonths");
      if (newFormData.siteCount > 0) autoFilled.add("siteCount");

      setAutoFilledFields(autoFilled);
      setFormData(newFormData);
      onFormDataChange(newFormData);

      toast({
        title: "AI解析完成",
        description: `已自动填充 ${autoFilled.size} 个字段`,
      });
    } catch (error) {
      console.error("Analysis error:", error);
      toast({
        title: "解析失败",
        description: error instanceof Error ? error.message : "请稍后重试",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const updateField = (field: keyof InquiryFormData, value: string | number | string[]) => {
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);
    onFormDataChange(newFormData);
    
    // Remove from auto-filled when user edits
    if (autoFilledFields.has(field)) {
      const newAutoFilled = new Set(autoFilledFields);
      newAutoFilled.delete(field);
      setAutoFilledFields(newAutoFilled);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
    if (uploadedFiles.length === 1) {
      onFileUploaded(null);
    }
  };

  const getFieldClassName = (field: string) => {
    return cn(
      "transition-all duration-300",
      autoFilledFields.has(field) && "bg-autofill border-autofill-border ring-1 ring-autofill-border/50"
    );
  };

  return (
    <div className="space-y-6">
      {/* AI Smart Parsing Area */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <CardTitle className="text-lg">AI智能解析</CardTitle>
              <CardDescription>
                上传《试验方案》或《知情同意书》，AI将自动提取关键信息
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.txt"
            multiple
            onChange={handleFileUpload}
            className="hidden"
          />

          <Button
            variant="outline"
            size="lg"
            className={cn(
              "w-full border-dashed border-2 h-24 hover:bg-primary/5 hover:border-primary transition-all",
              isAnalyzing && "pointer-events-none"
            )}
            onClick={() => fileInputRef.current?.click()}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? (
              <div className="flex items-center gap-3">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <span className="text-muted-foreground">正在分析试验方案...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="w-6 h-6" />
                <span>点击上传文件 (PDF/Word/TXT)</span>
                <span className="text-xs text-muted-foreground">支持《试验方案》、《知情同意书》等文档</span>
              </div>
            )}
          </Button>

          {/* Uploaded Files */}
          {uploadedFiles.length > 0 && (
            <div className="space-y-2">
              {uploadedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-success" />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-muted-foreground hover:text-destructive"
                      onClick={() => removeFile(index)}
                    >
                      移除
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Auto-fill indicator */}
          {autoFilledFields.size > 0 && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-success/10 border border-success/20">
              <CheckCircle className="w-5 h-5 text-success" />
              <span className="text-sm text-success">
                AI已自动填充 {autoFilledFields.size} 个字段，请核对并修改
              </span>
              <Badge variant="secondary" className="ml-auto">
                <Edit3 className="w-3 h-3 mr-1" />
                可编辑
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form Fields */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">试验基本信息</CardTitle>
          <CardDescription>
            {autoFilledFields.size > 0 
              ? "绿色高亮字段为AI自动填充，您可以直接修改"
              : "请填写以下信息，或通过AI解析自动填充"
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Protocol Number */}
          <div className="space-y-2">
            <Label htmlFor="protocolNumber" className="flex items-center gap-2">
              试验方案编号
              {autoFilledFields.has("protocolNumber") && (
                <Badge variant="outline" className="text-success border-success/50 text-xs">
                  AI填充
                </Badge>
              )}
            </Label>
            <Input
              id="protocolNumber"
              value={formData.protocolNumber}
              onChange={(e) => updateField("protocolNumber", e.target.value)}
              placeholder="例如: PROT-2024-001"
              className={getFieldClassName("protocolNumber")}
            />
          </div>

          {/* Protocol Name */}
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="protocolName" className="flex items-center gap-2">
              试验方案名称
              {autoFilledFields.has("protocolName") && (
                <Badge variant="outline" className="text-success border-success/50 text-xs">
                  AI填充
                </Badge>
              )}
            </Label>
            <Textarea
              id="protocolName"
              value={formData.protocolName}
              onChange={(e) => updateField("protocolName", e.target.value)}
              placeholder="请输入完整的试验方案名称"
              className={cn("resize-none h-20", getFieldClassName("protocolName"))}
            />
          </div>

          {/* Trial Drug */}
          <div className="space-y-2">
            <Label htmlFor="trialDrug" className="flex items-center gap-2">
              试验药物
              {autoFilledFields.has("trialDrug") && (
                <Badge variant="outline" className="text-success border-success/50 text-xs">
                  AI填充
                </Badge>
              )}
            </Label>
            <Input
              id="trialDrug"
              value={formData.trialDrug}
              onChange={(e) => updateField("trialDrug", e.target.value)}
              placeholder="例如: XX单抗注射液"
              className={getFieldClassName("trialDrug")}
            />
          </div>

          {/* Trial Phase */}
          <div className="space-y-2">
            <Label htmlFor="trialPhase" className="flex items-center gap-2">
              研究所处阶段
              {autoFilledFields.has("trialPhase") && (
                <Badge variant="outline" className="text-success border-success/50 text-xs">
                  AI填充
                </Badge>
              )}
            </Label>
            <Select
              value={formData.trialPhase}
              onValueChange={(value) => updateField("trialPhase", value)}
            >
              <SelectTrigger className={getFieldClassName("trialPhase")}>
                <SelectValue placeholder="选择试验分期" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="I期">I期临床试验</SelectItem>
                <SelectItem value="I/II期">I/II期临床试验</SelectItem>
                <SelectItem value="II期">II期临床试验</SelectItem>
                <SelectItem value="II/III期">II/III期临床试验</SelectItem>
                <SelectItem value="III期">III期临床试验</SelectItem>
                <SelectItem value="IV期">IV期临床试验</SelectItem>
                <SelectItem value="BE试验">BE生物等效性试验</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sponsor */}
          <div className="space-y-2">
            <Label htmlFor="sponsor" className="flex items-center gap-2">
              申办方
              {autoFilledFields.has("sponsor") && (
                <Badge variant="outline" className="text-success border-success/50 text-xs">
                  AI填充
                </Badge>
              )}
            </Label>
            <Input
              id="sponsor"
              value={formData.sponsor}
              onChange={(e) => updateField("sponsor", e.target.value)}
              placeholder="例如: XX制药有限公司"
              className={getFieldClassName("sponsor")}
            />
          </div>

          {/* Subject Count */}
          <div className="space-y-2">
            <Label htmlFor="subjectCount" className="flex items-center gap-2">
              受试者例数
              {autoFilledFields.has("subjectCount") && (
                <Badge variant="outline" className="text-success border-success/50 text-xs">
                  AI填充
                </Badge>
              )}
            </Label>
            <Input
              id="subjectCount"
              type="number"
              value={formData.subjectCount || ""}
              onChange={(e) => updateField("subjectCount", parseInt(e.target.value) || 0)}
              placeholder="例如: 200"
              className={getFieldClassName("subjectCount")}
            />
          </div>

          {/* Indication */}
          <div className="space-y-2">
            <Label htmlFor="indication" className="flex items-center gap-2">
              适应症
              {autoFilledFields.has("indication") && (
                <Badge variant="outline" className="text-success border-success/50 text-xs">
                  AI填充
                </Badge>
              )}
            </Label>
            <Input
              id="indication"
              value={formData.indication}
              onChange={(e) => updateField("indication", e.target.value)}
              placeholder="例如: 非小细胞肺癌"
              className={getFieldClassName("indication")}
            />
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label htmlFor="durationMonths" className="flex items-center gap-2">
              预计持续时间（月）
              {autoFilledFields.has("durationMonths") && (
                <Badge variant="outline" className="text-success border-success/50 text-xs">
                  AI填充
                </Badge>
              )}
            </Label>
            <Input
              id="durationMonths"
              type="number"
              value={formData.durationMonths || ""}
              onChange={(e) => updateField("durationMonths", parseInt(e.target.value) || 0)}
              placeholder="例如: 24"
              className={getFieldClassName("durationMonths")}
            />
          </div>

          {/* Site Count */}
          <div className="space-y-2">
            <Label htmlFor="siteCount" className="flex items-center gap-2">
              研究中心数量
              {autoFilledFields.has("siteCount") && (
                <Badge variant="outline" className="text-success border-success/50 text-xs">
                  AI填充
                </Badge>
              )}
            </Label>
            <Input
              id="siteCount"
              type="number"
              value={formData.siteCount || ""}
              onChange={(e) => updateField("siteCount", parseInt(e.target.value) || 0)}
              placeholder="例如: 8"
              className={getFieldClassName("siteCount")}
            />
          </div>

          {/* Risk Factors */}
          {formData.risks.length > 0 && (
            <div className="md:col-span-2 space-y-2">
              <Label className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-destructive" />
                识别到的风险因素
              </Label>
              <div className="flex flex-wrap gap-2 p-4 rounded-lg bg-destructive/5 border border-destructive/20">
                {formData.risks.map((risk, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="bg-destructive/10 text-destructive border-destructive/30"
                  >
                    {risk}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

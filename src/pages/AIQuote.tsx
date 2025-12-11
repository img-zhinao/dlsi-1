import { useState, useRef, useEffect } from "react";
import { Send, Upload, Bot, User, FileText, CheckCircle, AlertCircle, Loader2, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { FolderManager } from "@/components/quote/FolderManager";

interface Message {
  id: string;
  role: "assistant" | "user";
  content: string;
  type?: "text" | "upload" | "analysis" | "quote";
  data?: any;
}

interface ExtractedData {
  trialPhase: string;
  subjectCount: number;
  drugType: string;
  indication: string;
  durationMonths?: number;
  siteCount?: number;
  risks: string[];
}

interface InquiryFolder {
  id: string;
  name: string;
  description: string | null;
  user_id: string;
  created_at: string;
}

const initialMessages: Message[] = [
  {
    id: "1",
    role: "assistant",
    content: "您好！我是您的AI保险助手。请上传您的《临床试验方案》PDF，我将为您自动分析并生成报价。",
    type: "text",
  },
];

// Simple text extraction from PDF (basic approach)
async function extractTextFromFile(file: File): Promise<string> {
  if (file.type === "text/plain") {
    return await file.text();
  }
  
  return `临床试验方案文档: ${file.name}\n\n这是一个${file.type}类型的文件，大小为${(file.size / 1024).toFixed(1)}KB。\n\n为了演示AI分析功能，请假设这是一个II期非小细胞肺癌的靶向药物临床试验，计划入组200例受试者，在8个研究中心开展，预计持续24个月。该试验涉及肿瘤患者，需多次给药。`;
}

// Calculate premium based on risk factors
function calculatePremium(data: ExtractedData): { min: number; max: number; riskScore: number } {
  const baseRate = 800;
  let riskFactor = 1.0;
  
  if (data.trialPhase?.includes("I")) riskFactor += 0.5;
  if (data.trialPhase?.includes("II")) riskFactor += 0.3;
  
  const highRiskTerms = ["肿瘤", "癌", "CAR-T", "基因", "儿童", "未成年"];
  const mediumRiskTerms = ["老年", "多次给药", "注射"];
  
  data.risks?.forEach(risk => {
    if (highRiskTerms.some(term => risk.includes(term))) riskFactor += 0.2;
    if (mediumRiskTerms.some(term => risk.includes(term))) riskFactor += 0.1;
  });
  
  const subjectCount = data.subjectCount || 100;
  const basePremium = subjectCount * baseRate * riskFactor;
  const riskScore = Math.min(100, Math.round(riskFactor * 40));
  
  return {
    min: Math.round(basePremium * 0.9),
    max: Math.round(basePremium * 1.1),
    riskScore
  };
}

export default function AIQuote() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputValue, setInputValue] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisData, setAnalysisData] = useState<ExtractedData | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [folders, setFolders] = useState<InquiryFolder[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchFolders = async () => {
    const { data, error } = await supabase
      .from("inquiry_folders")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (!error && data) {
      setFolders(data);
    }
  };

  useEffect(() => {
    fetchFolders();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Store the file for later saving
    setUploadedFile(file);

    // Add user message showing file upload
    const uploadMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: `已上传文件: ${file.name}`,
      type: "upload",
    };
    setMessages((prev) => [...prev, uploadMessage]);

    // Start analysis
    setIsAnalyzing(true);
    
    const analysisMessageId = (Date.now() + 1).toString();
    const analysisMessage: Message = {
      id: analysisMessageId,
      role: "assistant",
      content: "正在使用AI分析您的临床试验方案...",
      type: "analysis",
    };
    setMessages((prev) => [...prev, analysisMessage]);

    try {
      // Extract text from file
      const documentText = await extractTextFromFile(file);
      
      // Call the AI analysis edge function
      const { data: result, error } = await supabase.functions.invoke("analyze-protocol", {
        body: { documentText }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!result.success) {
        throw new Error(result.error || "分析失败");
      }

      const extractedData = result.data as ExtractedData;
      setAnalysisData(extractedData);

      // Update analysis message with results
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === analysisMessageId
            ? {
                ...msg,
                content: "分析完成！以下是从方案中提取的关键信息：",
                data: extractedData,
              }
            : msg
        )
      );

      toast({
        title: "分析完成",
        description: "已成功提取临床试验方案的关键信息",
      });
    } catch (error) {
      console.error("Analysis error:", error);
      
      // Update message to show error
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === analysisMessageId
            ? {
                ...msg,
                content: `分析失败: ${error instanceof Error ? error.message : "未知错误"}`,
                type: "text",
              }
            : msg
        )
      );

      toast({
        title: "分析失败",
        description: error instanceof Error ? error.message : "请稍后重试",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleConfirmAnalysis = async () => {
    if (!analysisData) return;

    const confirmMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: "确认以上信息无误",
      type: "text",
    };
    setMessages((prev) => [...prev, confirmMessage]);

    setIsAnalyzing(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsAnalyzing(false);

    const premium = calculatePremium(analysisData);

    const quoteMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: "根据您的临床试验方案，我已为您生成以下报价：",
      type: "quote",
      data: {
        premiumRange: premium,
        coveragePerSubject: 500000,
        totalCoverage: (analysisData.subjectCount || 100) * 500000,
        riskScore: premium.riskScore,
      },
    };
    setMessages((prev) => [...prev, quoteMessage]);
  };

  const handleSaveProject = async () => {
    if (!analysisData || !user) return;

    setIsAnalyzing(true);
    try {
      const premium = calculatePremium(analysisData);
      
      // Create project first
      const { data: projectData, error: projectError } = await supabase
        .from("projects")
        .insert({
          user_id: user.id,
          name: `${analysisData.indication || "临床试验"}项目`,
          trial_phase: analysisData.trialPhase,
          subject_count: analysisData.subjectCount,
          drug_type: analysisData.drugType,
          indication: analysisData.indication,
          duration_months: analysisData.durationMonths,
          site_count: analysisData.siteCount,
          ai_risk_score: premium.riskScore,
          risk_factors: analysisData.risks,
          premium_min: premium.min,
          premium_max: premium.max,
          status: "quoted",
          folder_id: selectedFolderId,
        })
        .select()
        .single();

      if (projectError) throw projectError;

      // Upload file and create version record if file exists
      if (uploadedFile && projectData) {
        try {
          const fileExt = uploadedFile.name.split(".").pop();
          const filePath = `${projectData.id}/protocol/v1_${Date.now()}.${fileExt}`;
          
          const { error: uploadError } = await supabase.storage
            .from("protocols")
            .upload(filePath, uploadedFile);

          if (!uploadError) {
            const { data: urlData } = supabase.storage
              .from("protocols")
              .getPublicUrl(filePath);

            // Create file version record
            await supabase.from("file_versions").insert({
              project_id: projectData.id,
              file_type: "protocol",
              file_name: uploadedFile.name,
              file_url: urlData.publicUrl,
              version_number: 1,
              file_size: uploadedFile.size,
              notes: "初始上传 - AI智能询价",
              uploaded_by: user.id,
            });
          }
        } catch (fileError) {
          console.error("File upload error:", fileError);
          // Don't fail the whole operation if file upload fails
        }
      }

      toast({
        title: "保存成功",
        description: `项目编号: ${projectData.project_code}`,
      });

      // Add confirmation message
      const saveMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: `项目已保存！编号: ${projectData.project_code}。方案文件已自动归档到文件版本管理中。您可以在"报价管理"中查看详情。`,
        type: "text",
      };
      setMessages((prev) => [...prev, saveMessage]);
      
      // Reset state for new inquiry
      setUploadedFile(null);
      setAnalysisData(null);
    } catch (error) {
      console.error("Save error:", error);
      toast({
        title: "保存失败",
        description: "请稍后重试",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue,
      type: "text",
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");

    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "收到您的消息。如需获取报价，请点击下方按钮上传您的临床试验方案文档。",
        type: "text",
      };
      setMessages((prev) => [...prev, assistantMessage]);
    }, 1000);
  };

  return (
    <div className="h-screen flex bg-gradient-to-b from-background to-muted/30">
      {/* Folder Sidebar */}
      <div className="w-64 border-r border-border bg-card/50 backdrop-blur-sm p-4 flex flex-col">
        <div className="flex items-center gap-2 mb-4 pb-4 border-b border-border">
          <FolderOpen className="w-5 h-5 text-primary" />
          <h2 className="font-semibold">询价管理</h2>
        </div>
        <FolderManager
          folders={folders}
          selectedFolderId={selectedFolderId}
          onSelectFolder={setSelectedFolderId}
          onFoldersChange={fetchFolders}
        />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-border bg-card/50 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center">
              <Bot className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">AI智能询价助手</h1>
              <p className="text-sm text-muted-foreground">
                {selectedFolderId
                  ? `当前文件夹: ${folders.find((f) => f.id === selectedFolderId)?.name || "未知"}`
                  : "上传方案，智能分析，快速报价"}
              </p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-auto p-6 space-y-6">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex gap-4 animate-slide-up",
              message.role === "user" ? "flex-row-reverse" : ""
            )}
          >
            <div
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                message.role === "assistant" ? "bg-primary" : "bg-secondary"
              )}
            >
              {message.role === "assistant" ? (
                <Bot className="w-5 h-5 text-primary-foreground" />
              ) : (
                <User className="w-5 h-5 text-secondary-foreground" />
              )}
            </div>

            <div className={cn("max-w-2xl", message.role === "user" ? "text-right" : "")}>
              {message.type === "upload" ? (
                <Card className="border-0 shadow-soft bg-secondary/50">
                  <CardContent className="p-4 flex items-center gap-3">
                    <FileText className="w-8 h-8 text-primary" />
                    <span className="text-sm font-medium">{message.content}</span>
                    <CheckCircle className="w-5 h-5 text-success" />
                  </CardContent>
                </Card>
              ) : message.type === "analysis" && message.data ? (
                <Card className="border-0 shadow-soft">
                  <CardContent className="p-6 space-y-4">
                    <p className="text-foreground">{message.content}</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl bg-muted/50">
                        <p className="text-sm text-muted-foreground">试验分期</p>
                        <p className="text-lg font-bold text-primary">{message.data.trialPhase || "未知"}</p>
                      </div>
                      <div className="p-4 rounded-xl bg-muted/50">
                        <p className="text-sm text-muted-foreground">受试者例数</p>
                        <p className="text-lg font-bold text-primary">{message.data.subjectCount || 0}例</p>
                      </div>
                      <div className="p-4 rounded-xl bg-muted/50">
                        <p className="text-sm text-muted-foreground">药物类型</p>
                        <p className="text-lg font-bold text-primary">{message.data.drugType || "未知"}</p>
                      </div>
                      <div className="p-4 rounded-xl bg-muted/50">
                        <p className="text-sm text-muted-foreground">适应症</p>
                        <p className="text-lg font-bold text-primary">{message.data.indication || "未知"}</p>
                      </div>
                    </div>
                    {message.data.risks && message.data.risks.length > 0 && (
                      <div className="p-4 rounded-xl bg-destructive/5 border border-destructive/20">
                        <p className="text-sm font-medium text-destructive flex items-center gap-2">
                          <AlertCircle className="w-4 h-4" />
                          识别到的风险因素
                        </p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {message.data.risks.map((risk: string, i: number) => (
                            <span key={i} className="px-3 py-1 rounded-full text-xs bg-destructive/10 text-destructive">
                              {risk}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="flex gap-3 pt-2">
                      <Button onClick={handleConfirmAnalysis} className="flex-1">
                        确认信息无误
                      </Button>
                      <Button variant="outline" className="flex-1">
                        修改信息
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : message.type === "quote" && message.data ? (
                <Card className="border-0 shadow-card overflow-hidden">
                  <div className="p-8 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
                    <p className="text-sm opacity-80">预计保费范围</p>
                    <p className="text-4xl font-bold mt-2">
                      ¥{(message.data.premiumRange.min / 10000).toFixed(1)}万 - ¥{(message.data.premiumRange.max / 10000).toFixed(1)}万
                    </p>
                  </div>
                  <CardContent className="p-6 space-y-4">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-2xl font-bold text-foreground">{message.data.riskScore}</p>
                        <p className="text-xs text-muted-foreground">风险评分</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-foreground">¥{message.data.coveragePerSubject / 10000}万</p>
                        <p className="text-xs text-muted-foreground">每人保额</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-foreground">¥{(message.data.totalCoverage / 100000000).toFixed(1)}亿</p>
                        <p className="text-xs text-muted-foreground">总保额</p>
                      </div>
                    </div>
                    <Button className="w-full" size="lg" onClick={handleSaveProject}>
                      保存项目并申请正式报价单
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div
                  className={cn(
                    "px-5 py-3 rounded-2xl",
                    message.role === "assistant"
                      ? "bg-card shadow-soft text-card-foreground"
                      : "bg-primary text-primary-foreground"
                  )}
                >
                  <p>{message.content}</p>
                </div>
              )}
            </div>
          </div>
        ))}

        {isAnalyzing && (
          <div className="flex gap-4 animate-slide-up">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Bot className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="px-5 py-3 rounded-2xl bg-card shadow-soft flex items-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              <span className="text-muted-foreground">AI正在分析中...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-6 border-t border-border bg-card/50 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto">
          {!analysisData && (
            <div className="mb-4">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button
                variant="outline"
                size="lg"
                className="w-full border-dashed border-2 h-20 hover:bg-primary/5 hover:border-primary transition-colors"
                onClick={() => fileInputRef.current?.click()}
                disabled={isAnalyzing}
              >
                <Upload className="w-5 h-5 mr-2" />
                点击上传临床试验方案 (PDF/Word/TXT)
              </Button>
            </div>
          )}
          <div className="flex gap-3">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="输入您的问题..."
              className="flex-1 h-12 rounded-xl"
            />
            <Button size="lg" className="h-12 px-6 rounded-xl" onClick={handleSend}>
              <Send className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}

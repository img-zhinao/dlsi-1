import { useState, useRef } from "react";
import { Send, Upload, Bot, User, FileText, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "assistant" | "user";
  content: string;
  type?: "text" | "upload" | "analysis" | "quote";
  data?: any;
}

const initialMessages: Message[] = [
  {
    id: "1",
    role: "assistant",
    content: "您好！我是您的AI保险助手。请上传您的《临床试验方案》PDF，我将为您自动分析并生成报价。",
    type: "text",
  },
];

export default function AIQuote() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputValue, setInputValue] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisData, setAnalysisData] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Add user message showing file upload
    const uploadMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: `已上传文件: ${file.name}`,
      type: "upload",
    };
    setMessages((prev) => [...prev, uploadMessage]);

    // Simulate AI analysis
    setIsAnalyzing(true);
    
    const analysisMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: "正在分析您的临床试验方案...",
      type: "analysis",
    };
    setMessages((prev) => [...prev, analysisMessage]);

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 2500));

    // Mock extracted data
    const extractedData = {
      trialPhase: "II期",
      subjectCount: 200,
      drugType: "小分子靶向药物",
      indication: "非小细胞肺癌",
      duration: "24个月",
      sites: 8,
      risks: ["涉及肿瘤患者", "需多次给药", "部分受试者为老年人"],
    };

    setAnalysisData(extractedData);
    setIsAnalyzing(false);

    // Update analysis message with results
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === analysisMessage.id
          ? {
              ...msg,
              content: "分析完成！以下是从方案中提取的关键信息：",
              data: extractedData,
            }
          : msg
      )
    );
  };

  const handleConfirmAnalysis = async () => {
    const confirmMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: "确认以上信息无误",
      type: "text",
    };
    setMessages((prev) => [...prev, confirmMessage]);

    setIsAnalyzing(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsAnalyzing(false);

    const quoteMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: "根据您的临床试验方案，我已为您生成以下报价：",
      type: "quote",
      data: {
        premiumRange: { min: 180000, max: 220000 },
        coveragePerSubject: 500000,
        totalCoverage: 100000000,
        riskScore: 58,
      },
    };
    setMessages((prev) => [...prev, quoteMessage]);
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

    // Simple auto-response
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
    <div className="h-screen flex flex-col bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <div className="p-6 border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center">
            <Bot className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold">AI智能询价助手</h1>
            <p className="text-sm text-muted-foreground">上传方案，智能分析，快速报价</p>
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
                        <p className="text-lg font-bold text-primary">{message.data.trialPhase}</p>
                      </div>
                      <div className="p-4 rounded-xl bg-muted/50">
                        <p className="text-sm text-muted-foreground">受试者例数</p>
                        <p className="text-lg font-bold text-primary">{message.data.subjectCount}例</p>
                      </div>
                      <div className="p-4 rounded-xl bg-muted/50">
                        <p className="text-sm text-muted-foreground">药物类型</p>
                        <p className="text-lg font-bold text-primary">{message.data.drugType}</p>
                      </div>
                      <div className="p-4 rounded-xl bg-muted/50">
                        <p className="text-sm text-muted-foreground">适应症</p>
                        <p className="text-lg font-bold text-primary">{message.data.indication}</p>
                      </div>
                    </div>
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
                        <p className="text-2xl font-bold text-foreground">¥{message.data.totalCoverage / 100000000}亿</p>
                        <p className="text-xs text-muted-foreground">总保额</p>
                      </div>
                    </div>
                    <Button className="w-full" size="lg">
                      申请正式报价单
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
              <span className="text-muted-foreground">正在分析中...</span>
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
                accept=".pdf,.doc,.docx"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button
                variant="outline"
                size="lg"
                className="w-full border-dashed border-2 h-20 hover:bg-primary/5 hover:border-primary transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-5 h-5 mr-2" />
                点击上传临床试验方案 (PDF/Word)
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
  );
}

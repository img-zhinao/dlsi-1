import { useState, useEffect } from "react";
import { Bot, CheckCircle, FolderOpen, FileDown, ArrowRight, MessageSquare, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { FolderManager } from "@/components/quote/FolderManager";
import { StepIndicator } from "@/components/quote/StepIndicator";
import { InsuranceQAChat } from "@/components/quote/InsuranceQAChat";
import { DocumentPreview } from "@/components/quote/DocumentPreview";
import { useDocumentGeneration } from "@/hooks/useDocumentGeneration";
import { InquiryForm, InquiryFormData } from "@/components/quote/InquiryForm";

interface InquiryFolder {
  id: string;
  name: string;
  description: string | null;
  user_id: string;
  created_at: string;
}

interface ProjectData {
  id: string;
  project_code: string;
  name: string;
  premium_min: number;
  premium_max: number;
}

interface QuoteResult {
  premiumMin: number;
  premiumMax: number;
  riskScore: number;
  coveragePerSubject: number;
  totalCoverage: number;
}

const STEPS = [
  { id: 1, title: "上传分析", description: "上传临床试验方案" },
  { id: 2, title: "专业咨询", description: "保险问题答疑" },
  { id: 3, title: "生成资料", description: "一键生成投保资料" },
];

function calculatePremium(data: InquiryFormData): QuoteResult {
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
  const coveragePerSubject = 500000;
  
  return {
    premiumMin: Math.round(basePremium * 0.9),
    premiumMax: Math.round(basePremium * 1.1),
    riskScore,
    coveragePerSubject,
    totalCoverage: subjectCount * coveragePerSubject,
  };
}

export default function AIQuote() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<InquiryFormData | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [folders, setFolders] = useState<InquiryFolder[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [savedProject, setSavedProject] = useState<ProjectData | null>(null);
  const [quoteConfirmed, setQuoteConfirmed] = useState(false);
  const [quoteResult, setQuoteResult] = useState<QuoteResult | null>(null);
  const [inquiryDocHtml, setInquiryDocHtml] = useState<string>("");
  const [applicationDocHtml, setApplicationDocHtml] = useState<string>("");
  const [showQAPanel, setShowQAPanel] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const { generateInquiryDoc, generateApplicationDoc, printDocument, downloadDocument, isGenerating } = useDocumentGeneration();

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

  const handleFormDataChange = (data: InquiryFormData) => {
    setFormData(data);
  };

  const handleFileUploaded = (file: File | null) => {
    setUploadedFile(file);
  };

  const handleCalculateQuote = () => {
    if (!formData || !formData.subjectCount) {
      toast({
        title: "信息不完整",
        description: "请至少填写受试者例数",
        variant: "destructive",
      });
      return;
    }

    const result = calculatePremium(formData);
    setQuoteResult(result);
    
    toast({
      title: "报价计算完成",
      description: `预计保费: ¥${(result.premiumMin / 10000).toFixed(1)}万 - ¥${(result.premiumMax / 10000).toFixed(1)}万`,
    });
  };

  const handleSaveProject = async () => {
    if (!formData || !user) return;

    setIsSaving(true);
    try {
      const quote = quoteResult || calculatePremium(formData);
      
      const { data: projectData, error: projectError } = await supabase
        .from("projects")
        .insert({
          user_id: user.id,
          name: formData.protocolName || `${formData.indication || "临床试验"}项目`,
          trial_phase: formData.trialPhase,
          subject_count: formData.subjectCount,
          drug_type: formData.trialDrug,
          indication: formData.indication,
          duration_months: formData.durationMonths,
          site_count: formData.siteCount,
          company_name: formData.sponsor,
          ai_risk_score: quote.riskScore,
          risk_factors: formData.risks,
          premium_min: quote.premiumMin,
          premium_max: quote.premiumMax,
          status: "quoted",
          folder_id: selectedFolderId,
        })
        .select()
        .single();

      if (projectError) throw projectError;

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
        }
      }

      setSavedProject({
        id: projectData.id,
        project_code: projectData.project_code,
        name: projectData.name,
        premium_min: quote.premiumMin,
        premium_max: quote.premiumMax,
      });
      setQuoteConfirmed(true);
      setCurrentStep(2);

      toast({
        title: "保存成功",
        description: `项目编号: ${projectData.project_code}`,
      });
    } catch (error) {
      console.error("Save error:", error);
      toast({
        title: "保存失败",
        description: "请稍后重试",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateInquiryDoc = async () => {
    if (!formData || !user) return;

    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      const html = await generateInquiryDoc({
        sponsorInfo: {
          companyName: formData.sponsor || profile?.company_name || "",
          contactName: profile?.contact_name || "",
          phone: profile?.phone || "",
          email: user.email || "",
        },
        trialInfo: {
          trialName: formData.protocolName || `${formData.indication || "临床试验"}研究`,
          trialPhase: formData.trialPhase,
          subjectCount: formData.subjectCount,
          drugType: formData.trialDrug,
          indication: formData.indication,
          durationMonths: formData.durationMonths,
          siteCount: formData.siteCount,
        },
        coverageRequirements: {
          coveragePerSubject: 500000,
          deductible: 1000,
          paymentRatio: 0.8,
        },
        riskFactors: formData.risks,
      });

      setInquiryDocHtml(html);
      toast({ title: "询价资料已生成" });
    } catch (error) {
      toast({
        title: "生成失败",
        description: error instanceof Error ? error.message : "请稍后重试",
        variant: "destructive",
      });
    }
  };

  const handleGenerateApplicationDoc = async () => {
    if (!formData || !user || !savedProject) return;

    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      const quote = quoteResult || calculatePremium(formData);

      const html = await generateApplicationDoc({
        applicantInfo: {
          companyName: formData.sponsor || profile?.company_name || "",
          legalRepresentative: "",
          registrationNumber: "",
          address: "",
          contactName: profile?.contact_name || "",
          phone: profile?.phone || "",
          email: user.email || "",
        },
        trialInfo: {
          trialName: formData.protocolName || `${formData.indication || "临床试验"}研究`,
          trialPhase: formData.trialPhase,
          subjectCount: formData.subjectCount,
          drugType: formData.trialDrug,
          indication: formData.indication,
          durationMonths: formData.durationMonths,
          siteCount: formData.siteCount,
        },
        coverageDetails: {
          coveragePerSubject: 500000,
          totalCoverage: quote.totalCoverage,
          deductible: 1000,
          paymentRatio: 0.8,
          premiumAmount: Math.round((quote.premiumMin + quote.premiumMax) / 2),
        },
        projectCode: savedProject.project_code,
      });

      setApplicationDocHtml(html);
      setCurrentStep(3);
      toast({ title: "投保资料已生成" });
    } catch (error) {
      toast({
        title: "生成失败",
        description: error instanceof Error ? error.message : "请稍后重试",
        variant: "destructive",
      });
    }
  };

  const projectContext = formData ? {
    trialPhase: formData.trialPhase,
    subjectCount: formData.subjectCount,
    drugType: formData.trialDrug,
    indication: formData.indication,
    premiumMin: savedProject?.premium_min,
    premiumMax: savedProject?.premium_max,
  } : undefined;

  return (
    <div className="h-screen flex flex-col bg-gradient-to-b from-background to-muted/30">
      {/* Step Indicator */}
      <StepIndicator
        steps={STEPS}
        currentStep={currentStep}
        onStepClick={(step) => {
          if (step <= currentStep) setCurrentStep(step);
        }}
      />

      <div className="flex-1 flex overflow-hidden">
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

          {/* Quick Actions */}
          {quoteConfirmed && (
            <div className="mt-auto pt-4 border-t border-border space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => setShowQAPanel(!showQAPanel)}
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                专业咨询
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => setCurrentStep(3)}
              >
                <FileDown className="w-4 h-4 mr-2" />
                生成资料
              </Button>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 flex">
          {/* Form/Content Area */}
          <div className={cn("flex-1 flex flex-col overflow-hidden", showQAPanel && "border-r border-border")}>
            {/* Header */}
            <div className="p-6 border-b border-border bg-card/50 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center">
                    <Bot className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold">AI智能询价助手</h1>
                    <p className="text-sm text-muted-foreground">
                      {savedProject
                        ? `项目编号: ${savedProject.project_code}`
                        : selectedFolderId
                        ? `当前文件夹: ${folders.find((f) => f.id === selectedFolderId)?.name || "未知"}`
                        : "上传方案 → 专业咨询 → 生成资料"}
                    </p>
                  </div>
                </div>
                {quoteConfirmed && (
                  <Button onClick={() => setCurrentStep(3)}>
                    <ArrowRight className="w-4 h-4 mr-2" />
                    生成投保资料
                  </Button>
                )}
              </div>
            </div>

            {/* Content based on step */}
            {currentStep === 3 ? (
              <div className="flex-1 overflow-auto p-6">
                <div className="max-w-2xl mx-auto space-y-6">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold mb-2">一键生成投保资料</h2>
                    <p className="text-muted-foreground">
                      根据您的临床试验信息，自动生成标准格式的保险文件
                    </p>
                  </div>

                  <DocumentPreview
                    title="询价申请表"
                    description="包含申办方信息、试验信息、保障需求等"
                    htmlContent={inquiryDocHtml}
                    onGenerate={handleGenerateInquiryDoc}
                    onDownload={() => downloadDocument(inquiryDocHtml, "询价申请表")}
                    onPrint={() => printDocument(inquiryDocHtml)}
                    isGenerating={isGenerating}
                    isGenerated={!!inquiryDocHtml}
                  />

                  <DocumentPreview
                    title="投保申请书"
                    description="正式投保文件，包含保障方案和投保声明"
                    htmlContent={applicationDocHtml}
                    onGenerate={handleGenerateApplicationDoc}
                    onDownload={() => downloadDocument(applicationDocHtml, "投保申请书")}
                    onPrint={() => printDocument(applicationDocHtml)}
                    isGenerating={isGenerating}
                    isGenerated={!!applicationDocHtml}
                  />

                  {applicationDocHtml && (
                    <Card className="border-success/50 bg-success/5">
                      <CardContent className="p-6 text-center">
                        <CheckCircle className="w-12 h-12 text-success mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">资料生成完成</h3>
                        <p className="text-muted-foreground mb-4">
                          您可以预览、下载或打印文件，然后提交给保险公司审核
                        </p>
                        <Button size="lg">
                          提交审核
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-auto p-6">
                <div className="max-w-3xl mx-auto space-y-6">
                  {/* Inquiry Form */}
                  <InquiryForm
                    onFormDataChange={handleFormDataChange}
                    onFileUploaded={handleFileUploaded}
                  />

                  {/* Quote Result Card */}
                  {quoteResult && (
                    <Card className="border-0 shadow-card overflow-hidden animate-slide-up">
                      <div className="p-8 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
                        <p className="text-sm opacity-80">预计保费范围</p>
                        <p className="text-4xl font-bold mt-2">
                          ¥{(quoteResult.premiumMin / 10000).toFixed(1)}万 - ¥{(quoteResult.premiumMax / 10000).toFixed(1)}万
                        </p>
                      </div>
                      <CardContent className="p-6 space-y-4">
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div>
                            <p className="text-2xl font-bold text-foreground">{quoteResult.riskScore}</p>
                            <p className="text-xs text-muted-foreground">风险评分</p>
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-foreground">¥{quoteResult.coveragePerSubject / 10000}万</p>
                            <p className="text-xs text-muted-foreground">每人保额</p>
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-foreground">¥{(quoteResult.totalCoverage / 100000000).toFixed(1)}亿</p>
                            <p className="text-xs text-muted-foreground">总保额</p>
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <Button className="flex-1" size="lg" onClick={handleSaveProject} disabled={isSaving}>
                            {isSaving ? "保存中..." : "确认报价并保存"}
                          </Button>
                          <Button variant="outline" size="lg" onClick={() => setShowQAPanel(true)}>
                            <MessageSquare className="w-4 h-4 mr-2" />
                            咨询问题
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Calculate Quote Button */}
                  {!quoteResult && formData && formData.subjectCount > 0 && (
                    <Card className="border-dashed border-2 border-primary/30 bg-primary/5">
                      <CardContent className="p-6 text-center">
                        <Calculator className="w-10 h-10 text-primary mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">信息填写完成</h3>
                        <p className="text-muted-foreground mb-4">
                          点击下方按钮计算保费报价
                        </p>
                        <Button size="lg" onClick={handleCalculateQuote}>
                          <Calculator className="w-4 h-4 mr-2" />
                          计算报价
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* QA Side Panel */}
          {showQAPanel && (
            <div className="w-96 flex flex-col">
              <InsuranceQAChat
                projectContext={projectContext}
                className="h-full rounded-none border-0"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

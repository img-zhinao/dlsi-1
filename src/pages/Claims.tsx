import { useState } from "react";
import { Camera, Upload, FileText, CheckCircle, Clock, CreditCard, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const claimSteps = [
  { id: 1, label: "AI初审", status: "completed" },
  { id: 2, label: "平台复核", status: "current" },
  { id: 3, label: "银行打款", status: "pending" },
];

const mockPolicies = [
  { id: "POL001", name: "某I期肿瘤药物试验", subjectId: "S001-张三" },
  { id: "POL002", name: "糖尿病新药II期临床", subjectId: "S015-李四" },
  { id: "POL003", name: "CAR-T免疫疗法试验", subjectId: "S003-王五" },
];

export default function Claims() {
  const [step, setStep] = useState(1);
  const [invoiceAmount, setInvoiceAmount] = useState("");
  const [medicalInsurance, setMedicalInsurance] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);

  const deductible = 1000;
  const paymentRatio = 0.8;
  const invoiceNum = parseFloat(invoiceAmount) || 0;
  const medicalNum = parseFloat(medicalInsurance) || 0;
  const claimAmount = Math.max(0, (invoiceNum - medicalNum - deductible) * paymentRatio);

  const handleFileUpload = (type: string) => {
    setUploadedFiles((prev) => [...prev, type]);
    // Simulate OCR auto-fill
    if (type === "invoice") {
      setTimeout(() => {
        setInvoiceAmount("8500");
      }, 1000);
    }
  };

  return (
    <div className="min-h-screen p-6 md:p-8 animate-slide-up">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold">自助理赔</h1>
          <p className="text-muted-foreground mt-2">上传凭证，快速理赔</p>
        </div>

        {/* Progress Steps */}
        <Card className="border-0 shadow-soft overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              {claimSteps.map((s, i) => (
                <div key={s.id} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center transition-all",
                        s.status === "completed"
                          ? "bg-success text-success-foreground"
                          : s.status === "current"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {s.status === "completed" ? (
                        <CheckCircle className="w-6 h-6" />
                      ) : s.status === "current" ? (
                        <Clock className="w-6 h-6" />
                      ) : (
                        <span className="font-bold">{s.id}</span>
                      )}
                    </div>
                    <p className={cn(
                      "text-sm mt-2 font-medium",
                      s.status === "current" ? "text-primary" : "text-muted-foreground"
                    )}>
                      {s.label}
                    </p>
                  </div>
                  {i < claimSteps.length - 1 && (
                    <div className="w-20 h-1 mx-4 rounded-full bg-muted overflow-hidden">
                      <div
                        className={cn(
                          "h-full transition-all duration-500",
                          s.status === "completed" ? "w-full bg-success" : "w-0"
                        )}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Policy Selection */}
        <Card className="border-0 shadow-soft">
          <CardHeader>
            <CardTitle className="text-lg">选择保单与受试者</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>关联保单</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="选择保单" />
                </SelectTrigger>
                <SelectContent>
                  {mockPolicies.map((policy) => (
                    <SelectItem key={policy.id} value={policy.id}>
                      {policy.id} - {policy.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>受试者</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="选择受试者" />
                </SelectTrigger>
                <SelectContent>
                  {mockPolicies.map((policy) => (
                    <SelectItem key={policy.subjectId} value={policy.subjectId}>
                      {policy.subjectId}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Document Upload */}
        <Card className="border-0 shadow-soft">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Camera className="w-5 h-5 text-primary" />
              上传理赔凭证
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                className={cn(
                  "h-32 flex-col gap-2 border-dashed border-2 hover:bg-primary/5 hover:border-primary transition-all",
                  uploadedFiles.includes("invoice") && "border-success bg-success/5"
                )}
                onClick={() => handleFileUpload("invoice")}
              >
                {uploadedFiles.includes("invoice") ? (
                  <CheckCircle className="w-8 h-8 text-success" />
                ) : (
                  <Upload className="w-8 h-8 text-muted-foreground" />
                )}
                <span className="text-sm">医疗发票</span>
                {uploadedFiles.includes("invoice") && (
                  <span className="text-xs text-success">已识别金额</span>
                )}
              </Button>
              <Button
                variant="outline"
                className={cn(
                  "h-32 flex-col gap-2 border-dashed border-2 hover:bg-primary/5 hover:border-primary transition-all",
                  uploadedFiles.includes("medical") && "border-success bg-success/5"
                )}
                onClick={() => handleFileUpload("medical")}
              >
                {uploadedFiles.includes("medical") ? (
                  <CheckCircle className="w-8 h-8 text-success" />
                ) : (
                  <FileText className="w-8 h-8 text-muted-foreground" />
                )}
                <span className="text-sm">病历资料</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Claim Calculation */}
        <Card className="border-0 shadow-soft">
          <CardHeader>
            <CardTitle className="text-lg">理算明细</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>发票总额 (元)</Label>
                <Input
                  type="number"
                  value={invoiceAmount}
                  onChange={(e) => setInvoiceAmount(e.target.value)}
                  placeholder="自动识别或手动输入"
                />
              </div>
              <div className="space-y-2">
                <Label>医保统筹 (元)</Label>
                <Input
                  type="number"
                  value={medicalInsurance}
                  onChange={(e) => setMedicalInsurance(e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>

            {/* Formula Card */}
            <div className="p-6 rounded-2xl bg-muted/50 space-y-4">
              <p className="text-sm text-center text-muted-foreground">理算公式</p>
              <div className="flex items-center justify-center gap-2 flex-wrap font-mono">
                <span className="px-3 py-1 rounded-lg bg-card">¥{invoiceNum.toLocaleString()}</span>
                <span className="text-muted-foreground">-</span>
                <span className="px-3 py-1 rounded-lg bg-card">¥{medicalNum.toLocaleString()}</span>
                <span className="text-muted-foreground">-</span>
                <span className="px-3 py-1 rounded-lg bg-card">¥{deductible}</span>
                <span className="text-muted-foreground">×</span>
                <span className="px-3 py-1 rounded-lg bg-card">{(paymentRatio * 100)}%</span>
              </div>
              <p className="text-xs text-center text-muted-foreground">
                (发票总额 - 医保统筹 - 免赔额) × 赔付比例
              </p>
            </div>

            {/* Result */}
            <div className="p-8 rounded-2xl bg-gradient-to-br from-success to-success/80 text-center text-success-foreground">
              <p className="text-sm opacity-80">预计赔付金额</p>
              <p className="text-5xl font-bold mt-2">¥{claimAmount.toLocaleString()}</p>
            </div>

            {claimAmount > 0 && (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-accent/10 border border-accent/20">
                <AlertCircle className="w-5 h-5 text-accent-foreground flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-accent-foreground">温馨提示</p>
                  <p className="text-muted-foreground mt-1">
                    提交后预计1-3个工作日内完成审核，审核通过后款项将直接打入您的银行账户。
                  </p>
                </div>
              </div>
            )}

            <Button className="w-full" size="lg" disabled={claimAmount <= 0}>
              <CreditCard className="w-4 h-4 mr-2" />
              提交理赔申请
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

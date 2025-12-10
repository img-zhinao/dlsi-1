import { useState } from "react";
import { AlertTriangle, FileText, Calculator, Send, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

interface Project {
  id: string;
  name: string;
  company: string;
  riskScore: number;
  subjectCount: number;
  phase: string;
  status: string;
}

const projects: Project[] = [
  { id: "P001", name: "某I期肿瘤药物试验", company: "恒瑞医药", riskScore: 72, subjectCount: 30, phase: "I期", status: "待核保" },
  { id: "P002", name: "糖尿病新药II期临床", company: "信达生物", riskScore: 45, subjectCount: 200, phase: "II期", status: "待核保" },
  { id: "P003", name: "CAR-T免疫疗法试验", company: "药明巨诺", riskScore: 88, subjectCount: 15, phase: "I期", status: "待核保" },
  { id: "P004", name: "心血管器械III期试验", company: "微创医疗", riskScore: 35, subjectCount: 500, phase: "III期", status: "待核保" },
];

const riskTags = [
  { tag: "涉及未成年人", severity: "high" },
  { tag: "CAR-T疗法", severity: "high" },
  { tag: "I期临床", severity: "medium" },
  { tag: "肿瘤适应症", severity: "medium" },
  { tag: "首次人体试验", severity: "high" },
];

const getRiskColor = (score: number) => {
  if (score >= 70) return "text-destructive";
  if (score >= 40) return "text-accent-foreground";
  return "text-success";
};

const getRiskBg = (score: number) => {
  if (score >= 70) return "bg-destructive/10 border-destructive/20";
  if (score >= 40) return "bg-accent/20 border-accent/30";
  return "bg-success/10 border-success/20";
};

export default function Underwriting() {
  const [selectedProject, setSelectedProject] = useState<Project>(projects[0]);
  const [riskFactor, setRiskFactor] = useState([1.5]);

  const baseRate = 800; // 基础单例费率
  const totalPremium = selectedProject.subjectCount * baseRate * riskFactor[0];

  return (
    <div className="h-screen flex animate-slide-up">
      {/* Left Panel - Project List */}
      <div className="w-96 border-r border-border bg-card overflow-auto">
        <div className="p-6 border-b border-border">
          <h2 className="text-xl font-bold">待处理询价</h2>
          <p className="text-sm text-muted-foreground mt-1">{projects.length} 个项目待核保</p>
        </div>
        <div className="p-4 space-y-3">
          {projects.map((project) => (
            <Card
              key={project.id}
              className={cn(
                "cursor-pointer transition-all border hover:shadow-soft",
                selectedProject.id === project.id
                  ? "border-primary bg-primary/5 shadow-soft"
                  : "border-transparent hover:border-border"
              )}
              onClick={() => setSelectedProject(project)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{project.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{project.company}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="px-2 py-0.5 rounded text-xs bg-secondary text-secondary-foreground">
                        {project.phase}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {project.subjectCount}例
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg border",
                        getRiskBg(project.riskScore),
                        getRiskColor(project.riskScore)
                      )}
                    >
                      {project.riskScore}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">风险分</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Right Panel - Details */}
      <div className="flex-1 overflow-auto p-8 space-y-6">
        {/* Project Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="font-mono">{selectedProject.id}</span>
              <ChevronRight className="w-4 h-4" />
              <span>{selectedProject.company}</span>
            </div>
            <h1 className="text-2xl font-bold mt-2">{selectedProject.name}</h1>
          </div>
          <div
            className={cn(
              "px-6 py-4 rounded-2xl border text-center",
              getRiskBg(selectedProject.riskScore)
            )}
          >
            <p className={cn("text-4xl font-bold", getRiskColor(selectedProject.riskScore))}>
              {selectedProject.riskScore}
            </p>
            <p className="text-xs text-muted-foreground">AI风险评分</p>
          </div>
        </div>

        {/* Risk Tags */}
        <Card className="border-0 shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertTriangle className="w-5 h-5 text-accent" />
              风险标签云
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {riskTags.map((item, i) => (
                <span
                  key={i}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-medium transition-transform hover:scale-105",
                    item.severity === "high"
                      ? "bg-destructive/10 text-destructive border border-destructive/20"
                      : "bg-accent/20 text-accent-foreground border border-accent/30"
                  )}
                >
                  {item.tag}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pricing Calculator */}
        <Card className="border-0 shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calculator className="w-5 h-5 text-primary" />
              动态定价面板
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Formula Display */}
            <div className="p-6 rounded-2xl bg-muted/50 font-mono text-center">
              <p className="text-sm text-muted-foreground mb-2">保费计算公式</p>
              <p className="text-lg">
                <span className="text-primary font-bold">{selectedProject.subjectCount}</span>
                <span className="text-muted-foreground mx-2">×</span>
                <span className="text-primary font-bold">¥{baseRate}</span>
                <span className="text-muted-foreground mx-2">×</span>
                <span className="text-accent font-bold">{riskFactor[0].toFixed(2)}</span>
                <span className="text-muted-foreground mx-2">=</span>
                <span className="text-success font-bold text-xl">¥{totalPremium.toLocaleString()}</span>
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                受试者人数 × 单例费率 × 风险系数 = 总保费
              </p>
            </div>

            {/* Risk Factor Slider */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">风险系数调整</label>
                <span className="text-2xl font-bold text-accent">{riskFactor[0].toFixed(2)}</span>
              </div>
              <Slider
                value={riskFactor}
                onValueChange={setRiskFactor}
                min={0.8}
                max={2.5}
                step={0.05}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>低风险 0.8</span>
                <span>标准 1.0</span>
                <span>高风险 2.5</span>
              </div>
            </div>

            {/* Result */}
            <div className="p-8 rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground text-center">
              <p className="text-sm opacity-80">建议保费</p>
              <p className="text-5xl font-bold mt-2">¥{totalPremium.toLocaleString()}</p>
              <p className="text-sm opacity-80 mt-2">
                单例保费 ¥{(totalPremium / selectedProject.subjectCount).toFixed(0)}
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <Button className="flex-1" size="lg">
                <FileText className="w-4 h-4 mr-2" />
                生成正式报价单
              </Button>
              <Button variant="outline" size="lg" className="flex-1">
                <Send className="w-4 h-4 mr-2" />
                转人工复核
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

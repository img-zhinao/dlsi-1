import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, FileText, Calculator, Send, ChevronRight, Search, Filter, RefreshCw, Check, X, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tables } from "@/integrations/supabase/types";

type Project = Tables<"projects">;

const statusOptions = [
  { value: "all", label: "全部状态" },
  { value: "pending", label: "待核保" },
  { value: "quoted", label: "已报价" },
  { value: "approved", label: "已批准" },
  { value: "rejected", label: "已拒绝" },
];

const phaseOptions = [
  { value: "all", label: "全部分期" },
  { value: "I期", label: "I期" },
  { value: "II期", label: "II期" },
  { value: "III期", label: "III期" },
  { value: "IV期", label: "IV期" },
];

const getStatusBadge = (status: string | null) => {
  switch (status) {
    case "pending":
      return <Badge variant="outline" className="bg-accent/20 text-accent-foreground border-accent/30"><Clock className="w-3 h-3 mr-1" />待核保</Badge>;
    case "quoted":
      return <Badge variant="outline" className="bg-primary/20 text-primary border-primary/30"><FileText className="w-3 h-3 mr-1" />已报价</Badge>;
    case "approved":
      return <Badge variant="outline" className="bg-success/20 text-success border-success/30"><Check className="w-3 h-3 mr-1" />已批准</Badge>;
    case "rejected":
      return <Badge variant="outline" className="bg-destructive/20 text-destructive border-destructive/30"><X className="w-3 h-3 mr-1" />已拒绝</Badge>;
    default:
      return <Badge variant="outline">未知</Badge>;
  }
};

const getRiskColor = (score: number | null) => {
  if (!score) return "text-muted-foreground";
  if (score >= 70) return "text-destructive";
  if (score >= 40) return "text-accent-foreground";
  return "text-success";
};

const getRiskBg = (score: number | null) => {
  if (!score) return "bg-muted border-muted-foreground/20";
  if (score >= 70) return "bg-destructive/10 border-destructive/20";
  if (score >= 40) return "bg-accent/20 border-accent/30";
  return "bg-success/10 border-success/20";
};

export default function Underwriting() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [riskFactor, setRiskFactor] = useState([1.5]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [phaseFilter, setPhaseFilter] = useState("all");

  // Fetch projects from database
  const { data: projects = [], isLoading, refetch } = useQuery({
    queryKey: ["underwriting-projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as Project[];
    },
  });

  // Filter projects based on search and filters
  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const matchesSearch = 
        searchQuery === "" ||
        project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.project_code?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || project.status === statusFilter;
      const matchesPhase = phaseFilter === "all" || project.trial_phase === phaseFilter;
      
      return matchesSearch && matchesStatus && matchesPhase;
    });
  }, [projects, searchQuery, statusFilter, phaseFilter]);

  // Get selected project
  const selectedProject = useMemo(() => {
    if (selectedProjectId) {
      return filteredProjects.find(p => p.id === selectedProjectId) || filteredProjects[0];
    }
    return filteredProjects[0];
  }, [selectedProjectId, filteredProjects]);

  // Update project mutation
  const updateProjectMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Project> }) => {
      const { data, error } = await supabase
        .from("projects")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["underwriting-projects"] });
    },
  });

  const baseRate = 800;
  const totalPremium = selectedProject 
    ? (selectedProject.subject_count || 0) * baseRate * riskFactor[0] 
    : 0;

  const handleGenerateQuote = async () => {
    if (!selectedProject) return;
    
    try {
      await updateProjectMutation.mutateAsync({
        id: selectedProject.id,
        updates: {
          status: "quoted",
          final_premium: totalPremium,
        },
      });
      
      toast({
        title: "报价单已生成",
        description: `项目 ${selectedProject.project_code} 报价金额：¥${totalPremium.toLocaleString()}`,
      });
    } catch (error) {
      toast({
        title: "操作失败",
        description: "生成报价单时出错，请重试",
        variant: "destructive",
      });
    }
  };

  const handleApprove = async () => {
    if (!selectedProject) return;
    
    try {
      await updateProjectMutation.mutateAsync({
        id: selectedProject.id,
        updates: { status: "approved" },
      });
      
      toast({
        title: "项目已批准",
        description: `项目 ${selectedProject.project_code} 已批准出单`,
      });
    } catch (error) {
      toast({
        title: "操作失败",
        variant: "destructive",
      });
    }
  };

  const handleReject = async () => {
    if (!selectedProject) return;
    
    try {
      await updateProjectMutation.mutateAsync({
        id: selectedProject.id,
        updates: { status: "rejected" },
      });
      
      toast({
        title: "项目已拒绝",
        description: `项目 ${selectedProject.project_code} 已拒绝承保`,
      });
    } catch (error) {
      toast({
        title: "操作失败",
        variant: "destructive",
      });
    }
  };

  // Stats
  const stats = useMemo(() => ({
    total: projects.length,
    pending: projects.filter(p => p.status === "pending").length,
    quoted: projects.filter(p => p.status === "quoted").length,
    approved: projects.filter(p => p.status === "approved").length,
  }), [projects]);

  return (
    <div className="h-screen flex animate-slide-up">
      {/* Left Panel - Project List */}
      <div className="w-[420px] border-r border-border bg-card overflow-hidden flex flex-col">
        <div className="p-6 border-b border-border space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">核保驾驶舱</h2>
              <p className="text-sm text-muted-foreground mt-1">
                共 {stats.total} 个项目，{stats.pending} 个待处理
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => refetch()}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>

          {/* Stats Pills */}
          <div className="flex gap-2">
            <Badge variant="secondary" className="px-3 py-1">
              待核保 <span className="ml-1 font-bold">{stats.pending}</span>
            </Badge>
            <Badge variant="secondary" className="px-3 py-1">
              已报价 <span className="ml-1 font-bold">{stats.quoted}</span>
            </Badge>
            <Badge variant="secondary" className="px-3 py-1">
              已批准 <span className="ml-1 font-bold">{stats.approved}</span>
            </Badge>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="搜索项目名称、公司或编号..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {/* Filters */}
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="flex-1">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={phaseFilter} onValueChange={setPhaseFilter}>
              <SelectTrigger className="flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {phaseOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Project List */}
        <div className="flex-1 overflow-auto p-4 space-y-3">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="p-4">
                <div className="flex gap-4">
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-6 w-20" />
                  </div>
                  <Skeleton className="w-12 h-12 rounded-xl" />
                </div>
              </Card>
            ))
          ) : filteredProjects.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>没有找到匹配的项目</p>
            </div>
          ) : (
            filteredProjects.map((project) => (
              <Card
                key={project.id}
                className={cn(
                  "cursor-pointer transition-all border hover:shadow-soft",
                  selectedProject?.id === project.id
                    ? "border-primary bg-primary/5 shadow-soft"
                    : "border-transparent hover:border-border"
                )}
                onClick={() => setSelectedProjectId(project.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-muted-foreground">
                          {project.project_code}
                        </span>
                        {getStatusBadge(project.status)}
                      </div>
                      <p className="font-medium text-sm truncate">{project.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">{project.company_name}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="px-2 py-0.5 rounded text-xs bg-secondary text-secondary-foreground">
                          {project.trial_phase || "未知"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {project.subject_count || 0}例
                        </span>
                      </div>
                    </div>
                    <div className="text-right ml-3">
                      <div
                        className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg border",
                          getRiskBg(project.ai_risk_score),
                          getRiskColor(project.ai_risk_score)
                        )}
                      >
                        {project.ai_risk_score || "—"}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">风险分</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Right Panel - Details */}
      <div className="flex-1 overflow-auto p-8 space-y-6">
        {!selectedProject ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center">
              <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>选择一个项目查看详情</p>
            </div>
          </div>
        ) : (
          <>
            {/* Project Header */}
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="font-mono">{selectedProject.project_code}</span>
                  <ChevronRight className="w-4 h-4" />
                  <span>{selectedProject.company_name}</span>
                  {getStatusBadge(selectedProject.status)}
                </div>
                <h1 className="text-2xl font-bold mt-2">{selectedProject.name}</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedProject.drug_type} · {selectedProject.indication}
                </p>
              </div>
              <div
                className={cn(
                  "px-6 py-4 rounded-2xl border text-center",
                  getRiskBg(selectedProject.ai_risk_score)
                )}
              >
                <p className={cn("text-4xl font-bold", getRiskColor(selectedProject.ai_risk_score))}>
                  {selectedProject.ai_risk_score || "—"}
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
                  {selectedProject.risk_factors && selectedProject.risk_factors.length > 0 ? (
                    selectedProject.risk_factors.map((factor, i) => (
                      <span
                        key={i}
                        className="px-4 py-2 rounded-full text-sm font-medium bg-accent/20 text-accent-foreground border border-accent/30"
                      >
                        {factor}
                      </span>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-sm">暂无风险标签</p>
                  )}
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
                    <span className="text-primary font-bold">{selectedProject.subject_count || 0}</span>
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

                {/* AI Suggested Range */}
                {(selectedProject.premium_min || selectedProject.premium_max) && (
                  <div className="p-4 rounded-xl bg-secondary/50 text-center">
                    <p className="text-xs text-muted-foreground mb-1">AI建议保费范围</p>
                    <p className="font-bold">
                      ¥{selectedProject.premium_min?.toLocaleString() || "—"} ~ ¥{selectedProject.premium_max?.toLocaleString() || "—"}
                    </p>
                  </div>
                )}

                {/* Result */}
                <div className="p-8 rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground text-center">
                  <p className="text-sm opacity-80">建议保费</p>
                  <p className="text-5xl font-bold mt-2">¥{totalPremium.toLocaleString()}</p>
                  <p className="text-sm opacity-80 mt-2">
                    单例保费 ¥{selectedProject.subject_count ? (totalPremium / selectedProject.subject_count).toFixed(0) : 0}
                  </p>
                </div>

                {/* Actions based on status */}
                <div className="flex gap-4">
                  {selectedProject.status === "pending" && (
                    <>
                      <Button 
                        className="flex-1" 
                        size="lg"
                        onClick={handleGenerateQuote}
                        disabled={updateProjectMutation.isPending}
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        生成正式报价单
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="lg"
                        onClick={handleReject}
                        disabled={updateProjectMutation.isPending}
                      >
                        <X className="w-4 h-4 mr-2" />
                        拒绝
                      </Button>
                    </>
                  )}
                  {selectedProject.status === "quoted" && (
                    <>
                      <Button 
                        className="flex-1" 
                        size="lg"
                        onClick={handleApprove}
                        disabled={updateProjectMutation.isPending}
                      >
                        <Check className="w-4 h-4 mr-2" />
                        批准出单
                      </Button>
                      <Button 
                        variant="outline" 
                        size="lg" 
                        className="flex-1"
                        onClick={handleGenerateQuote}
                        disabled={updateProjectMutation.isPending}
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        重新报价
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="lg"
                        onClick={handleReject}
                        disabled={updateProjectMutation.isPending}
                      >
                        <X className="w-4 h-4 mr-2" />
                        拒绝
                      </Button>
                    </>
                  )}
                  {selectedProject.status === "approved" && (
                    <div className="w-full p-6 rounded-xl bg-success/10 text-center">
                      <Check className="w-8 h-8 mx-auto text-success mb-2" />
                      <p className="font-bold text-success">项目已批准出单</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        最终保费：¥{selectedProject.final_premium?.toLocaleString() || totalPremium.toLocaleString()}
                      </p>
                    </div>
                  )}
                  {selectedProject.status === "rejected" && (
                    <div className="w-full p-6 rounded-xl bg-destructive/10 text-center">
                      <X className="w-8 h-8 mx-auto text-destructive mb-2" />
                      <p className="font-bold text-destructive">项目已拒绝承保</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}

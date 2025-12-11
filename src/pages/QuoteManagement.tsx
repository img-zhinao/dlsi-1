import { useState, useEffect } from "react";
import { Search, Filter, Calendar, FileText, TrendingUp, Clock, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface Project {
  id: string;
  project_code: string | null;
  name: string;
  trial_phase: string | null;
  subject_count: number | null;
  drug_type: string | null;
  indication: string | null;
  ai_risk_score: number | null;
  premium_min: number | null;
  premium_max: number | null;
  final_premium: number | null;
  status: string | null;
  created_at: string;
  folder_id: string | null;
}

interface InquiryFolder {
  id: string;
  name: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: "待处理", color: "bg-yellow-100 text-yellow-800", icon: Clock },
  quoted: { label: "已报价", color: "bg-blue-100 text-blue-800", icon: FileText },
  approved: { label: "已批准", color: "bg-green-100 text-green-800", icon: CheckCircle2 },
  rejected: { label: "已拒绝", color: "bg-red-100 text-red-800", icon: XCircle },
  underwriting: { label: "核保中", color: "bg-purple-100 text-purple-800", icon: AlertCircle },
};

export default function QuoteManagement() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [folders, setFolders] = useState<InquiryFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [folderFilter, setFolderFilter] = useState<string>("all");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [projectsRes, foldersRes] = await Promise.all([
      supabase.from("projects").select("*").order("created_at", { ascending: false }),
      supabase.from("inquiry_folders").select("id, name"),
    ]);

    if (!projectsRes.error && projectsRes.data) {
      setProjects(projectsRes.data);
    }
    if (!foldersRes.error && foldersRes.data) {
      setFolders(foldersRes.data);
    }
    setLoading(false);
  };

  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      !searchTerm ||
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.project_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.indication?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || project.status === statusFilter;
    const matchesFolder =
      folderFilter === "all" ||
      (folderFilter === "none" && !project.folder_id) ||
      project.folder_id === folderFilter;

    return matchesSearch && matchesStatus && matchesFolder;
  });

  // Stats
  const totalProjects = projects.length;
  const quotedProjects = projects.filter((p) => p.status === "quoted").length;
  const approvedProjects = projects.filter((p) => p.status === "approved").length;
  const totalPremium = projects
    .filter((p) => p.final_premium)
    .reduce((sum, p) => sum + (p.final_premium || 0), 0);

  const formatCurrency = (value: number | null) => {
    if (!value) return "-";
    return `¥${(value / 10000).toFixed(1)}万`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">报价管理</h1>
        <p className="text-muted-foreground">查看和管理所有历史报价记录</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalProjects}</p>
                <p className="text-sm text-muted-foreground">总询价数</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{quotedProjects}</p>
                <p className="text-sm text-muted-foreground">已报价</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{approvedProjects}</p>
                <p className="text-sm text-muted-foreground">已批准</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100">
                <Calendar className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatCurrency(totalPremium)}</p>
                <p className="text-sm text-muted-foreground">总保费</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="搜索项目名称、编号或适应症..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="状态筛选" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="pending">待处理</SelectItem>
                <SelectItem value="quoted">已报价</SelectItem>
                <SelectItem value="underwriting">核保中</SelectItem>
                <SelectItem value="approved">已批准</SelectItem>
                <SelectItem value="rejected">已拒绝</SelectItem>
              </SelectContent>
            </Select>
            <Select value={folderFilter} onValueChange={setFolderFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="文件夹筛选" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部文件夹</SelectItem>
                <SelectItem value="none">未分类</SelectItem>
                {folders.map((folder) => (
                  <SelectItem key={folder.id} value={folder.id}>
                    {folder.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">报价记录 ({filteredProjects.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">加载中...</div>
          ) : filteredProjects.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              暂无报价记录
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>项目编号</TableHead>
                  <TableHead>项目名称</TableHead>
                  <TableHead>试验分期</TableHead>
                  <TableHead>受试者</TableHead>
                  <TableHead>风险评分</TableHead>
                  <TableHead>报价范围</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>创建时间</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProjects.map((project) => {
                  const status = statusConfig[project.status || "pending"];
                  const StatusIcon = status?.icon || Clock;
                  return (
                    <TableRow key={project.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell className="font-mono text-sm">
                        {project.project_code || "-"}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{project.name}</p>
                          {project.indication && (
                            <p className="text-xs text-muted-foreground">{project.indication}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{project.trial_phase || "-"}</TableCell>
                      <TableCell>{project.subject_count ? `${project.subject_count}例` : "-"}</TableCell>
                      <TableCell>
                        {project.ai_risk_score ? (
                          <div className="flex items-center gap-2">
                            <div
                              className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold",
                                project.ai_risk_score >= 70
                                  ? "bg-red-100 text-red-700"
                                  : project.ai_risk_score >= 50
                                  ? "bg-yellow-100 text-yellow-700"
                                  : "bg-green-100 text-green-700"
                              )}
                            >
                              {project.ai_risk_score}
                            </div>
                          </div>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        {project.premium_min && project.premium_max ? (
                          <span className="text-sm">
                            {formatCurrency(project.premium_min)} - {formatCurrency(project.premium_max)}
                          </span>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={cn("gap-1", status?.color)}>
                          <StatusIcon className="w-3 h-3" />
                          {status?.label || "未知"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {format(new Date(project.created_at), "MM/dd HH:mm", { locale: zhCN })}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

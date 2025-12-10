import { ArrowUpRight, ArrowDownRight, TrendingUp, Users, FileText, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const stats = [
  {
    title: "本月询价",
    value: "127",
    change: "+12%",
    trend: "up",
    icon: FileText,
  },
  {
    title: "成功承保",
    value: "89",
    change: "+8%",
    trend: "up",
    icon: TrendingUp,
  },
  {
    title: "受试者覆盖",
    value: "4,280",
    change: "+23%",
    trend: "up",
    icon: Users,
  },
  {
    title: "保费收入",
    value: "¥2.4M",
    change: "-3%",
    trend: "down",
    icon: DollarSign,
  },
];

const recentProjects = [
  { id: "P001", name: "某I期肿瘤药物试验", phase: "I期", subjects: 30, status: "待报价", riskScore: 72 },
  { id: "P002", name: "糖尿病新药II期临床", phase: "II期", subjects: 200, status: "核保中", riskScore: 45 },
  { id: "P003", name: "CAR-T免疫疗法试验", phase: "I期", subjects: 15, status: "已承保", riskScore: 88 },
  { id: "P004", name: "心血管器械III期试验", phase: "III期", subjects: 500, status: "待报价", riskScore: 35 },
];

const getRiskColor = (score: number) => {
  if (score >= 70) return "text-destructive bg-destructive/10";
  if (score >= 40) return "text-accent-foreground bg-accent/30";
  return "text-success bg-success/10";
};

export default function Overview() {
  return (
    <div className="p-8 space-y-8 animate-slide-up">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">欢迎回来</h1>
        <p className="text-muted-foreground mt-1">以下是您的业务概览</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.title} className="border-0 shadow-soft hover:shadow-card transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <stat.icon className="w-6 h-6 text-primary" />
                </div>
                <div className={`flex items-center gap-1 text-sm font-medium ${stat.trend === 'up' ? 'text-success' : 'text-destructive'}`}>
                  {stat.change}
                  {stat.trend === 'up' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                </div>
              </div>
              <div className="mt-4">
                <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{stat.title}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Projects */}
      <Card className="border-0 shadow-soft">
        <CardHeader>
          <CardTitle className="text-xl">最新询价项目</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">项目编号</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">项目名称</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">试验分期</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">受试者数</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">风险评分</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">状态</th>
                </tr>
              </thead>
              <tbody>
                {recentProjects.map((project) => (
                  <tr key={project.id} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                    <td className="py-4 px-4 text-sm font-mono text-primary">{project.id}</td>
                    <td className="py-4 px-4 text-sm font-medium">{project.name}</td>
                    <td className="py-4 px-4">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                        {project.phase}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-sm">{project.subjects}例</td>
                    <td className="py-4 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${getRiskColor(project.riskScore)}`}>
                        {project.riskScore}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        project.status === '已承保' ? 'bg-success/10 text-success' :
                        project.status === '核保中' ? 'bg-accent/30 text-accent-foreground' :
                        'bg-primary/10 text-primary'
                      }`}>
                        {project.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

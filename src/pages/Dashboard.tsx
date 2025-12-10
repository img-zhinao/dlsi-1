import { TrendingUp, Clock, AlertCircle, CheckCircle, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from "recharts";

const funnelData = [
  { stage: "询价", value: 127, color: "hsl(220, 56%, 45%)" },
  { stage: "报价", value: 98, color: "hsl(220, 56%, 55%)" },
  { stage: "投保", value: 72, color: "hsl(45, 100%, 55%)" },
  { stage: "支付", value: 65, color: "hsl(142, 76%, 36%)" },
];

const timeMetrics = [
  { name: "平均报价耗时", value: 4.2, target: 5, unit: "分钟", status: "good" },
  { name: "平均核保耗时", value: 2.1, target: 4, unit: "小时", status: "good" },
  { name: "平均理赔结案", value: 3.5, target: 3, unit: "天", status: "warning" },
];

const taskBoard = [
  { agent: "AI询价助手", pending: 12, processing: 5, color: "hsl(220, 56%, 45%)" },
  { agent: "核保引擎", pending: 8, processing: 3, color: "hsl(45, 100%, 55%)" },
  { agent: "保司审核", pending: 5, processing: 2, color: "hsl(142, 76%, 36%)" },
  { agent: "理赔处理", pending: 15, processing: 7, color: "hsl(0, 84%, 60%)" },
];

const monthlyData = [
  { month: "7月", 询价: 85, 承保: 52 },
  { month: "8月", 询价: 92, 承保: 61 },
  { month: "9月", 询价: 108, 承保: 75 },
  { month: "10月", 询价: 115, 承保: 82 },
  { month: "11月", 询价: 127, 承保: 89 },
];

export default function Dashboard() {
  const totalFunnelValue = funnelData[0].value;

  return (
    <div className="p-8 space-y-6 animate-slide-up">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">业务监控大屏</h1>
        <p className="text-muted-foreground mt-1">实时追踪各智能体运行状态</p>
      </div>

      {/* Top Stats Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Funnel Chart */}
        <Card className="border-0 shadow-soft lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              实时转化漏斗
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between gap-4">
              {funnelData.map((item, i) => (
                <div key={item.stage} className="flex-1 text-center">
                  <div className="relative">
                    <div
                      className="mx-auto rounded-2xl flex items-center justify-center transition-all hover:scale-105"
                      style={{
                        width: `${60 + (4 - i) * 15}%`,
                        height: "80px",
                        backgroundColor: item.color,
                      }}
                    >
                      <span className="text-2xl font-bold text-white">{item.value}</span>
                    </div>
                  </div>
                  <p className="mt-3 font-medium">{item.stage}</p>
                  <p className="text-sm text-muted-foreground">
                    {((item.value / totalFunnelValue) * 100).toFixed(0)}%
                  </p>
                  {i < funnelData.length - 1 && (
                    <ArrowRight className="absolute right-0 top-1/2 -translate-y-1/2 text-muted-foreground hidden lg:block" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Time Metrics */}
        <Card className="border-0 shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              时效仪表盘
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {timeMetrics.map((metric) => (
              <div key={metric.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{metric.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold">{metric.value}</span>
                    <span className="text-sm text-muted-foreground">{metric.unit}</span>
                    {metric.status === "good" ? (
                      <CheckCircle className="w-4 h-4 text-success" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-accent" />
                    )}
                  </div>
                </div>
                <Progress
                  value={(metric.value / metric.target) * 100}
                  className="h-2"
                />
                <p className="text-xs text-muted-foreground text-right">
                  目标: &lt; {metric.target} {metric.unit}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Task Board */}
        <Card className="border-0 shadow-soft">
          <CardHeader>
            <CardTitle>智能体任务看板</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {taskBoard.map((task) => (
                <div
                  key={task.agent}
                  className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div
                    className="w-3 h-12 rounded-full"
                    style={{ backgroundColor: task.color }}
                  />
                  <div className="flex-1">
                    <p className="font-medium">{task.agent}</p>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-sm text-muted-foreground">
                        待处理: <span className="font-bold text-foreground">{task.pending}</span>
                      </span>
                      <span className="text-sm text-muted-foreground">
                        处理中: <span className="font-bold text-foreground">{task.processing}</span>
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{task.pending + task.processing}</p>
                    <p className="text-xs text-muted-foreground">总任务</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Monthly Trend */}
        <Card className="border-0 shadow-soft">
          <CardHeader>
            <CardTitle>月度趋势</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={monthlyData}>
                <XAxis dataKey="month" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "12px",
                  }}
                />
                <Legend />
                <Bar dataKey="询价" fill="hsl(220, 56%, 45%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="承保" fill="hsl(142, 76%, 36%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

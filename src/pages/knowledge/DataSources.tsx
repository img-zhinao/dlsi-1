import { Database } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DataSources() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">外部数据源管理</h1>
        <p className="text-muted-foreground">配置和管理外部数据接口</p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            数据源配置
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">功能开发中...</p>
        </CardContent>
      </Card>
    </div>
  );
}

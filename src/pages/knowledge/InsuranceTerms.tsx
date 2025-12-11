import { FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function InsuranceTerms() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">保险条款管理</h1>
        <p className="text-muted-foreground">管理保险条款模板和配置</p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            条款库
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">功能开发中...</p>
        </CardContent>
      </Card>
    </div>
  );
}

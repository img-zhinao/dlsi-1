import { FileText, Download, Printer, Eye, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useState } from "react";

interface DocumentPreviewProps {
  title: string;
  description: string;
  htmlContent?: string;
  onGenerate: () => Promise<void>;
  onDownload: () => void;
  onPrint: () => void;
  isGenerating: boolean;
  isGenerated: boolean;
}

export function DocumentPreview({
  title,
  description,
  htmlContent,
  onGenerate,
  onDownload,
  onPrint,
  isGenerating,
  isGenerated,
}: DocumentPreviewProps) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  return (
    <Card className="border shadow-soft hover:shadow-card transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">{title}</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            </div>
          </div>
          {isGenerated && (
            <CheckCircle className="w-5 h-5 text-success" />
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          {!isGenerated ? (
            <Button
              onClick={onGenerate}
              disabled={isGenerating}
              className="flex-1"
            >
              {isGenerating ? "生成中..." : "一键生成"}
            </Button>
          ) : (
            <>
              <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Eye className="w-4 h-4 mr-1" />
                    预览
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
                  <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                  </DialogHeader>
                  <div
                    className="mt-4"
                    dangerouslySetInnerHTML={{ __html: htmlContent || "" }}
                  />
                </DialogContent>
              </Dialog>
              <Button variant="outline" size="sm" onClick={onDownload}>
                <Download className="w-4 h-4 mr-1" />
                下载
              </Button>
              <Button variant="outline" size="sm" onClick={onPrint}>
                <Printer className="w-4 h-4 mr-1" />
                打印
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

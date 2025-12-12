import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  FileText, 
  Tag, 
  Save, 
  ChevronLeft, 
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Highlighter,
  Download,
  Upload,
  Trash2,
  Plus
} from "lucide-react";
import { toast } from "sonner";

// 标注字段配置
const ANNOTATION_FIELDS = [
  { id: "trial_phase", label: "试验分期", type: "select", options: ["I期", "II期", "III期", "IV期", "I/II期", "II/III期"], color: "bg-blue-500" },
  { id: "subject_count", label: "受试者人数", type: "number", color: "bg-green-500" },
  { id: "drug_type", label: "药物类型", type: "select", options: ["化学药", "生物制品", "中药", "细胞治疗", "基因治疗"], color: "bg-purple-500" },
  { id: "indication", label: "适应症", type: "text", color: "bg-orange-500" },
  { id: "duration_months", label: "试验周期(月)", type: "number", color: "bg-cyan-500" },
  { id: "site_count", label: "研究中心数量", type: "number", color: "bg-pink-500" },
  { id: "sponsor", label: "申办方", type: "text", color: "bg-yellow-500" },
  { id: "inclusion_criteria", label: "入排标准", type: "textarea", color: "bg-red-500" },
  { id: "risk_factors", label: "风险因素", type: "tags", color: "bg-indigo-500" },
];

// 模拟文档列表
const MOCK_DOCUMENTS = [
  { id: "1", name: "NCT12345678_Protocol_v1.0.pdf", status: "pending", progress: 0 },
  { id: "2", name: "Phase2_Oncology_Trial.pdf", status: "in_progress", progress: 60 },
  { id: "3", name: "Diabetes_Study_Protocol.pdf", status: "completed", progress: 100 },
  { id: "4", name: "Cardiovascular_Trial_v2.1.pdf", status: "pending", progress: 0 },
];

// 模拟PDF文本内容
const MOCK_PDF_TEXT = `
临床试验方案

方案编号：ABC-2024-001
版本号：1.0
日期：2024年1月15日

1. 试验概述

本研究是一项随机、双盲、安慰剂对照的III期临床试验，旨在评估ABC-001注射液治疗晚期非小细胞肺癌（NSCLC）的有效性和安全性。

2. 试验目的

主要目的：评估ABC-001联合标准化疗方案对比安慰剂联合标准化疗方案在晚期NSCLC患者中的无进展生存期（PFS）。

3. 试验设计

3.1 受试者人数
计划入组480例受试者，按1:1比例随机分配至试验组和对照组。

3.2 试验周期
预计试验周期为24个月，包括12个月的入组期和12个月的随访期。

3.3 研究中心
本研究将在全国15家三级甲等医院开展。

4. 药物信息

试验药物：ABC-001注射液
药物类型：生物制品（重组人源化单克隆抗体）
给药途径：静脉滴注
给药剂量：10mg/kg，每3周一次

5. 入选标准

- 年龄18-75岁，性别不限
- 经组织学或细胞学确诊的晚期NSCLC（IIIB期或IV期）
- ECOG体能状态评分0-1分
- 预期生存期≥3个月
- 既往未接受过系统性抗肿瘤治疗

6. 排除标准

- 存在脑转移或脊髓压迫
- 既往有严重过敏反应史
- 存在未控制的高血压或糖尿病
- 妊娠或哺乳期女性

7. 风险评估

主要风险因素：
- 肿瘤适应症（晚期NSCLC）
- 生物制品相关免疫反应
- 联合化疗毒性
- III期大规模试验的操作风险

8. 申办方信息

申办方：ABC生物制药有限公司
地址：上海市浦东新区张江高科技园区
联系人：张三
电话：021-12345678
`;

interface Annotation {
  fieldId: string;
  value: string | number | string[];
  textSelection?: {
    start: number;
    end: number;
    text: string;
  };
}

const AnnotationPlatform = () => {
  const [documents] = useState(MOCK_DOCUMENTS);
  const [currentDocIndex, setCurrentDocIndex] = useState(1);
  const [annotations, setAnnotations] = useState<Record<string, Annotation>>({});
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [selectedText, setSelectedText] = useState<string>("");
  const [newTag, setNewTag] = useState("");

  const currentDoc = documents[currentDocIndex];
  const completedFields = Object.keys(annotations).length;
  const totalFields = ANNOTATION_FIELDS.length;
  const progress = Math.round((completedFields / totalFields) * 100);

  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim()) {
      setSelectedText(selection.toString().trim());
    }
  };

  const applySelectionToField = (fieldId: string) => {
    if (selectedText) {
      const field = ANNOTATION_FIELDS.find(f => f.id === fieldId);
      let value: string | number = selectedText;
      
      if (field?.type === "number") {
        const numMatch = selectedText.match(/\d+/);
        value = numMatch ? parseInt(numMatch[0]) : 0;
      }
      
      setAnnotations(prev => ({
        ...prev,
        [fieldId]: {
          fieldId,
          value,
          textSelection: {
            start: 0,
            end: selectedText.length,
            text: selectedText
          }
        }
      }));
      setSelectedText("");
      toast.success(`已将选中文本应用到「${field?.label}」`);
    }
  };

  const updateAnnotation = (fieldId: string, value: string | number | string[]) => {
    setAnnotations(prev => ({
      ...prev,
      [fieldId]: {
        fieldId,
        value,
        textSelection: prev[fieldId]?.textSelection
      }
    }));
  };

  const removeAnnotation = (fieldId: string) => {
    setAnnotations(prev => {
      const newAnnotations = { ...prev };
      delete newAnnotations[fieldId];
      return newAnnotations;
    });
  };

  const addTag = (fieldId: string) => {
    if (newTag.trim()) {
      const currentTags = (annotations[fieldId]?.value as string[]) || [];
      updateAnnotation(fieldId, [...currentTags, newTag.trim()]);
      setNewTag("");
    }
  };

  const removeTag = (fieldId: string, tagToRemove: string) => {
    const currentTags = (annotations[fieldId]?.value as string[]) || [];
    updateAnnotation(fieldId, currentTags.filter(t => t !== tagToRemove));
  };

  const saveAnnotations = () => {
    console.log("Saving annotations:", annotations);
    toast.success("标注已保存");
  };

  const exportAnnotations = () => {
    const exportData = {
      document: currentDoc.name,
      annotations: Object.values(annotations).map(a => ({
        field: ANNOTATION_FIELDS.find(f => f.id === a.fieldId)?.label,
        value: a.value,
        source_text: a.textSelection?.text
      }))
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${currentDoc.name.replace(".pdf", "")}_annotations.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("标注数据已导出");
  };

  const renderFieldInput = (field: typeof ANNOTATION_FIELDS[0]) => {
    const annotation = annotations[field.id];
    const value = annotation?.value ?? "";

    switch (field.type) {
      case "select":
        return (
          <Select 
            value={value as string} 
            onValueChange={(v) => updateAnnotation(field.id, v)}
          >
            <SelectTrigger>
              <SelectValue placeholder={`选择${field.label}`} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map(opt => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      
      case "number":
        return (
          <Input
            type="number"
            value={value as number}
            onChange={(e) => updateAnnotation(field.id, parseInt(e.target.value) || 0)}
            placeholder={`输入${field.label}`}
          />
        );
      
      case "textarea":
        return (
          <Textarea
            value={value as string}
            onChange={(e) => updateAnnotation(field.id, e.target.value)}
            placeholder={`输入${field.label}`}
            rows={3}
          />
        );
      
      case "tags":
        return (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-1">
              {((value as string[]) || []).map(tag => (
                <Badge key={tag} variant="secondary" className="gap-1">
                  {tag}
                  <button 
                    onClick={() => removeTag(field.id, tag)}
                    className="ml-1 hover:text-destructive"
                  >
                    ×
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="添加标签"
                onKeyPress={(e) => e.key === "Enter" && addTag(field.id)}
              />
              <Button size="sm" onClick={() => addTag(field.id)}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        );
      
      default:
        return (
          <Input
            value={value as string}
            onChange={(e) => updateAnnotation(field.id, e.target.value)}
            placeholder={`输入${field.label}`}
          />
        );
    }
  };

  return (
    <MainLayout>
      <div className="h-[calc(100vh-4rem)] flex flex-col">
        {/* 顶部工具栏 */}
        <div className="flex items-center justify-between p-4 border-b bg-card">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold">数据标注平台</h1>
            <Badge variant="outline" className="gap-1">
              <FileText className="h-3 w-3" />
              {currentDoc.name}
            </Badge>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>标注进度:</span>
              <Progress value={progress} className="w-32 h-2" />
              <span>{completedFields}/{totalFields}</span>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={exportAnnotations}>
                <Download className="h-4 w-4 mr-1" />
                导出
              </Button>
              <Button size="sm" onClick={saveAnnotations}>
                <Save className="h-4 w-4 mr-1" />
                保存
              </Button>
            </div>
          </div>
        </div>

        {/* 主内容区 */}
        <div className="flex-1 flex overflow-hidden">
          {/* 左侧文档列表 */}
          <div className="w-64 border-r bg-muted/30">
            <div className="p-3 border-b">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">文档列表</span>
                <Button variant="ghost" size="sm">
                  <Upload className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <ScrollArea className="h-[calc(100%-60px)]">
              {documents.map((doc, index) => (
                <div
                  key={doc.id}
                  onClick={() => setCurrentDocIndex(index)}
                  className={`p-3 border-b cursor-pointer transition-colors ${
                    index === currentDocIndex 
                      ? "bg-primary/10 border-l-2 border-l-primary" 
                      : "hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <FileText className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{doc.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {doc.status === "completed" ? (
                          <Badge variant="default" className="text-xs bg-green-500">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            已完成
                          </Badge>
                        ) : doc.status === "in_progress" ? (
                          <Badge variant="secondary" className="text-xs">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            进行中 {doc.progress}%
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">
                            待标注
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </ScrollArea>
          </div>

          {/* 中间PDF预览区 */}
          <div className="flex-1 flex flex-col">
            <div className="p-3 border-b bg-muted/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setCurrentDocIndex(Math.max(0, currentDocIndex - 1))}
                  disabled={currentDocIndex === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm">{currentDocIndex + 1} / {documents.length}</span>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setCurrentDocIndex(Math.min(documents.length - 1, currentDocIndex + 1))}
                  disabled={currentDocIndex === documents.length - 1}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              
              {selectedText && (
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="gap-1">
                    <Highlighter className="h-3 w-3" />
                    已选择: "{selectedText.slice(0, 30)}{selectedText.length > 30 ? "..." : ""}"
                  </Badge>
                  <Select onValueChange={applySelectionToField}>
                    <SelectTrigger className="w-40 h-8">
                      <SelectValue placeholder="应用到字段" />
                    </SelectTrigger>
                    <SelectContent>
                      {ANNOTATION_FIELDS.map(field => (
                        <SelectItem key={field.id} value={field.id}>
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${field.color}`} />
                            {field.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            
            <ScrollArea className="flex-1 p-6">
              <Card>
                <CardContent className="p-6">
                  <pre 
                    className="whitespace-pre-wrap font-sans text-sm leading-relaxed select-text cursor-text"
                    onMouseUp={handleTextSelection}
                  >
                    {MOCK_PDF_TEXT}
                  </pre>
                </CardContent>
              </Card>
            </ScrollArea>
          </div>

          {/* 右侧标注面板 */}
          <div className="w-96 border-l bg-card">
            <Tabs defaultValue="fields" className="h-full flex flex-col">
              <TabsList className="w-full justify-start rounded-none border-b h-12 px-4">
                <TabsTrigger value="fields" className="gap-1">
                  <Tag className="h-4 w-4" />
                  标注字段
                </TabsTrigger>
                <TabsTrigger value="preview" className="gap-1">
                  <FileText className="h-4 w-4" />
                  数据预览
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="fields" className="flex-1 m-0">
                <ScrollArea className="h-[calc(100vh-12rem)]">
                  <div className="p-4 space-y-4">
                    {ANNOTATION_FIELDS.map(field => (
                      <Card 
                        key={field.id}
                        className={`transition-all ${
                          selectedField === field.id ? "ring-2 ring-primary" : ""
                        } ${annotations[field.id] ? "border-green-500/50" : ""}`}
                        onClick={() => setSelectedField(field.id)}
                      >
                        <CardHeader className="py-3 px-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full ${field.color}`} />
                              <Label className="font-medium">{field.label}</Label>
                            </div>
                            <div className="flex items-center gap-1">
                              {annotations[field.id] && (
                                <>
                                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-6 w-6 p-0"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      removeAnnotation(field.id);
                                    }}
                                  >
                                    <Trash2 className="h-3 w-3 text-muted-foreground" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0 px-4 pb-4">
                          {renderFieldInput(field)}
                          {annotations[field.id]?.textSelection && (
                            <p className="text-xs text-muted-foreground mt-2 italic">
                              来源: "{annotations[field.id].textSelection?.text.slice(0, 50)}..."
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>
              
              <TabsContent value="preview" className="flex-1 m-0">
                <ScrollArea className="h-[calc(100vh-12rem)]">
                  <div className="p-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">JSON 数据预览</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto">
                          {JSON.stringify(
                            Object.fromEntries(
                              Object.entries(annotations).map(([key, val]) => [
                                ANNOTATION_FIELDS.find(f => f.id === key)?.label || key,
                                val.value
                              ])
                            ),
                            null,
                            2
                          )}
                        </pre>
                      </CardContent>
                    </Card>
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default AnnotationPlatform;

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2, HelpCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useInsuranceQA } from "@/hooks/useInsuranceQA";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface ProjectContext {
  trialPhase?: string;
  subjectCount?: number;
  drugType?: string;
  indication?: string;
  premiumMin?: number;
  premiumMax?: number;
}

interface InsuranceQAChatProps {
  projectContext?: ProjectContext;
  className?: string;
}

const SUGGESTED_QUESTIONS = [
  "什么情况属于保险除外责任？",
  "理赔需要准备哪些材料？",
  "保费是如何计算的？",
  "受试者受伤后多久内需要报案？",
];

export function InsuranceQAChat({ projectContext, className }: InsuranceQAChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "您好！我是保险专业顾问，可以回答您关于临床试验责任保险的任何问题。例如：保障范围、除外责任、理赔流程、保费计算等。",
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const { streamChat, isStreaming, cancelStream } = useInsuranceQA();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (content?: string) => {
    const messageContent = content || inputValue.trim();
    if (!messageContent || isStreaming) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: messageContent,
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");

    const assistantMessageId = (Date.now() + 1).toString();
    let assistantContent = "";

    setMessages((prev) => [
      ...prev,
      { id: assistantMessageId, role: "assistant", content: "" },
    ]);

    await streamChat({
      messages: [...messages, userMessage].map((m) => ({
        role: m.role,
        content: m.content,
      })),
      projectContext,
      onDelta: (delta) => {
        assistantContent += delta;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMessageId ? { ...m, content: assistantContent } : m
          )
        );
      },
      onDone: () => {},
      onError: (error) => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMessageId
              ? { ...m, content: `抱歉，出现错误：${error.message}` }
              : m
          )
        );
      },
    });
  };

  return (
    <Card className={cn("flex flex-col h-full border-0 shadow-soft", className)}>
      {/* Header */}
      <div className="p-4 border-b border-border bg-gradient-to-r from-primary/10 to-transparent">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <HelpCircle className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h3 className="font-semibold">保险专业咨询</h3>
            <p className="text-xs text-muted-foreground">随时解答您的保险疑问</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-3",
                message.role === "user" ? "flex-row-reverse" : ""
              )}
            >
              <div
                className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                  message.role === "assistant" ? "bg-primary" : "bg-secondary"
                )}
              >
                {message.role === "assistant" ? (
                  <Bot className="w-4 h-4 text-primary-foreground" />
                ) : (
                  <User className="w-4 h-4 text-secondary-foreground" />
                )}
              </div>
              <div
                className={cn(
                  "max-w-[80%] px-4 py-2 rounded-xl text-sm",
                  message.role === "assistant"
                    ? "bg-muted text-foreground"
                    : "bg-primary text-primary-foreground"
                )}
              >
                {message.content || (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Suggested Questions */}
      {messages.length <= 2 && (
        <div className="px-4 pb-2">
          <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            常见问题
          </p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_QUESTIONS.map((q) => (
              <Button
                key={q}
                variant="outline"
                size="sm"
                className="text-xs h-7"
                onClick={() => handleSend(q)}
              >
                {q}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-border">
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder="输入您的问题..."
            disabled={isStreaming}
            className="flex-1"
          />
          <Button
            onClick={() => (isStreaming ? cancelStream() : handleSend())}
            disabled={!inputValue.trim() && !isStreaming}
          >
            {isStreaming ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}

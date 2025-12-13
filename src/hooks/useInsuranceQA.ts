import { useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface StreamChatOptions {
  messages: Message[];
  projectContext?: {
    trialPhase?: string;
    subjectCount?: number;
    drugType?: string;
    indication?: string;
    premiumMin?: number;
    premiumMax?: number;
  };
  onDelta: (deltaText: string) => void;
  onDone: () => void;
  onError: (error: Error) => void;
}

export function useInsuranceQA() {
  const [isStreaming, setIsStreaming] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const streamChat = useCallback(async ({
    messages,
    projectContext,
    onDelta,
    onDone,
    onError,
  }: StreamChatOptions) => {
    setIsStreaming(true);
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/insurance-qa`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ messages, projectContext }),
          signal: abortControllerRef.current.signal,
        }
      );

      if (!response.ok || !response.body) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to start stream");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") {
            streamDone = true;
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) onDelta(content);
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      onDone();
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        onDone();
      } else {
        onError(error instanceof Error ? error : new Error("Unknown error"));
      }
    } finally {
      setIsStreaming(false);
    }
  }, []);

  const cancelStream = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  return { streamChat, cancelStream, isStreaming };
}

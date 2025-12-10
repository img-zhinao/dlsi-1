import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const systemPrompt = `你是一个专业的临床试验方案分析师。用户会提供临床试验方案的文本内容，你需要从中提取关键信息。

请以JSON格式返回以下字段（如果无法确定某个字段，使用null）：
{
  "trialPhase": "试验分期，如 I期、II期、III期、IV期",
  "subjectCount": 受试者计划入组例数（数字），
  "drugType": "药物类型，如小分子药物、生物制剂、抗体药物等",
  "indication": "适应症，如非小细胞肺癌、糖尿病等",
  "durationMonths": 试验预计持续月数（数字）,
  "siteCount": 研究中心数量（数字）,
  "risks": ["风险因素数组，如涉及未成年人、肿瘤患者、首次人体试验等"]
}

只返回JSON，不要有其他解释文字。`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { documentText } = await req.json();

    if (!documentText || documentText.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "文档内容为空" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "AI服务未配置" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Analyzing document with AI, text length:", documentText.length);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `请分析以下临床试验方案文本并提取关键信息：\n\n${documentText.slice(0, 15000)}` }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_trial_info",
              description: "从临床试验方案中提取结构化信息",
              parameters: {
                type: "object",
                properties: {
                  trialPhase: { type: "string", description: "试验分期" },
                  subjectCount: { type: "number", description: "受试者计划例数" },
                  drugType: { type: "string", description: "药物类型" },
                  indication: { type: "string", description: "适应症" },
                  durationMonths: { type: "number", description: "试验持续月数" },
                  siteCount: { type: "number", description: "研究中心数量" },
                  risks: { 
                    type: "array", 
                    items: { type: "string" },
                    description: "识别到的风险因素" 
                  }
                },
                required: ["trialPhase", "subjectCount", "drugType", "indication", "risks"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "extract_trial_info" } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "请求频率超限，请稍后再试" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI额度不足，请充值" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "AI分析失败" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    console.log("AI response received");

    // Extract the function call result
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall && toolCall.function?.arguments) {
      const extractedData = JSON.parse(toolCall.function.arguments);
      console.log("Extracted data:", extractedData);
      
      return new Response(
        JSON.stringify({ success: true, data: extractedData }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fallback: try to parse content as JSON
    const content = data.choices?.[0]?.message?.content;
    if (content) {
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const extractedData = JSON.parse(jsonMatch[0]);
          return new Response(
            JSON.stringify({ success: true, data: extractedData }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      } catch (e) {
        console.error("Failed to parse AI response as JSON:", e);
      }
    }

    return new Response(
      JSON.stringify({ error: "无法解析AI响应" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in analyze-protocol function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "处理失败" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

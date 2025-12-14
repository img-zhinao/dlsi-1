import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const systemPrompt = `你是一个专业的临床试验方案分析师。用户会提供临床试验方案的文本内容，你需要从中提取关键信息。

对于每个提取的字段，你需要同时给出置信度评分(0-100)：
- 90-100: 非常确定，文档中有明确说明
- 70-89: 较为确定，根据上下文推断
- 50-69: 一般确定，需要人工核实
- 0-49: 不太确定，建议手动填写

请以JSON格式返回以下字段。只返回JSON，不要有其他解释文字。`;

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
              description: "从临床试验方案中提取结构化信息，并为每个字段提供置信度评分",
              parameters: {
                type: "object",
                properties: {
                  protocolNumber: { type: "string", description: "试验方案编号" },
                  protocolName: { type: "string", description: "试验方案完整名称" },
                  trialPhase: { type: "string", description: "试验分期，如 I期、II期、III期、IV期" },
                  subjectCount: { type: "number", description: "受试者计划入组例数" },
                  drugType: { type: "string", description: "药物类型，如小分子药物、生物制剂、抗体药物等" },
                  indication: { type: "string", description: "适应症，如非小细胞肺癌、糖尿病等" },
                  sponsor: { type: "string", description: "申办方/申办者公司名称" },
                  durationMonths: { type: "number", description: "试验预计持续月数" },
                  siteCount: { type: "number", description: "研究中心数量" },
                  risks: { 
                    type: "array", 
                    items: { type: "string" },
                    description: "识别到的风险因素，如涉及未成年人、肿瘤患者、首次人体试验等" 
                  },
                  confidence: {
                    type: "object",
                    description: "每个字段的置信度评分(0-100)",
                    properties: {
                      protocolNumber: { type: "number", description: "试验方案编号的置信度" },
                      protocolName: { type: "number", description: "方案名称的置信度" },
                      trialPhase: { type: "number", description: "试验分期的置信度" },
                      subjectCount: { type: "number", description: "受试者例数的置信度" },
                      drugType: { type: "number", description: "药物类型的置信度" },
                      indication: { type: "number", description: "适应症的置信度" },
                      sponsor: { type: "number", description: "申办方的置信度" },
                      durationMonths: { type: "number", description: "持续时间的置信度" },
                      siteCount: { type: "number", description: "研究中心数量的置信度" }
                    }
                  }
                },
                required: ["trialPhase", "subjectCount", "drugType", "indication", "risks", "confidence"]
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

    const aiResponse = await response.json();
    console.log("AI response received:", JSON.stringify(aiResponse).slice(0, 500));

    let extractedData = null;

    // Try to get data from function call
    const toolCalls = aiResponse.choices?.[0]?.message?.tool_calls;
    if (toolCalls && toolCalls.length > 0) {
      const functionCall = toolCalls[0];
      if (functionCall.function?.arguments) {
        try {
          extractedData = JSON.parse(functionCall.function.arguments);
        } catch (parseError) {
          console.error("Failed to parse function arguments:", parseError);
        }
      }
    }

    // Fallback to parsing content if no function call
    if (!extractedData) {
      const content = aiResponse.choices?.[0]?.message?.content;
      if (content) {
        try {
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            extractedData = JSON.parse(jsonMatch[0]);
          }
        } catch (parseError) {
          console.error("Failed to parse content as JSON:", parseError);
        }
      }
    }

    if (!extractedData) {
      return new Response(
        JSON.stringify({ error: "无法解析AI响应" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Ensure confidence object exists with defaults
    if (!extractedData.confidence) {
      extractedData.confidence = {};
    }
    
    // Set default confidence values for extracted fields
    const fieldsToCheck = ['protocolNumber', 'protocolName', 'trialPhase', 'subjectCount', 
                           'drugType', 'indication', 'sponsor', 'durationMonths', 'siteCount'];
    
    for (const field of fieldsToCheck) {
      if (extractedData[field] && extractedData.confidence[field] === undefined) {
        // If field has value but no confidence, assign a medium-high default
        extractedData.confidence[field] = 75;
      } else if (!extractedData[field]) {
        extractedData.confidence[field] = 0;
      }
    }

    console.log("Extracted data:", JSON.stringify(extractedData));

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: extractedData 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in analyze-protocol:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "未知错误" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

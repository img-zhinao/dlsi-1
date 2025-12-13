import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const INSURANCE_KNOWLEDGE_BASE = `
你是一位专业的临床试验保险顾问。你需要回答用户关于临床试验责任保险的问题。

## 临床试验保险基础知识

### 什么是临床试验责任保险？
临床试验责任保险是为临床试验申办方、研究者和研究机构提供的责任保险，保障因临床试验导致受试者人身伤害而产生的赔偿责任。

### 保障范围
1. **基本保障**：因参与临床试验直接导致的受试者人身伤害
2. **医疗费用**：因试验相关伤害产生的必要且合理的医疗费用
3. **伤残赔偿**：因试验相关伤害导致的伤残补偿
4. **死亡赔偿**：因试验相关伤害导致死亡的赔偿

### 常见除外责任
- 既往症（参与试验前已存在的疾病）
- 遗传性疾病
- 受试者故意行为
- 非试验相关的医疗事故
- 方案违规操作

### 保费计算因素
1. **试验分期**：I期风险最高，III期相对较低
2. **受试者例数**：人数越多，总保费越高
3. **药物类型**：生物制品、基因治疗等风险较高
4. **适应症**：肿瘤、儿科等领域风险较高
5. **试验周期**：周期越长，暴露风险越高

### 理赔流程
1. 发生保险事故后48小时内报案
2. 提交理赔申请材料（医疗记录、发票、诊断证明）
3. 保险公司审核调查
4. 赔付决定及打款

### 常见术语解释
- **免赔额**：每次事故中投保人自行承担的金额，通常为1000元
- **赔付比例**：扣除免赔额后保险公司承担的比例，通常为80%
- **每人保额**：单个受试者最高赔偿限额，通常为50万元
- **累计保额**：保单期间内所有赔偿的最高限额
`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, projectContext } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build system prompt with context
    let systemPrompt = INSURANCE_KNOWLEDGE_BASE;
    
    if (projectContext) {
      systemPrompt += `

## 当前项目信息
- 试验分期：${projectContext.trialPhase || '未知'}
- 受试者例数：${projectContext.subjectCount || '未知'}
- 药物类型：${projectContext.drugType || '未知'}
- 适应症：${projectContext.indication || '未知'}
- 预估保费范围：${projectContext.premiumMin ? `¥${projectContext.premiumMin} - ¥${projectContext.premiumMax}` : '待计算'}

请基于以上项目信息回答用户问题，如果问题与当前项目相关，请结合项目具体情况给出建议。
`;
    }

    console.log("Calling Lovable AI for insurance Q&A");
    
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
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "请求过于频繁，请稍后再试" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI服务额度已用尽，请联系管理员" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Insurance QA error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

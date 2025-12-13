import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InquiryDocData {
  sponsorInfo: {
    companyName: string;
    contactName: string;
    phone: string;
    email: string;
    address?: string;
  };
  trialInfo: {
    trialName: string;
    trialPhase: string;
    subjectCount: number;
    drugType: string;
    indication: string;
    durationMonths?: number;
    siteCount?: number;
    startDate?: string;
  };
  coverageRequirements: {
    coveragePerSubject: number;
    deductible?: number;
    paymentRatio?: number;
  };
  riskFactors?: string[];
  specialNotes?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: InquiryDocData = await req.json();
    
    console.log("Generating inquiry document for:", data.trialInfo.trialName);

    // Generate HTML document content
    const documentDate = new Date().toLocaleDateString('zh-CN');
    
    const htmlContent = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>临床试验责任保险询价申请表</title>
  <style>
    body { font-family: "SimSun", serif; padding: 40px; max-width: 800px; margin: 0 auto; }
    h1 { text-align: center; font-size: 22px; margin-bottom: 30px; }
    h2 { font-size: 16px; background: #f5f5f5; padding: 8px 12px; margin-top: 24px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    td, th { border: 1px solid #333; padding: 10px; text-align: left; }
    th { background: #f5f5f5; width: 30%; }
    .header { text-align: center; margin-bottom: 20px; }
    .header p { margin: 4px 0; color: #666; }
    .footer { margin-top: 40px; }
    .signature-area { margin-top: 60px; display: flex; justify-content: space-between; }
    .signature-box { width: 45%; }
    .signature-line { border-bottom: 1px solid #333; height: 40px; margin-top: 20px; }
    .risk-tag { display: inline-block; background: #fee2e2; color: #dc2626; padding: 2px 8px; margin: 2px; border-radius: 4px; font-size: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>临床试验责任保险询价申请表</h1>
    <p>申请日期：${documentDate}</p>
  </div>

  <h2>一、申办方信息</h2>
  <table>
    <tr>
      <th>公司名称</th>
      <td>${data.sponsorInfo.companyName || '-'}</td>
    </tr>
    <tr>
      <th>联系人</th>
      <td>${data.sponsorInfo.contactName || '-'}</td>
    </tr>
    <tr>
      <th>联系电话</th>
      <td>${data.sponsorInfo.phone || '-'}</td>
    </tr>
    <tr>
      <th>电子邮箱</th>
      <td>${data.sponsorInfo.email || '-'}</td>
    </tr>
    <tr>
      <th>公司地址</th>
      <td>${data.sponsorInfo.address || '-'}</td>
    </tr>
  </table>

  <h2>二、临床试验基本信息</h2>
  <table>
    <tr>
      <th>试验名称</th>
      <td>${data.trialInfo.trialName || '-'}</td>
    </tr>
    <tr>
      <th>试验分期</th>
      <td>${data.trialInfo.trialPhase || '-'}</td>
    </tr>
    <tr>
      <th>计划入组例数</th>
      <td>${data.trialInfo.subjectCount || '-'}例</td>
    </tr>
    <tr>
      <th>药物/器械类型</th>
      <td>${data.trialInfo.drugType || '-'}</td>
    </tr>
    <tr>
      <th>适应症</th>
      <td>${data.trialInfo.indication || '-'}</td>
    </tr>
    <tr>
      <th>试验周期</th>
      <td>${data.trialInfo.durationMonths ? `${data.trialInfo.durationMonths}个月` : '-'}</td>
    </tr>
    <tr>
      <th>研究中心数量</th>
      <td>${data.trialInfo.siteCount ? `${data.trialInfo.siteCount}个` : '-'}</td>
    </tr>
    <tr>
      <th>计划开始日期</th>
      <td>${data.trialInfo.startDate || '-'}</td>
    </tr>
  </table>

  <h2>三、保障需求</h2>
  <table>
    <tr>
      <th>每人保额要求</th>
      <td>¥${(data.coverageRequirements.coveragePerSubject / 10000).toFixed(0)}万元</td>
    </tr>
    <tr>
      <th>累计保额</th>
      <td>¥${((data.coverageRequirements.coveragePerSubject * data.trialInfo.subjectCount) / 100000000).toFixed(2)}亿元</td>
    </tr>
    <tr>
      <th>免赔额</th>
      <td>¥${data.coverageRequirements.deductible || 1000}元</td>
    </tr>
    <tr>
      <th>赔付比例</th>
      <td>${((data.coverageRequirements.paymentRatio || 0.8) * 100).toFixed(0)}%</td>
    </tr>
  </table>

  ${data.riskFactors && data.riskFactors.length > 0 ? `
  <h2>四、识别的风险因素</h2>
  <p>
    ${data.riskFactors.map(r => `<span class="risk-tag">${r}</span>`).join('')}
  </p>
  ` : ''}

  ${data.specialNotes ? `
  <h2>五、特别说明</h2>
  <p>${data.specialNotes}</p>
  ` : ''}

  <div class="footer">
    <h2>申请确认</h2>
    <p>本公司确认以上信息真实、准确、完整，并申请获取临床试验责任保险报价。</p>
    
    <div class="signature-area">
      <div class="signature-box">
        <p>申办方盖章：</p>
        <div class="signature-line"></div>
      </div>
      <div class="signature-box">
        <p>授权代表签字：</p>
        <div class="signature-line"></div>
      </div>
    </div>
    
    <p style="margin-top: 40px; text-align: right;">日期：_______年___月___日</p>
  </div>
</body>
</html>
    `;

    // Return the HTML content as a document
    return new Response(JSON.stringify({ 
      success: true, 
      htmlContent,
      documentType: 'inquiry_application',
      generatedAt: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Generate inquiry doc error:", error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

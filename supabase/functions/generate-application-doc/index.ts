import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ApplicationDocData {
  applicantInfo: {
    companyName: string;
    legalRepresentative: string;
    registrationNumber: string;
    address: string;
    contactName: string;
    phone: string;
    email: string;
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
    endDate?: string;
  };
  coverageDetails: {
    coveragePerSubject: number;
    totalCoverage: number;
    deductible: number;
    paymentRatio: number;
    premiumAmount: number;
  };
  projectCode: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: ApplicationDocData = await req.json();
    
    console.log("Generating insurance application for project:", data.projectCode);

    const documentDate = new Date().toLocaleDateString('zh-CN');
    const policyStartDate = data.trialInfo.startDate || new Date().toLocaleDateString('zh-CN');
    const policyEndDate = data.trialInfo.endDate || 
      new Date(Date.now() + (data.trialInfo.durationMonths || 24) * 30 * 24 * 60 * 60 * 1000).toLocaleDateString('zh-CN');
    
    const htmlContent = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>临床试验责任保险投保申请书</title>
  <style>
    body { font-family: "SimSun", serif; padding: 40px; max-width: 800px; margin: 0 auto; }
    h1 { text-align: center; font-size: 24px; margin-bottom: 10px; }
    h2 { font-size: 16px; background: #f5f5f5; padding: 8px 12px; margin-top: 24px; border-left: 4px solid #2563eb; }
    .subtitle { text-align: center; color: #666; margin-bottom: 30px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    td, th { border: 1px solid #333; padding: 10px; text-align: left; }
    th { background: #f5f5f5; width: 30%; }
    .header { text-align: center; margin-bottom: 20px; }
    .project-code { font-size: 14px; color: #2563eb; font-weight: bold; }
    .declaration { background: #fef3c7; padding: 16px; border-radius: 8px; margin: 20px 0; }
    .declaration h3 { margin-top: 0; color: #92400e; }
    .signature-area { margin-top: 60px; }
    .signature-row { display: flex; justify-content: space-between; margin-top: 40px; }
    .signature-box { width: 45%; }
    .signature-line { border-bottom: 1px solid #333; height: 60px; margin-top: 10px; }
    .seal-area { text-align: center; margin-top: 20px; border: 2px dashed #ccc; padding: 30px; color: #999; }
    .premium-highlight { background: #dbeafe; padding: 20px; text-align: center; border-radius: 8px; }
    .premium-highlight .amount { font-size: 32px; color: #1d4ed8; font-weight: bold; }
  </style>
</head>
<body>
  <div class="header">
    <h1>临床试验责任保险投保申请书</h1>
    <p class="subtitle">Insurance Application Form for Clinical Trial Liability</p>
    <p class="project-code">项目编号：${data.projectCode}</p>
    <p>申请日期：${documentDate}</p>
  </div>

  <h2>一、投保人信息</h2>
  <table>
    <tr>
      <th>公司全称</th>
      <td>${data.applicantInfo.companyName || '-'}</td>
    </tr>
    <tr>
      <th>法定代表人</th>
      <td>${data.applicantInfo.legalRepresentative || '-'}</td>
    </tr>
    <tr>
      <th>统一社会信用代码</th>
      <td>${data.applicantInfo.registrationNumber || '-'}</td>
    </tr>
    <tr>
      <th>注册地址</th>
      <td>${data.applicantInfo.address || '-'}</td>
    </tr>
    <tr>
      <th>联系人</th>
      <td>${data.applicantInfo.contactName || '-'}</td>
    </tr>
    <tr>
      <th>联系电话</th>
      <td>${data.applicantInfo.phone || '-'}</td>
    </tr>
    <tr>
      <th>电子邮箱</th>
      <td>${data.applicantInfo.email || '-'}</td>
    </tr>
  </table>

  <h2>二、被保险项目信息</h2>
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
      <th>受试者例数</th>
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
      <th>研究中心数量</th>
      <td>${data.trialInfo.siteCount || '-'}个</td>
    </tr>
    <tr>
      <th>保险期间</th>
      <td>${policyStartDate} 至 ${policyEndDate}</td>
    </tr>
  </table>

  <h2>三、保障方案</h2>
  <table>
    <tr>
      <th>每人保额</th>
      <td>¥${(data.coverageDetails.coveragePerSubject / 10000).toFixed(0)}万元</td>
    </tr>
    <tr>
      <th>累计保额</th>
      <td>¥${(data.coverageDetails.totalCoverage / 100000000).toFixed(2)}亿元</td>
    </tr>
    <tr>
      <th>每次事故免赔额</th>
      <td>¥${data.coverageDetails.deductible}元</td>
    </tr>
    <tr>
      <th>赔付比例</th>
      <td>${(data.coverageDetails.paymentRatio * 100).toFixed(0)}%</td>
    </tr>
  </table>

  <div class="premium-highlight">
    <p>应付保费</p>
    <p class="amount">¥${data.coverageDetails.premiumAmount.toLocaleString()}</p>
    <p style="color: #666; font-size: 14px;">（大写：${numberToChinese(data.coverageDetails.premiumAmount)}）</p>
  </div>

  <h2>四、投保声明</h2>
  <div class="declaration">
    <h3>投保人声明</h3>
    <p>1. 投保人确认已阅读并理解《临床试验责任保险条款》的全部内容，特别是免责条款、投保人及被保险人义务等条款。</p>
    <p>2. 投保人确认本投保申请书所填写的内容真实、准确、完整，如有隐瞒或虚假陈述，保险人有权解除合同或拒绝赔偿。</p>
    <p>3. 投保人同意保险人对本投保申请书及相关资料进行审核，并接受保险人的核保决定。</p>
    <p>4. 投保人确认本临床试验已获得伦理委员会批准，并将严格按照批准的方案执行。</p>
  </div>

  <div class="signature-area">
    <h2>五、签章确认</h2>
    
    <div class="signature-row">
      <div class="signature-box">
        <p><strong>投保人盖章：</strong></p>
        <div class="seal-area">公司公章</div>
      </div>
      <div class="signature-box">
        <p><strong>法定代表人/授权代表签字：</strong></p>
        <div class="signature-line"></div>
      </div>
    </div>
    
    <p style="margin-top: 40px; text-align: right;">签署日期：_______年___月___日</p>
  </div>

  <div style="margin-top: 60px; padding-top: 20px; border-top: 1px solid #ccc; font-size: 12px; color: #666;">
    <p><strong>重要提示：</strong></p>
    <p>1. 本申请书经保险人审核同意后，与保险单、保险条款共同构成保险合同。</p>
    <p>2. 请妥善保管本申请书副本，作为保险合同的重要组成部分。</p>
    <p>3. 如有任何疑问，请联系您的保险顾问或拨打客服热线。</p>
  </div>
</body>
</html>
    `;

    return new Response(JSON.stringify({ 
      success: true, 
      htmlContent,
      documentType: 'insurance_application',
      generatedAt: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Generate application doc error:", error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Helper function to convert number to Chinese
function numberToChinese(num: number): string {
  const digits = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖'];
  const units = ['', '拾', '佰', '仟', '万', '拾万', '佰万', '仟万', '亿'];
  
  if (num === 0) return '零元整';
  
  const numStr = Math.floor(num).toString();
  let result = '';
  
  for (let i = 0; i < numStr.length; i++) {
    const digit = parseInt(numStr[i]);
    const unit = units[numStr.length - 1 - i] || '';
    
    if (digit !== 0) {
      result += digits[digit] + unit;
    } else if (!result.endsWith('零') && i < numStr.length - 1) {
      result += '零';
    }
  }
  
  result = result.replace(/零+$/, '');
  return result + '元整';
}

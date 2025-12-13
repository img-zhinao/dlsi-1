import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

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

export function useDocumentGeneration() {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateInquiryDoc = async (data: InquiryDocData) => {
    setIsGenerating(true);
    try {
      const { data: result, error } = await supabase.functions.invoke("generate-inquiry-doc", {
        body: data,
      });

      if (error) throw error;
      if (!result.success) throw new Error(result.error);

      return result.htmlContent as string;
    } finally {
      setIsGenerating(false);
    }
  };

  const generateApplicationDoc = async (data: ApplicationDocData) => {
    setIsGenerating(true);
    try {
      const { data: result, error } = await supabase.functions.invoke("generate-application-doc", {
        body: data,
      });

      if (error) throw error;
      if (!result.success) throw new Error(result.error);

      return result.htmlContent as string;
    } finally {
      setIsGenerating(false);
    }
  };

  const printDocument = (htmlContent: string) => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const downloadDocument = (htmlContent: string, filename: string) => {
    const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${filename}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return {
    generateInquiryDoc,
    generateApplicationDoc,
    printDocument,
    downloadDocument,
    isGenerating,
  };
}

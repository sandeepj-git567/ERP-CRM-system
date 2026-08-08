import React, { createContext, useContext, useState, useEffect } from 'react';

export interface CompanyProfile {
  companyName: string;
  tradeName: string;
  gstin: string;
  pan: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  stateCode: string;
  phone: string;
  email: string;
  website: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  branch: string;
  upiId: string;
  terms: string;
  logoUrl?: string;
}

export const DEFAULT_COMPANY: CompanyProfile = {
  companyName: 'Apex Distributions & Logistics Private Limited',
  tradeName: 'Apex ERP Operations',
  gstin: '27AABCU9603R1ZN',
  pan: 'AABCU9603R',
  address: 'Plot No. 42, Sector 18, MIDC Industrial Area, Vashi',
  city: 'Navi Mumbai',
  state: 'Maharashtra',
  pincode: '400703',
  stateCode: '27',
  phone: '+91 98765 43210',
  email: 'billing@apexdistributors.com',
  website: 'www.apexdistributors.com',
  bankName: 'HDFC Bank Ltd',
  accountNumber: '50200012345678',
  ifscCode: 'HDFC0001234',
  branch: 'Vashi Sector 17 Branch',
  upiId: 'apexdistributors@hdfcbank',
  terms: '1. Goods once sold will not be taken back. 2. Subject to Mumbai Jurisdiction only. 3. Interest @18% p.a. will be charged if payment not received within 15 days.',
};

interface CompanyContextType {
  company: CompanyProfile;
  updateCompany: (profile: Partial<CompanyProfile>) => void;
  resetCompany: () => void;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

const STORAGE_KEY = 'erp_company_profile';

export const CompanyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [company, setCompany] = useState<CompanyProfile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? { ...DEFAULT_COMPANY, ...JSON.parse(saved) } : DEFAULT_COMPANY;
    } catch {
      return DEFAULT_COMPANY;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(company));
    } catch (e) {
      console.error('Failed to save company settings to localStorage', e);
    }
  }, [company]);

  const updateCompany = (profile: Partial<CompanyProfile>) => {
    setCompany((prev) => ({ ...prev, ...profile }));
  };

  const resetCompany = () => {
    setCompany(DEFAULT_COMPANY);
  };

  return (
    <CompanyContext.Provider value={{ company, updateCompany, resetCompany }}>
      {children}
    </CompanyContext.Provider>
  );
};

export const useCompany = (): CompanyContextType => {
  const context = useContext(CompanyContext);
  if (!context) {
    throw new Error('useCompany must be used within a CompanyProvider');
  }
  return context;
};

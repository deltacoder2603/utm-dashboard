export interface User {
  id: string;
  username: string;
  password: string;
  utmId: string;
  name?: string;
  email?: string;
  socialMediaLink?: string;
  mobileNumber?: string;
}

export interface UTMData {
  utmId: string;
  leadCount: number;
  earnings: number;
}

export interface LeadStats {
  totalLeads: number;
  totalDisbursals: number;
  conversionRate: string;
  dailyAverage: number;
  utmData: UTMData[];
}

export interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

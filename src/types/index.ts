export interface User {
  id: string;
  username: string;
  password: string;
  utmId: string;
  name?: string;
  email?: string;
  socialMediaLink?: string;
  mobileNumber?: string;
  isAdmin?: boolean;
  isApproved?: boolean;
  registrationDate?: string;
}

export interface UTMData {
  utmId: string;
  count: number;
  earnings: number;
}

export interface LeadStats {
  totalLeads: number;
  totalEarnings: number;
  leads: UTMData[];
}

export interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

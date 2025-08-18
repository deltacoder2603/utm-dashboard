import { User, UTMData, LeadStats } from '@/types';

// Rate per lead in rupees
const RATE_PER_LEAD = 45;

// Client-safe functions that call the API routes
export async function fetchUsers(): Promise<User[]> {
  try {
    const response = await fetch('/api/users');
    if (!response.ok) {
      throw new Error('Failed to fetch users');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
}

export async function fetchUTMData(): Promise<LeadStats> {
  try {
    const response = await fetch('/api/utm-data');
    if (!response.ok) {
      throw new Error('Failed to fetch UTM data');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching UTM data:', error);
    return {
      totalLeads: 0,
      totalDisbursals: 0,
      conversionRate: '0%',
      dailyAverage: 0,
      utmData: []
    };
  }
}

export async function authenticateUser(username: string, password: string): Promise<User | null> {
  try {
    const users = await fetchUsers();
    const user = users.find(u => 
      u.username.toLowerCase() === username.toLowerCase() && 
      u.password === password
    );
    
    return user || null;
  } catch (error) {
    console.error('Error authenticating user:', error);
    return null;
  }
}

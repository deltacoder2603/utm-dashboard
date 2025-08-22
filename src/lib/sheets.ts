import { User, LeadStats } from '@/types';

// Client-safe functions that call the API routes
export async function fetchUsers(): Promise<User[]> {
  try {
    const response = await fetch('/api/users');
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('API Error Response:', errorData);
      
      if (errorData.error) {
        throw new Error(`API Error: ${errorData.error}${errorData.details ? ` - ${errorData.details}` : ''}${errorData.solution ? `\n\nSolution: ${errorData.solution}` : ''}`);
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching users:', error);
    // Return empty array as fallback
    return [];
  }
}

export async function fetchUTMData(): Promise<LeadStats> {
  try {
    const response = await fetch('/api/utm-data');
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('API Error Response:', errorData);
      
      if (errorData.error) {
        throw new Error(`API Error: ${errorData.error}${errorData.details ? ` - ${errorData.details}` : ''}${errorData.solution ? `\n\nSolution: ${errorData.solution}` : ''}`);
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching UTM data:', error);
    // Return default data as fallback
    return {
      totalLeads: 0,
      totalEarnings: 0,
      leads: []
    };
  }
}

export async function authenticateUser(username: string, password: string): Promise<User | null> {
  try {
    const users = await fetchUsers();
    
    // If no users were fetched, try to authenticate with hardcoded admin credentials
    if (users.length === 0) {
      console.log('No users fetched from API, checking admin credentials...');
      
      // Check for admin credentials
      const isAdminUser =
        (username === 'admin' && password === 'admin@idioticmedia') ||
        (username === 'username-admin' && password === 'password-admin@idioticmedia');
      
      if (isAdminUser) {
        return {
          id: 'admin',
          username: username,
          password: password,
          utmId: 'admin',
          name: 'Administrator'
        };
      }
      
      return null;
    }
    
    const user = users.find(u => 
      u.username.toLowerCase() === username.toLowerCase() && 
      u.password === password
    );
    
    return user || null;
  } catch (error) {
    console.error('Error authenticating user:', error);
    
    // Fallback to admin authentication if API fails
    console.log('API authentication failed, checking admin credentials...');
    
    const isAdminUser =
      (username === 'admin' && password === 'admin@idioticmedia') ||
      (username === 'username-admin' && password === 'password-admin@idioticmedia');
    
    if (isAdminUser) {
      return {
        id: 'admin',
        username: username,
        password: password,
        utmId: 'admin',
        name: 'Administrator'
      };
    }
    
    return null;
  }
}

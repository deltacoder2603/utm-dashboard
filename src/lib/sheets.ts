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
    console.log('=== AUTHENTICATION DEBUG ===');
    console.log('Authenticating user:', username);
    console.log('Password provided:', password ? '***' : 'undefined');
    
    const users = await fetchUsers();
    console.log('Users fetched from API:', users);
    
    // If no users were fetched, return null
    if (users.length === 0) {
      console.log('No users fetched from API');
      return null;
    }
    
    console.log(`Found ${users.length} users from API`);
    
    // Log each user for debugging
    users.forEach((u, index) => {
      console.log(`User ${index + 1}:`, {
        username: u.username,
        password: u.password ? '***' : 'undefined',
        name: u.name,
        utmId: u.utmId
      });
    });
    
    // First, try to find the user in the database (including admin)
    const user = users.find(u => {
      const usernameMatch = u.username.toLowerCase() === username.toLowerCase();
      const passwordMatch = u.password === password;
      console.log(`Checking user ${u.username}: usernameMatch=${usernameMatch}, passwordMatch=${passwordMatch}`);
      return usernameMatch && passwordMatch;
    });
    
    if (user) {
      console.log('User found in database:', user);
      
      // If this is the admin user, enhance it with admin properties
      if (username === 'admin') {
        const adminUser = {
          ...user,
          isAdmin: true,
          isApproved: true,
          registrationDate: new Date().toISOString()
        };
        console.log('Enhanced admin user object:', adminUser);
        return adminUser;
      }
      
      // For regular users, just return them as-is
      console.log('Regular user authenticated:', user);
      return user;
    }
    
    // Check for hardcoded admin credentials as fallback (updated to match actual password)
    if (username === 'admin' && password === 'Shashank') {
      console.log('Admin user authenticated via hardcoded credentials');
      const adminUser = {
        id: 'admin',
        username: username,
        password: password,
        utmId: 'shashankyadav',
        name: 'Shashank',
        isAdmin: true,
        isApproved: true,
        registrationDate: new Date().toISOString()
      };
      return adminUser;
    }
    
    console.log('No user found in database with provided credentials');
    return null;
  } catch (error) {
    console.error('Error authenticating user:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    // If API fails, we can't authenticate
    console.log('API authentication failed, cannot authenticate user');
    return null;
  }
}

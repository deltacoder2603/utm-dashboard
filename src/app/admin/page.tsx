'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';

interface UTMData {
  totalLeads: number;
  totalEarnings: number;
  leads: Array<{
    utmId: string;
    count: number;
    earnings: number;
  }>;
}

interface UserRegistration {
  name: string;
  email: string;
  socialMediaLink: string;
  mobileNumber: string;
  username: string;
  password: string;
}

interface User {
  username: string;
  password: string;
  utmId: string;
  name: string;
}

export default function AdminPage() {
  const [utmData, setUtmData] = useState<UTMData | null>(null);
  const [userRegistrations, setUserRegistrations] = useState<UserRegistration[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [approving, setApproving] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'utm' | 'pending' | 'approved'>('utm');
  const [showUtmDialog, setShowUtmDialog] = useState(false);
  const [selectedRegistration, setSelectedRegistration] = useState<UserRegistration | null>(null);
  const [utmIdInput, setUtmIdInput] = useState('');
  const router = useRouter();

  useEffect(() => {
    // Admin authentication check
    const checkAuth = () => {
      const username = localStorage.getItem('username');
      const password = localStorage.getItem('password');
      
      const isAdminUser =
        (username === 'admin' && password === 'admin@idioticmedia') ||
        (username === 'username-admin' && password === 'password-admin@idioticmedia');
      
      if (!isAdminUser) {
        router.push('/login');
        return;
      }
      
      fetchData();
    };
    
    checkAuth();
  }, [router]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [utmResponse, registrationsResponse, usersResponse] = await Promise.all([
        fetch('/api/utm-data'),
        fetch('/api/user-registrations'),
        fetch('/api/users')
      ]);

      if (utmResponse.ok) {
        const utmData = await utmResponse.json();
        setUtmData(utmData);
      }

      if (registrationsResponse.ok) {
        const registrationsData = await registrationsResponse.json();
        setUserRegistrations(registrationsData);
      }

      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setUsers(usersData);
      }
    } catch (err) {
      setError('Failed to fetch data');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveClick = (registration: UserRegistration) => {
    setSelectedRegistration(registration);
    setShowUtmDialog(true);
  };

  const handleApproveUser = async () => {
    if (!selectedRegistration || !utmIdInput.trim()) {
      alert('Please enter a UTM ID');
      return;
    }

    try {
      setApproving(selectedRegistration.username);
      const response = await fetch('/api/approve-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: selectedRegistration.username,
          password: selectedRegistration.password,
          utmId: utmIdInput.trim(),
          name: selectedRegistration.name
        }),
      });

      if (response.ok) {
        // Refresh data
        await fetchData();
        setShowUtmDialog(false);
        setSelectedRegistration(null);
        setUtmIdInput('');
        alert('User approved successfully!');
      } else {
        const errorData = await response.json();
        alert(`Failed to approve user: ${errorData.error}`);
      }
    } catch (err) {
      console.error('Error approving user:', err);
      alert('Failed to approve user');
    } finally {
      setApproving(null);
    }
  };

  const handleWithdrawUser = async (user: User) => {
    if (!user) return;

    try {
      setApproving(user.username);
      const response = await fetch('/api/withdraw-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: user.username,
          password: user.password,
        }),
      });

      if (response.ok) {
        await fetchData();
        alert('User withdrawn successfully!');
      } else {
        const errorData = await response.json();
        alert(`Failed to withdraw user: ${errorData.error}`);
      }
    } catch (err) {
      console.error('Error withdrawing user:', err);
      alert('Failed to withdraw user');
    } finally {
      setApproving(null);
    }
  };

  const logout = () => {
    localStorage.removeItem('username');
    localStorage.removeItem('password');
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchData}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute requireAdmin={true}>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <button
                onClick={logout}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900">Total UTM Leads</h3>
              <p className="text-3xl font-bold text-blue-600">
                {utmData?.totalLeads || 0}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900">Total Earnings</h3>
              <p className="text-3xl font-bold text-green-600">
                ₹{utmData?.totalEarnings || 0}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900">Pending Approvals</h3>
              <p className="text-3xl font-bold text-orange-600">
                {userRegistrations.length}
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-lg shadow">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8 px-6">
                <button
                  onClick={() => setActiveTab('utm')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'utm'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  UTM Data
                </button>
                <button
                  onClick={() => setActiveTab('pending')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'pending'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Pending Users ({userRegistrations.length})
                </button>
                <button
                  onClick={() => setActiveTab('approved')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'approved'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Approved Users ({users.length})
                </button>
              </nav>
            </div>

            <div className="p-6">
              {/* UTM Data Tab */}
              {activeTab === 'utm' && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">UTM Performance Overview</h2>
                  {utmData?.leads && utmData.leads.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              UTM ID
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Lead Count
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Earnings
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {utmData.leads.map((lead, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {lead.utmId}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {lead.count}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                ₹{lead.earnings}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">No UTM data available</p>
                  )}
                </div>
              )}

              {/* Pending Users Tab */}
              {activeTab === 'pending' && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Pending User Approvals</h2>
                  {userRegistrations.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {userRegistrations.map((registration, index) => (
                        <div key={index} className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                          <div className="space-y-3">
                            <div>
                              <h3 className="text-lg font-medium text-gray-900">{registration.name}</h3>
                              <p className="text-sm text-gray-700">@{registration.username}</p>
                            </div>
                            <div className="space-y-2 text-sm">
                              <p><span className="font-medium text-gray-700">Email:</span> <span className="text-gray-900">{registration.email}</span></p>
                              <p><span className="font-medium text-gray-700">Mobile:</span> <span className="text-gray-900">{registration.mobileNumber}</span></p>
                              <p><span className="font-medium text-gray-700">Social:</span> 
                                <a href={registration.socialMediaLink} target="_blank" rel="noopener noreferrer" 
                                   className="text-blue-600 hover:underline ml-1">
                                  View Profile
                                </a>
                              </p>
                              <p><span className="font-medium text-gray-700">Password:</span> <span className="text-gray-900">{registration.password}</span></p>
                            </div>
                            <button
                              onClick={() => handleApproveClick(registration)}
                              disabled={approving === registration.username}
                              className="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              {approving === registration.username ? 'Approving...' : 'Approve User'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">No pending user registrations</p>
                  )}
                </div>
              )}

              {/* Approved Users Tab */}
              {activeTab === 'approved' && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Approved Users</h2>
                  {users.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Username
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Password
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              UTM ID
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Name
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {users.map((user, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {user.username}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {user.password}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {user.utmId || '-'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {user.name}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                <button
                                  onClick={() => handleWithdrawUser(user)}
                                  className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition-colors"
                                >
                                  Withdraw
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">No approved users found</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* UTM ID Dialog */}
        {showUtmDialog && selectedRegistration && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
            <div className="relative mx-auto p-6 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Assign UTM ID for {selectedRegistration.name}
                </h3>
                <div className="mb-4">
                  <label htmlFor="utmId" className="block text-sm font-medium text-gray-700 mb-2">
                    UTM ID
                  </label>
                  <input
                    type="text"
                    id="utmId"
                    value={utmIdInput}
                    onChange={(e) => setUtmIdInput(e.target.value)}
                    placeholder="Enter UTM ID"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setShowUtmDialog(false);
                      setSelectedRegistration(null);
                      setUtmIdInput('');
                    }}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleApproveUser}
                    disabled={!utmIdInput.trim()}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Approve User
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}

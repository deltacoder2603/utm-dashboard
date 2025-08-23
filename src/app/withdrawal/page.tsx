'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DollarSign, CreditCard, Banknote, History, Plus, CheckCircle } from 'lucide-react';
import SharedLayout from '@/components/SharedLayout';
import { useState, useEffect } from 'react';

// Types for bank details and withdrawal
interface BankDetails {
  username: string;
  accountHolderName: string;
  accountNumber: string;
  bankName: string;
  ifscCode: string;
  timestamp: string;
}

interface WithdrawalRequest {
  username: string;
  amount: string;
  accountHolderName: string;
  accountNumber: string;
  bankName: string;
  ifscCode: string;
  status: string;
  timestamp: string;
  approved: string;
}

export default function WithdrawalPage() {
  const { user } = useAuth();
  const [bankDetails, setBankDetails] = useState<BankDetails | null>(null);
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);
  const [showBankForm, setShowBankForm] = useState(false);
  const [showWithdrawalForm, setShowWithdrawalForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    accountHolderName: '',
    accountNumber: '',
    bankName: '',
    ifscCode: ''
  });
  const [withdrawalAmount, setWithdrawalAmount] = useState('');

  // Fetch bank details and withdrawal requests
  useEffect(() => {
    const fetchData = async () => {
      if (!user?.username) return;
      
      try {
        // Fetch bank details
        const bankResponse = await fetch(`/api/bank-details?username=${user.username}`);
        if (bankResponse.ok) {
          const bankData = await bankResponse.json();
          setBankDetails(bankData.bankDetails);
          // Populate form data if editing
          if (bankData.bankDetails) {
            setFormData({
              accountHolderName: bankData.bankDetails.accountHolderName,
              accountNumber: bankData.bankDetails.accountNumber,
              bankName: bankData.bankDetails.bankName,
              ifscCode: bankData.bankDetails.ifscCode
            });
          }
        }
        
        // Fetch withdrawal requests
        const withdrawalResponse = await fetch(`/api/withdrawal-request?username=${user.username}`);
        if (withdrawalResponse.ok) {
          const withdrawalData = await withdrawalResponse.json();
          setWithdrawalRequests(withdrawalData.withdrawalRequests);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };

    fetchData();
  }, [user]);

  const handleBankDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch('/api/bank-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: user?.username,
          bankDetails: formData
        })
      });
      
      if (response.ok) {
        setBankDetails({
          username: user?.username || '',
          ...formData,
          timestamp: new Date().toISOString()
        });
        setShowBankForm(false);
        setFormData({ accountHolderName: '', accountNumber: '', bankName: '', ifscCode: '' });
      }
    } catch (error) {
      console.error('Failed to save bank details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdrawalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankDetails || !withdrawalAmount) return;
    
    setLoading(true);
    
    try {
      const response = await fetch('/api/withdrawal-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: user?.username,
          amount: withdrawalAmount,
          bankDetails
        })
      });
      
      if (response.ok) {
        // Refresh withdrawal requests
        const withdrawalResponse = await fetch(`/api/withdrawal-request?username=${user?.username}`);
        if (withdrawalResponse.ok) {
          const withdrawalData = await withdrawalResponse.json();
          setWithdrawalRequests(withdrawalData.withdrawalRequests);
        }
        setWithdrawalAmount('');
        setShowWithdrawalForm(false);
      }
    } catch (error) {
      console.error('Failed to submit withdrawal request:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <SharedLayout currentPage="withdrawal" pageTitle="Withdrawal" pageDescription="Please log in to view withdrawal options">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h1>
            <p className="text-gray-600">Please log in to view withdrawal options</p>
          </div>
        </div>
      </SharedLayout>
    );
  }

  return (
    <SharedLayout currentPage="withdrawal" pageTitle="Withdrawal" pageDescription="Manage your bank details and withdrawal requests">
      {/* Withdrawal Overview */}
      <div className="mb-8">
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 bg-green-600 rounded-2xl flex items-center justify-center">
                  <Banknote className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">Withdrawal & Bank Details</h2>
                  <p className="text-gray-600 text-lg">Manage your bank information and submit withdrawal requests</p>
                </div>
              </div>
              <div className="flex gap-3">
                {!bankDetails ? (
                  <Button
                    onClick={() => setShowBankForm(true)}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Bank Details
                  </Button>
                ) : (
                  <Button
                    onClick={() => setShowWithdrawalForm(true)}
                    disabled={!bankDetails}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl"
                  >
                    <DollarSign className="h-4 w-4 mr-2" />
                    Request Withdrawal
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bank Details Status */}
      <div className="mb-8">
        {!bankDetails ? (
          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-yellow-600 rounded-xl flex items-center justify-center">
                  <CreditCard className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-yellow-800 mb-2">Bank Details Required</h3>
                  <p className="text-yellow-700">Please add your bank account details to request withdrawals.</p>
                </div>
                <Button
                  onClick={() => setShowBankForm(true)}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Bank Details
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-green-600 rounded-xl flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-green-800 mb-2">Bank Details Verified</h3>
                    <p className="text-green-700">
                      {bankDetails.bankName} • {bankDetails.accountHolderName} • ****{bankDetails.accountNumber.slice(-4)}
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={() => setShowBankForm(true)}
                    variant="outline"
                    className="border-green-300 text-green-700 hover:bg-green-100"
                  >
                    Edit Details
                  </Button>
                  <Button
                    onClick={() => setShowWithdrawalForm(true)}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <DollarSign className="h-4 w-4 mr-2" />
                    Request Withdrawal
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Bank Details Form */}
      {showBankForm && (
        <div className="mb-8">
          <Card className="bg-white border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-gray-600" />
                {bankDetails ? 'Edit Bank Details' : 'Add Bank Details'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleBankDetailsSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="accountHolderName">Account Holder Name</Label>
                    <Input
                      id="accountHolderName"
                      value={formData.accountHolderName}
                      onChange={(e) => setFormData({...formData, accountHolderName: e.target.value})}
                      placeholder="Enter account holder name"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="accountNumber">Account Number</Label>
                    <Input
                      id="accountNumber"
                      value={formData.accountNumber}
                      onChange={(e) => setFormData({...formData, accountNumber: e.target.value})}
                      placeholder="Enter account number"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="bankName">Bank Name</Label>
                    <Input
                      id="bankName"
                      value={formData.bankName}
                      onChange={(e) => setFormData({...formData, bankName: e.target.value})}
                      placeholder="Enter bank name"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="ifscCode">IFSC Code</Label>
                    <Input
                      id="ifscCode"
                      value={formData.ifscCode}
                      onChange={(e) => setFormData({...formData, ifscCode: e.target.value})}
                      placeholder="Enter IFSC code"
                      required
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <Button type="submit" disabled={loading} className="bg-green-600 hover:bg-green-700">
                    {loading ? 'Saving...' : 'Save Bank Details'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowBankForm(false);
                      if (bankDetails) {
                        setFormData({
                          accountHolderName: bankDetails.accountHolderName,
                          accountNumber: bankDetails.accountNumber,
                          bankName: bankDetails.bankName,
                          ifscCode: bankDetails.ifscCode
                        });
                      }
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Withdrawal Form */}
      {showWithdrawalForm && bankDetails && (
        <div className="mb-8">
          <Card className="bg-white border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-gray-600" />
                Request Withdrawal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleWithdrawalSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="withdrawalAmount">Withdrawal Amount (₹)</Label>
                  <Input
                    id="withdrawalAmount"
                    type="number"
                    value={withdrawalAmount}
                    onChange={(e) => setWithdrawalAmount(e.target.value)}
                    placeholder="Enter amount to withdraw"
                    min="1"
                    required
                  />
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Bank Details</h4>
                  <p className="text-sm text-gray-600">
                    {bankDetails.accountHolderName} • {bankDetails.bankName} • ****{bankDetails.accountNumber.slice(-4)}
                  </p>
                </div>
                <div className="flex gap-3 pt-4">
                  <Button type="submit" disabled={loading || !withdrawalAmount} className="bg-blue-600 hover:bg-blue-700">
                    {loading ? 'Submitting...' : 'Submit Withdrawal Request'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowWithdrawalForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Withdrawal History */}
      <div className="mb-8">
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-gray-600" />
              Withdrawal History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {withdrawalRequests.length === 0 ? (
              <div className="text-center py-8">
                <div className="mx-auto h-16 w-16 bg-gray-100 rounded-full mb-4 flex items-center justify-center">
                  <History className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Withdrawal Requests Yet</h3>
                <p className="text-gray-600 mb-4">
                  Your withdrawal request history will appear here once you submit requests.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {withdrawalRequests.map((request, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`h-3 w-3 rounded-full ${
                          request.status === 'Approved' ? 'bg-green-500' : 
                          request.status === 'Rejected' ? 'bg-red-500' : 'bg-yellow-500'
                        }`}></div>
                        <span className={`font-medium ${
                          request.status === 'Approved' ? 'text-green-700' : 
                          request.status === 'Rejected' ? 'text-red-700' : 'text-yellow-700'
                        }`}>
                          {request.status}
                        </span>
                        {request.approved && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                            Approved: {request.approved}
                          </span>
                        )}
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(request.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Amount:</span>
                        <span className="ml-2 text-gray-900">₹{request.amount}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Bank:</span>
                        <span className="ml-2 text-gray-900">{request.bankName}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Account:</span>
                        <span className="ml-2 text-gray-900">****{request.accountNumber.slice(-4)}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">IFSC:</span>
                        <span className="ml-2 text-gray-900">{request.ifscCode}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>


    </SharedLayout>
  );
}

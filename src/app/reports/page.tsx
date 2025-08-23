'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, BarChart3, TrendingUp, Calendar, Download } from 'lucide-react';
import SharedLayout from '@/components/SharedLayout';
import { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Types for dashboard data
interface UTMLead {
  utmId: string;
  count: number;
  earnings: number;
  ratePerLead?: number;
}

interface UTMData {
  totalLeads: number;
  totalEarnings: number;
  leads: UTMLead[];
}

interface UserRegistration {
  name: string;
  username: string;
  email: string;
  socialMedia: string;
  mobile: string;
  approved: boolean;
}

interface DashboardData {
  utm: UTMData | null;
  users: { users: UserRegistration[] } | null;
  generatedAt: string;
}

export default function ReportsPage() {
  const { user } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);

  // Fetch user-specific dashboard data for PDF generation
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch UTM data for the specific user
        const utmResponse = await fetch('/api/utm-data');
        const utmData = utmResponse.ok ? await utmResponse.json() : null;
        
        // Filter UTM data to only show user's own data
        let userUTMData: UTMData | null = null;
        if (utmData && user?.utmId) {
          const userLeads = utmData.leads?.filter((lead: UTMLead) => lead.utmId === user.utmId) || [];
          userUTMData = {
            ...utmData,
            leads: userLeads,
            totalLeads: userLeads.reduce((sum: number, lead: UTMLead) => sum + (lead.count || 0), 0),
            totalEarnings: userLeads.reduce((sum: number, lead: UTMLead) => sum + (lead.earnings || 0), 0)
          };
        }
        
        // Fetch user's own registration data
        const userResponse = await fetch('/api/user-registrations');
        const userData = userResponse.ok ? await userResponse.json() : null;
        
        // Filter to only show current user's data
        let userRegistrationData: { users: UserRegistration[] } | null = null;
        if (userData && user?.username) {
          const currentUserData = userData.users?.find((u: UserRegistration) => u.username === user.username);
          if (currentUserData) {
            userRegistrationData = {
              users: [currentUserData] // Only include current user
            };
          }
        }
        
        setDashboardData({
          utm: userUTMData,
          users: userRegistrationData,
          generatedAt: new Date().toISOString()
        });
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      }
    };

    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  if (!user) {
    return (
      <SharedLayout currentPage="reports" pageTitle="Reports" pageDescription="Please log in to view reports">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h1>
            <p className="text-gray-600">Please log in to view reports</p>
          </div>
      </div>
      </SharedLayout>
    );
  }

  const generatePDFReport = async () => {
    if (!dashboardData) return;
    
    setIsGenerating(true);
    try {
      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('Personal UTM Performance Report', 20, 30);
      
      // Add subtitle
      doc.setFontSize(14);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generated on: ${new Date(dashboardData.generatedAt).toLocaleString()}`, 20, 45);
      doc.text(`User: ${user?.name || user?.username || 'Unknown'}`, 20, 55);
      
      let yPosition = 75;
      
      // Personal UTM Performance Summary
      if (dashboardData.utm && dashboardData.utm.leads && dashboardData.utm.leads.length > 0) {
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text('Your UTM Performance Summary', 20, yPosition);
        yPosition += 15;
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text(`UTM ID: ${user?.utmId || 'Not assigned'}`, 20, yPosition);
        yPosition += 10;
        doc.text(`Total Leads: ${dashboardData.utm.totalLeads || 0}`, 20, yPosition);
        yPosition += 10;
        doc.text(`Total Earnings: ₹${dashboardData.utm.totalEarnings || 0}`, 20, yPosition);
        yPosition += 20;
        
        // UTM Data Table
        const tableData = dashboardData.utm.leads.map((lead: UTMLead) => [
          lead.utmId || 'N/A',
          lead.count || 0,
          `₹${lead.ratePerLead || 45}`,
          `₹${lead.earnings || 0}`
        ]);
        
        autoTable(doc, {
          head: [['UTM ID', 'Leads', 'Rate per Lead', 'Earnings']],
          body: tableData,
          startY: yPosition,
          margin: { top: 20 },
          styles: {
            fontSize: 10,
            cellPadding: 5,
          },
          headStyles: {
            fillColor: [66, 139, 202],
            textColor: 255,
            fontStyle: 'bold',
          },
        });
        
        // Update yPosition after table (jsPDF autoTable doesn't have proper typing for this)
        yPosition += 50; // Approximate space for the table
      } else {
        // No UTM data available
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text('UTM Performance Summary', 20, yPosition);
        yPosition += 15;
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text('No UTM campaigns assigned yet.', 20, yPosition);
        yPosition += 20;
      }
      
      // Personal Information
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('Your Information', 20, yPosition);
      yPosition += 15;
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Username: ${user?.username || 'N/A'}`, 20, yPosition);
      yPosition += 10;
      doc.text(`Name: ${user?.name || 'N/A'}`, 20, yPosition);
      yPosition += 10;
      doc.text(`Email: ${user?.email || 'N/A'}`, 20, yPosition);
      yPosition += 10;
      doc.text(`UTM ID: ${user?.utmId || 'Not assigned'}`, 20, yPosition);
      yPosition += 20;
      
      // User Registration Details
      if (dashboardData.users && dashboardData.users.users && dashboardData.users.users.length > 0) {
        const currentUser = dashboardData.users.users[0];
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Account Details', 20, yPosition);
        yPosition += 15;
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text(`Mobile: ${currentUser.mobile || 'N/A'}`, 20, yPosition);
        yPosition += 10;
        doc.text(`Social Media: ${currentUser.socialMedia || 'N/A'}`, 20, yPosition);
        yPosition += 10;
        doc.text(`Approval Status: ${currentUser.approved ? 'Approved' : 'Pending'}`, 20, yPosition);
        yPosition += 20;
      }
      
      // Add footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'italic');
        doc.text(`Page ${i} of ${pageCount}`, 20, doc.internal.pageSize.height - 20);
      }
      
      // Save the PDF
      doc.save(`personal-utm-report-${user?.username || 'user'}-${new Date().toISOString().split('T')[0]}.pdf`);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF report. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <SharedLayout currentPage="reports" pageTitle="Reports" pageDescription="View detailed analytics and performance reports">
      {/* Reports Overview */}
      <div className="mb-8">
        <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
          <CardContent className="p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 bg-purple-600 rounded-2xl flex items-center justify-center">
                  <FileText className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">Performance Reports</h2>
                  <p className="text-gray-600 text-lg">Comprehensive analytics and insights for your UTM campaigns</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-3">
                <Button
                  onClick={generatePDFReport}
                  disabled={isGenerating || !dashboardData}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Download Personal Report
                    </>
                  )}
                </Button>
                <p className="text-xs text-purple-600 font-medium">
                  Your personal UTM performance data
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
            </div>
            
      {/* Report Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-white border-gray-200">
          <CardContent className="p-6 text-center">
            <div className="h-12 w-12 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="h-6 w-6 text-white" />
                </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Reports</h3>
            <div className="text-3xl font-bold text-blue-600">3</div>
            <p className="text-sm text-gray-600 mt-2">Available reports</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200">
          <CardContent className="p-6 text-center">
            <div className="h-12 w-12 bg-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="h-6 w-6 text-white" />
              </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Last Updated</h3>
            <div className="text-lg font-semibold text-green-600">Today</div>
            <p className="text-sm text-gray-600 mt-2">Real-time data</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200">
          <CardContent className="p-6 text-center">
            <div className="h-12 w-12 bg-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Calendar className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Report Period</h3>
            <div className="text-lg font-semibold text-purple-600">Monthly</div>
            <p className="text-sm text-gray-600 mt-2">Current cycle</p>
          </CardContent>
        </Card>
      </div>

      {/* Available Reports */}
      <div className="mb-8">
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-gray-600" />
              Available Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-blue-50 border-blue-200 hover:bg-blue-100 transition-colors cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center">
                      <BarChart3 className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-blue-900">Lead Generation Report</h3>
                  </div>
                  <p className="text-blue-700 text-sm mb-4">
                    Detailed analysis of lead generation performance, including conversion rates and source attribution.
                  </p>
                  <div className="text-xs text-blue-600 font-medium">Updated daily</div>
                </CardContent>
              </Card>

              <Card className="bg-green-50 border-green-200 hover:bg-green-100 transition-colors cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 bg-green-600 rounded-lg flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-green-900">Revenue Report</h3>
                  </div>
                  <p className="text-green-700 text-sm mb-4">
                    Comprehensive revenue tracking with earnings breakdown by campaign and time period.
                  </p>
                  <div className="text-xs text-green-600 font-medium">Updated daily</div>
                </CardContent>
              </Card>

              <Card className="bg-purple-50 border-purple-200 hover:bg-purple-100 transition-colors cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 bg-purple-600 rounded-lg flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-purple-900">Campaign Performance</h3>
                  </div>
                  <p className="text-purple-700 text-sm mb-4">
                    Campaign-specific analytics showing performance metrics and optimization opportunities.
                  </p>
                  <div className="text-xs text-purple-600 font-medium">Updated daily</div>
                </CardContent>
              </Card>

              <Card className="bg-yellow-50 border-yellow-200 hover:bg-yellow-100 transition-colors cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 bg-yellow-600 rounded-lg flex items-center justify-center">
                      <FileText className="h-5 w-5 text-white" />
                </div>
                    <h3 className="text-lg font-semibold text-yellow-900">UTM Analytics</h3>
              </div>
                  <p className="text-yellow-700 text-sm mb-4">
                    Deep dive into UTM parameter performance and traffic source analysis.
                  </p>
                  <div className="text-xs text-yellow-600 font-medium">Updated daily</div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
            </div>
            
      {/* Report Features */}
      <div className="mb-8">
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle>Report Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="h-6 w-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-medium text-blue-600">✓</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Real-time Data</h4>
                    <p className="text-sm text-gray-600">All reports are updated in real-time with the latest information</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-6 w-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-medium text-blue-600">✓</span>
              </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Export Options</h4>
                    <p className="text-sm text-gray-600">Download reports in PDF, CSV, or Excel formats</p>
                    <Button
                      onClick={generatePDFReport}
                      disabled={isGenerating || !dashboardData}
                      variant="outline"
                      size="sm"
                      className="mt-2 text-blue-600 border-blue-300 hover:bg-blue-50"
                    >
                      {isGenerating ? (
                        <>
                          <div className="animate-spin rounded-full h-3 w-3 border-2 border-blue-600 border-t-transparent mr-1"></div>
                          Generating...
                        </>
                      ) : (
                                              <>
                        <Download className="h-3 w-3 mr-1" />
                        Personal PDF
                      </>
                      )}
                    </Button>
            </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="h-6 w-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-medium text-blue-600">✓</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Customizable Views</h4>
                    <p className="text-sm text-gray-600">Filter and customize reports based on your needs</p>
            </div>
          </div>
                <div className="flex items-start gap-3">
                  <div className="h-6 w-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-medium text-blue-600">✓</span>
      </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Historical Data</h4>
                    <p className="text-sm text-gray-600">Access historical performance data for trend analysis</p>
          </div>
        </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </SharedLayout>
  );
}

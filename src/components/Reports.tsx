import React, { useState } from 'react';
import { useUsers } from '../hooks/useUsers';
import { useKeys } from '../hooks/useKeys';
import { useIssueRecords } from '../hooks/useIssueRecords';
import { 
  Download, 
  FileText, 
  Calendar, 
  Filter,
  Printer,
  Mail
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export function Reports() {
  const { users } = useUsers();
  const { keys } = useKeys();
  const { records } = useIssueRecords();
  const [reportType, setReportType] = useState('overview');
  const [dateRange, setDateRange] = useState('last30days');
  const [userType, setUserType] = useState('all');

  const getFilteredData = () => {
    const now = new Date();
    let startDate = new Date();

    switch (dateRange) {
      case 'last7days':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'last30days':
        startDate.setDate(now.getDate() - 30);
        break;
      case 'last90days':
        startDate.setDate(now.getDate() - 90);
        break;
      case 'thisyear':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }

    const filteredRecords = records.filter(record => {
      const recordDate = new Date(record.created_at || '');
      const matchesDate = recordDate >= startDate;
      const matchesUserType = userType === 'all' || record.users?.role === userType;
      return matchesDate && matchesUserType;
    });

    return { filteredRecords, startDate, endDate: now };
  };

  const generateOverviewReport = () => {
    const { filteredRecords } = getFilteredData();
    
    return {
      totalIssues: filteredRecords.length,
      activeIssues: filteredRecords.filter(r => r.status === 'active').length,
      overdueIssues: filteredRecords.filter(r => r.status === 'overdue').length,
      closedIssues: filteredRecords.filter(r => r.status === 'closed').length,
      averageReturnTime: calculateAverageReturnTime(filteredRecords),
      topUsers: getTopUsers(filteredRecords),
      topKeys: getTopKeys(filteredRecords)
    };
  };

  const calculateAverageReturnTime = (records: any[]) => {
    const returnedRecords = records.filter(r => r.returned_at);
    if (returnedRecords.length === 0) return 0;

    const totalDays = returnedRecords.reduce((sum, record) => {
      const issued = new Date(record.issued_at || '');
      const returned = new Date(record.returned_at || '');
      const days = Math.ceil((returned.getTime() - issued.getTime()) / (1000 * 60 * 60 * 24));
      return sum + days;
    }, 0);

    return Math.round(totalDays / returnedRecords.length);
  };

  const getTopUsers = (records: any[]) => {
    const userCounts = records.reduce((acc, record) => {
      if (record.users?.name) {
        acc[record.users.name] = (acc[record.users.name] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(userCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));
  };

  const getTopKeys = (records: any[]) => {
    const keyCounts = records.reduce((acc, record) => {
      if (record.keys?.label) {
        acc[record.keys.label] = (acc[record.keys.label] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(keyCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([key, count]) => ({ key, count }));
  };

  const exportToPDF = async () => {
    const element = document.getElementById('report-content');
    if (!element) return;

    const canvas = await html2canvas(element);
    const imgData = canvas.toDataURL('image/png');
    
    const pdf = new jsPDF();
    const imgWidth = 210;
    const pageHeight = 295;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;

    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(`key-management-report-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportToCSV = () => {
    const { filteredRecords } = getFilteredData();
    
    const csvData = filteredRecords.map(record => ({
      'Issue Date': new Date(record.issued_at || '').toLocaleDateString(),
      'User Name': record.users?.name || '',
      'User Type': record.users?.role || '',
      'Key Label': record.keys?.label || '',
      'Key Location': record.keys?.location || '',
      'Due Date': new Date(record.due_at).toLocaleDateString(),
      'Return Date': record.returned_at ? new Date(record.returned_at).toLocaleDateString() : 'Not Returned',
      'Status': record.status || '',
      'Days Held': record.returned_at 
        ? Math.ceil((new Date(record.returned_at).getTime() - new Date(record.issued_at || '').getTime()) / (1000 * 60 * 60 * 24))
        : Math.ceil((new Date().getTime() - new Date(record.issued_at || '').getTime()) / (1000 * 60 * 60 * 24))
    }));

    const csvContent = [
      Object.keys(csvData[0] || {}).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `key-management-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const overviewData = generateOverviewReport();
  const { filteredRecords } = getFilteredData();

  return (
    <div className="space-y-8">
      {/* Report Controls */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="overview">Overview Report</option>
                <option value="detailed">Detailed Activity</option>
                <option value="overdue">Overdue Analysis</option>
                <option value="usage">Key Usage Report</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="last7days">Last 7 Days</option>
                <option value="last30days">Last 30 Days</option>
                <option value="last90days">Last 90 Days</option>
                <option value="thisyear">This Year</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">User Type</label>
              <select
                value={userType}
                onChange={(e) => setUserType(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="all">All Users</option>
                <option value="student">Students</option>
                <option value="lecturer">Lecturers</option>
                <option value="cleaner">Cleaners</option>
              </select>
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={exportToCSV}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-200"
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </button>
            <button
              onClick={exportToPDF}
              className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition duration-200"
            >
              <FileText className="h-4 w-4 mr-2" />
              Export PDF
            </button>
          </div>
        </div>
      </div>

      {/* Report Content */}
      <div id="report-content" className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Key Management System Report</h1>
          <p className="text-gray-600 mt-2">
            Generated on {new Date().toLocaleDateString()} • {dateRange.replace(/([A-Z])/g, ' $1').toLowerCase()}
          </p>
        </div>

        {/* Overview Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="text-center p-6 bg-blue-50 rounded-lg">
            <div className="text-3xl font-bold text-blue-600">{overviewData.totalIssues}</div>
            <div className="text-sm text-gray-600">Total Issues</div>
          </div>
          <div className="text-center p-6 bg-green-50 rounded-lg">
            <div className="text-3xl font-bold text-green-600">{overviewData.closedIssues}</div>
            <div className="text-sm text-gray-600">Completed Returns</div>
          </div>
          <div className="text-center p-6 bg-red-50 rounded-lg">
            <div className="text-3xl font-bold text-red-600">{overviewData.overdueIssues}</div>
            <div className="text-sm text-gray-600">Overdue Keys</div>
          </div>
          <div className="text-center p-6 bg-purple-50 rounded-lg">
            <div className="text-3xl font-bold text-purple-600">{overviewData.averageReturnTime}</div>
            <div className="text-sm text-gray-600">Avg. Days Held</div>
          </div>
        </div>

        {/* Top Users and Keys */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Users by Activity</h3>
            <div className="space-y-3">
              {overviewData.topUsers.map((user, index) => (
                <div key={user.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <span className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-sm font-medium mr-3">
                      {index + 1}
                    </span>
                    <span className="font-medium">{user.name}</span>
                  </div>
                  <span className="text-gray-600">{user.count} issues</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Most Requested Keys</h3>
            <div className="space-y-3">
              {overviewData.topKeys.map((key, index) => (
                <div key={key.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <span className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-medium mr-3">
                      {index + 1}
                    </span>
                    <span className="font-medium">{key.key}</span>
                  </div>
                  <span className="text-gray-600">{key.count} requests</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Detailed Records Table */}
        {reportType === 'detailed' && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Detailed Activity Log</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Key</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Days Held</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRecords.slice(0, 50).map((record) => (
                    <tr key={record.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(record.issued_at || '').toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.users?.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.keys?.label}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          record.status === 'closed' ? 'bg-green-100 text-green-800' :
                          record.status === 'overdue' ? 'bg-red-100 text-red-800' :
                          record.status === 'active' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {record.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.returned_at 
                          ? Math.ceil((new Date(record.returned_at).getTime() - new Date(record.issued_at || '').getTime()) / (1000 * 60 * 60 * 24))
                          : Math.ceil((new Date().getTime() - new Date(record.issued_at || '').getTime()) / (1000 * 60 * 60 * 24))
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
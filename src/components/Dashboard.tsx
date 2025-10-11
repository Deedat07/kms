import React, { useState, useEffect } from 'react';
import { useUsers } from '../hooks/useUsers';
import { useKeys } from '../hooks/useKeys';
import { useIssueRecords } from '../hooks/useIssueRecords';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { 
  TrendingUp, 
  AlertTriangle, 
  Clock, 
  CheckCircle,
  Users,
  Key,
  FileText,
  Calendar,
  ArrowUp,
  ArrowDown,
  Activity
} from 'lucide-react';

export function Dashboard() {
  const { users } = useUsers();
  const { keys } = useKeys();
  const { records } = useIssueRecords();

  const getTodayStats = () => {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    const todayReturned = records.filter(record => {
      if (!record.returned_at) return false;
      const returnDate = new Date(record.returned_at);
      return returnDate >= startOfDay && returnDate < endOfDay;
    }).length;

    const todayIssued = records.filter(record => {
      if (!record.issued_at) return false;
      const issueDate = new Date(record.issued_at);
      return issueDate >= startOfDay && issueDate < endOfDay;
    }).length;

    return { todayReturned, todayIssued };
  };
  const getOverallStats = () => {
    const { todayReturned, todayIssued } = getTodayStats();
    const totalUsers = users.length;
    const totalKeys = keys.length;
    const totalIssues = records.length;
    const activeIssues = records.filter(r => r.status === 'active').length;
    const overdueIssues = records.filter(r => r.status === 'overdue').length;
    const escalatedIssues = records.filter(r => r.status === 'escalated').length;
    const availableKeys = keys.filter(k => k.status === 'available').length;

    return {
      totalUsers,
      totalKeys,
      totalIssues,
      activeIssues,
      overdueIssues,
      escalatedIssues,
      todayReturned,
      todayIssued,
      availableKeys,
      keyUtilization: totalKeys > 0 ? ((totalKeys - availableKeys) / totalKeys * 100).toFixed(1) : 0
    };
  };

  const getWeeklyComparison = () => {
    const now = new Date();
    const thisWeekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
    const lastWeekStart = new Date(thisWeekStart.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastWeekEnd = new Date(thisWeekStart.getTime() - 1);

    const thisWeekIssues = records.filter(record => {
      if (!record.issued_at) return false;
      const issueDate = new Date(record.issued_at);
      return issueDate >= thisWeekStart;
    }).length;

    const lastWeekIssues = records.filter(record => {
      if (!record.issued_at) return false;
      const issueDate = new Date(record.issued_at);
      return issueDate >= lastWeekStart && issueDate <= lastWeekEnd;
    }).length;

    const weeklyChange = lastWeekIssues > 0 ? ((thisWeekIssues - lastWeekIssues) / lastWeekIssues * 100) : 0;

    return { thisWeekIssues, lastWeekIssues, weeklyChange };
  };
  const getUserTypeData = () => {
    const userTypes = users.reduce((acc, user) => {
      const type = user.role || 'unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(userTypes).map(([type, count]) => ({
      name: type.charAt(0).toUpperCase() + type.slice(1),
      value: count,
      color: type === 'student' ? '#3b82f6' : 
             type === 'lecturer' ? '#10b981' : 
             type === 'cleaner' ? '#f59e0b' : '#6b7280'
    }));
  };

  const getIssueStatusData = () => {
    const statusCounts = records.reduce((acc, record) => {
      const status = record.status || 'unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(statusCounts).map(([status, count]) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      count,
      color: status === 'active' ? '#3b82f6' : 
             status === 'overdue' ? '#dc2626' : 
             status === 'escalated' ? '#f59e0b' : 
             status === 'closed' ? '#10b981' : '#6b7280'
    }));
  };

  const getMonthlyTrends = () => {
    const last6Months = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('en-US', { month: 'short' });
      
      const monthRecords = records.filter(record => {
        const recordDate = new Date(record.created_at || '');
        return recordDate.getMonth() === date.getMonth() && 
               recordDate.getFullYear() === date.getFullYear();
      });

      last6Months.push({
        month: monthName,
        issues: monthRecords.length,
        returns: monthRecords.filter(r => r.returned_at).length
      });
    }

    return last6Months;
  };

  const getTopKeys = () => {
    const keyUsage = records.reduce((acc, record) => {
      if (record.keys?.label) {
        acc[record.keys.label] = (acc[record.keys.label] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(keyUsage)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([key, count]) => ({ key, count }));
  };

  const stats = getOverallStats();
  const weeklyComparison = getWeeklyComparison();
  const userTypeData = getUserTypeData();
  const issueStatusData = getIssueStatusData();
  const monthlyTrends = getMonthlyTrends();
  const topKeys = getTopKeys();

  return (
    <div className="space-y-8">
      {/* Phase 7 Dashboard Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Issues</p>
              <p className="text-3xl font-bold text-blue-600">{stats.activeIssues}</p>
              <div className="flex items-center mt-2">
                <Activity className="h-4 w-4 text-blue-500 mr-1" />
                <span className="text-sm text-gray-500">Currently out</span>
              </div>
            </div>
            <Clock className="h-12 w-12 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Overdue Keys</p>
              <p className="text-3xl font-bold text-red-600">{stats.overdueIssues}</p>
              <div className="flex items-center mt-2">
                <AlertTriangle className="h-4 w-4 text-red-500 mr-1" />
                <span className="text-sm text-gray-500">Grace period</span>
              </div>
            </div>
            <AlertTriangle className="h-12 w-12 text-red-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Escalated Cases</p>
              <p className="text-3xl font-bold text-orange-600">{stats.escalatedIssues}</p>
              <div className="flex items-center mt-2">
                <FileText className="h-4 w-4 text-orange-500 mr-1" />
                <span className="text-sm text-gray-500">Security review</span>
              </div>
            </div>
            <FileText className="h-12 w-12 text-orange-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Returned Today</p>
              <p className="text-3xl font-bold text-green-600">{stats.todayReturned}</p>
              <div className="flex items-center mt-2">
                <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-sm text-gray-500">Today's returns</span>
              </div>
            </div>
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
        </div>
      </div>

      {/* Weekly Performance */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Weekly Performance</h3>
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <span className="text-sm text-gray-600 mr-2">This Week:</span>
              <span className="font-bold text-gray-900">{weeklyComparison.thisWeekIssues}</span>
            </div>
            <div className="flex items-center">
              <span className="text-sm text-gray-600 mr-2">Last Week:</span>
              <span className="font-bold text-gray-900">{weeklyComparison.lastWeekIssues}</span>
            </div>
            <div className={`flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              weeklyComparison.weeklyChange >= 0 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {weeklyComparison.weeklyChange >= 0 ? (
                <ArrowUp className="h-3 w-3 mr-1" />
              ) : (
                <ArrowDown className="h-3 w-3 mr-1" />
              )}
              {Math.abs(weeklyComparison.weeklyChange).toFixed(1)}%
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{stats.todayIssued}</div>
            <div className="text-sm text-blue-700">Issued Today</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{stats.todayReturned}</div>
            <div className="text-sm text-green-700">Returned Today</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{stats.todayIssued - stats.todayReturned}</div>
            <div className="text-sm text-purple-700">Net Change</div>
          </div>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalUsers}</p>
            </div>
            <Users className="h-12 w-12 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Keys</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalKeys}</p>
              <p className="text-xs text-gray-500">{stats.availableKeys} available</p>
            </div>
            <Key className="h-12 w-12 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center">
            <FileText className="h-8 w-8 text-indigo-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Issues</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalIssues}</p>
              <p className="text-xs text-gray-500">All time</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Key Utilization</p>
              <p className="text-2xl font-bold text-gray-900">{stats.keyUtilization}%</p>
              <p className="text-xs text-gray-500">Currently in use</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* User Types Distribution */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">User Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={userTypeData}
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
              >
                {userTypeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Issue Status Distribution */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Issue Status Overview</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={issueStatusData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Monthly Trends */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Activity Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="issues" stroke="#3b82f6" name="Issues" />
              <Line type="monotone" dataKey="returns" stroke="#10b981" name="Returns" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Top Keys */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Most Requested Keys</h3>
          <div className="space-y-4">
            {topKeys.map((item, index) => (
              <div key={item.key} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-sm font-medium text-indigo-600">{index + 1}</span>
                  </div>
                  <span className="font-medium text-gray-900">{item.key}</span>
                </div>
                <span className="text-sm text-gray-500">{item.count} requests</span>
              </div>
            ))}
            {topKeys.length === 0 && (
              <p className="text-gray-500 text-center py-8">No key usage data available</p>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
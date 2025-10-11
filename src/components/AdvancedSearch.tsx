import React, { useState } from 'react';
import { Search, Filter, Calendar, User, Key, Clock, X } from 'lucide-react';

interface AdvancedSearchProps {
  onSearch: (filters: SearchFilters) => void;
  onClose: () => void;
}

export interface SearchFilters {
  searchTerm: string;
  userType: string;
  keyStatus: string;
  issueStatus: string;
  dateRange: {
    start: string;
    end: string;
  };
  location: string;
  overdueDays: number | null;
}

export function AdvancedSearch({ onSearch, onClose }: AdvancedSearchProps) {
  const [filters, setFilters] = useState<SearchFilters>({
    searchTerm: '',
    userType: 'all',
    keyStatus: 'all',
    issueStatus: 'all',
    dateRange: {
      start: '',
      end: ''
    },
    location: '',
    overdueDays: null
  });

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleDateRangeChange = (type: 'start' | 'end', value: string) => {
    setFilters(prev => ({
      ...prev,
      dateRange: {
        ...prev.dateRange,
        [type]: value
      }
    }));
  };

  const handleSearch = () => {
    onSearch(filters);
    onClose();
  };

  const clearFilters = () => {
    setFilters({
      searchTerm: '',
      userType: 'all',
      keyStatus: 'all',
      issueStatus: 'all',
      dateRange: {
        start: '',
        end: ''
      },
      location: '',
      overdueDays: null
    });
  };

  const getDefaultDateRange = (range: string) => {
    const now = new Date();
    const start = new Date();
    
    switch (range) {
      case 'today':
        return {
          start: now.toISOString().split('T')[0],
          end: now.toISOString().split('T')[0]
        };
      case 'week':
        start.setDate(now.getDate() - 7);
        return {
          start: start.toISOString().split('T')[0],
          end: now.toISOString().split('T')[0]
        };
      case 'month':
        start.setMonth(now.getMonth() - 1);
        return {
          start: start.toISOString().split('T')[0],
          end: now.toISOString().split('T')[0]
        };
      default:
        return { start: '', end: '' };
    }
  };

  const setQuickDateRange = (range: string) => {
    const dateRange = getDefaultDateRange(range);
    setFilters(prev => ({
      ...prev,
      dateRange
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <Filter className="h-6 w-6 text-indigo-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Advanced Search</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition duration-200"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Search Term */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Search className="h-4 w-4 inline mr-1" />
              Search Term
            </label>
            <input
              type="text"
              value={filters.searchTerm}
              onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
              placeholder="Search by name, ID, key label, location..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Filter Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* User Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="h-4 w-4 inline mr-1" />
                User Type
              </label>
              <select
                value={filters.userType}
                onChange={(e) => handleFilterChange('userType', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="all">All Types</option>
                <option value="student">Students</option>
                <option value="lecturer">Lecturers</option>
                <option value="cleaner">Cleaners</option>
              </select>
            </div>

            {/* Key Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Key className="h-4 w-4 inline mr-1" />
                Key Status
              </label>
              <select
                value={filters.keyStatus}
                onChange={(e) => handleFilterChange('keyStatus', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="available">Available</option>
                <option value="checked_out">Checked Out</option>
              </select>
            </div>

            {/* Issue Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="h-4 w-4 inline mr-1" />
                Issue Status
              </label>
              <select
                value={filters.issueStatus}
                onChange={(e) => handleFilterChange('issueStatus', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="overdue">Overdue</option>
                <option value="escalated">Escalated</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <input
                type="text"
                value={filters.location}
                onChange={(e) => handleFilterChange('location', e.target.value)}
                placeholder="Filter by location..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="h-4 w-4 inline mr-1" />
              Date Range
            </label>
            <div className="flex space-x-2 mb-3">
              <button
                onClick={() => setQuickDateRange('today')}
                className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition duration-200"
              >
                Today
              </button>
              <button
                onClick={() => setQuickDateRange('week')}
                className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition duration-200"
              >
                Last Week
              </button>
              <button
                onClick={() => setQuickDateRange('month')}
                className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition duration-200"
              >
                Last Month
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">From</label>
                <input
                  type="date"
                  value={filters.dateRange.start}
                  onChange={(e) => handleDateRangeChange('start', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">To</label>
                <input
                  type="date"
                  value={filters.dateRange.end}
                  onChange={(e) => handleDateRangeChange('end', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Overdue Days */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Overdue Days (minimum)
            </label>
            <input
              type="number"
              value={filters.overdueDays || ''}
              onChange={(e) => handleFilterChange('overdueDays', e.target.value ? parseInt(e.target.value) : null)}
              placeholder="e.g., 7 for keys overdue by 7+ days"
              min="1"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              onClick={clearFilters}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition duration-200"
            >
              Clear Filters
            </button>
            <button
              onClick={handleSearch}
              className="flex-1 flex justify-center items-center px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition duration-200"
            >
              <Search className="h-4 w-4 mr-2" />
              Apply Search
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
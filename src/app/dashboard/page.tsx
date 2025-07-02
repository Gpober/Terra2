'use client';

import React, { useState } from 'react';
import { 
  Calendar, Download, RefreshCw, Plus, X, ChevronDown, ChevronRight, 
  ArrowUp, ArrowDown, TrendingUp, DollarSign, PieChart, BarChart3, 
  Home, Users, MapPin, Star, Settings, Bell, Search, Filter,
  Building2, Key, Wrench, CreditCard, AlertTriangle, CheckCircle,
  FileText, Calculator, Receipt, Zap, Link, Activity
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  BarChart, Bar, PieChart as RechartsPieChart, Cell, Pie, AreaChart, Area,
  ComposedChart
} from 'recharts';

// Type definitions
interface Property {
  id: string;
  name: string;
  type: string;
  location: string;
  platform: 'airbnb' | 'guesty' | 'direct';
  status: 'occupied' | 'vacant' | 'blocked';
  revenue: number;
  occupancy: number;
  adr: number; // Average Daily Rate
  rating: number;
  bookings: number;
  color: string;
}

interface ReservationSummary {
  totalBookings: number;
  confirmedBookings: number;
  pendingBookings: number;
  totalRevenue: number;
  avgBookingValue: number;
  occupancyRate: number;
}

interface FinancialSummary {
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
  grossMargin: number;
  operatingMargin: number;
  cashFlow: number;
}

interface PayrollSummary {
  totalPayroll: number;
  activeEmployees: number;
  contractorPayments: number;
  payrollTaxes: number;
  benefits: number;
}

interface IntegrationStatus {
  airbnb: boolean;
  guesty: boolean;
  quickbooks: boolean;
  xero: boolean;
  lastSync: string;
}

interface KPIMetric {
  name: string;
  value: number | string;
  change: number;
  trend: 'up' | 'down' | 'stable';
  format: 'currency' | 'percentage' | 'number';
}

interface NotificationState {
  show: boolean;
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
}

export default function DashboardPage() {
  // State management
  const [selectedTimeframe, setSelectedTimeframe] = useState('monthly');
  const [notification, setNotification] = useState<NotificationState>({ show: false, message: '', type: 'info' });
  const [syncDropdownOpen, setSyncDropdownOpen] = useState(false);
  const [propertyDropdownOpen, setPropertyDropdownOpen] = useState(false);
  const [selectedProperties, setSelectedProperties] = useState<Set<string>>(new Set(['all']));

  // Sample data - in production this would come from API
  const properties: Property[] = [
    {
      id: 'miami-beach',
      name: 'Miami Beach Condo',
      type: '2BR/2BA',
      location: 'Miami Beach, FL',
      platform: 'airbnb',
      status: 'occupied',
      revenue: 8500,
      occupancy: 94,
      adr: 285,
      rating: 4.8,
      bookings: 12,
      color: '#667eea'
    },
    {
      id: 'downtown-loft',
      name: 'Downtown Loft',
      type: '1BR/1BA',
      location: 'Downtown Miami, FL',
      platform: 'guesty',
      status: 'occupied',
      revenue: 6200,
      occupancy: 89,
      adr: 220,
      rating: 4.6,
      bookings: 15,
      color: '#28a745'
    },
    {
      id: 'seaside-villa',
      name: 'Seaside Villa',
      type: '4BR/3BA',
      location: 'Key Biscayne, FL',
      platform: 'airbnb',
      status: 'vacant',
      revenue: 12800,
      occupancy: 76,
      adr: 450,
      rating: 4.9,
      bookings: 8,
      color: '#ffc107'
    },
    {
      id: 'mountain-cabin',
      name: 'Mountain Cabin',
      type: '3BR/2BA',
      location: 'Asheville, NC',
      platform: 'direct',
      status: 'blocked',
      revenue: 4800,
      occupancy: 68,
      adr: 180,
      rating: 4.4,
      bookings: 10,
      color: '#dc3545'
    }
  ];

  const reservationSummary: ReservationSummary = {
    totalBookings: 45,
    confirmedBookings: 38,
    pendingBookings: 7,
    totalRevenue: 32300,
    avgBookingValue: 718,
    occupancyRate: 82.1
  };

  const financialSummary: FinancialSummary = {
    totalRevenue: 32300,
    totalExpenses: 18900,
    netIncome: 13400,
    grossMargin: 58.5,
    operatingMargin: 41.5,
    cashFlow: 15200
  };

  const payrollSummary: PayrollSummary = {
    totalPayroll: 12400,
    activeEmployees: 5,
    contractorPayments: 3200,
    payrollTaxes: 1860,
    benefits: 2100
  };

  const integrationStatus: IntegrationStatus = {
    airbnb: true,
    guesty: true,
    quickbooks: true,
    xero: false,
    lastSync: '2025-06-29T14:30:00Z'
  };

  const mainKPIs: KPIMetric[] = [
    { name: 'Total Revenue', value: 32300, change: 8.7, trend: 'up', format: 'currency' },
    { name: 'Net Income', value: 13400, change: 12.3, trend: 'up', format: 'currency' },
    { name: 'Occupancy Rate', value: 82.1, change: 4.2, trend: 'up', format: 'percentage' },
    { name: 'Average ADR', value: 245, change: -2.1, trend: 'down', format: 'currency' },
    { name: 'Total Bookings', value: 45, change: 15.8, trend: 'up', format: 'number' },
    { name: 'Cash Flow', value: 15200, change: 7.9, trend: 'up', format: 'currency' }
  ];

  // Utility functions
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatPercentage = (value: number): string => {
    return `${value.toFixed(1)}%`;
  };

  const formatNumber = (value: number): string => {
    return value.toLocaleString();
  };

  const formatValue = (value: number | string, format: string): string => {
    if (typeof value === 'string') return value;
    switch (format) {
      case 'currency':
        return formatCurrency(value);
      case 'percentage':
        return formatPercentage(value);
      case 'number':
        return formatNumber(value);
      default:
        return value.toString();
    }
  };

  const showNotification = (message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info'): void => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: 'info' });
    }, 3000);
  };

  const handlePropertyToggle = (propertyId: string) => {
    const newSelected = new Set(selectedProperties);
    
    if (propertyId === 'all') {
      if (newSelected.has('all')) {
        newSelected.clear();
        // If deselecting "All Properties", select individual properties
        properties.forEach(p => newSelected.add(p.id));
      } else {
        newSelected.clear();
        newSelected.add('all');
      }
    } else {
      // Remove "All Properties" if selecting individual properties
      newSelected.delete('all');
      
      if (newSelected.has(propertyId)) {
        newSelected.delete(propertyId);
      } else {
        newSelected.add(propertyId);
      }
      
      // If all individual properties are selected, switch to "All Properties"
      if (newSelected.size === properties.length && !newSelected.has('all')) {
        newSelected.clear();
        newSelected.add('all');
      }
      
      // If no properties selected, default to "All Properties"
      if (newSelected.size === 0) {
        newSelected.add('all');
      }
    }
    
    setSelectedProperties(newSelected);
  };

  const getSelectedPropertiesText = () => {
    if (selectedProperties.has('all') || selectedProperties.size === 0) {
      return 'All Properties';
    }
    if (selectedProperties.size === 1) {
      const propertyId = Array.from(selectedProperties)[0];
      const property = properties.find(p => p.id === propertyId);
      return property?.name || '1 Property';
    }
    return `${selectedProperties.size} Properties Selected`;
  };

  const getFilteredProperties = () => {
    if (selectedProperties.has('all') || selectedProperties.size === 0) {
      return properties;
    }
    return properties.filter(property => selectedProperties.has(property.id));
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'airbnb':
        return '🏠';
      case 'guesty':
        return '🏨';
      case 'direct':
        return '📞';
      default:
        return '🏢';
    }
  };

  const getFilteredData = () => {
    const filteredProps = getFilteredProperties();
    
    // Recalculate summaries based on filtered properties
    const filteredReservationSummary = {
      totalBookings: filteredProps.reduce((sum, p) => sum + p.bookings, 0),
      confirmedBookings: Math.floor(filteredProps.reduce((sum, p) => sum + p.bookings, 0) * 0.84),
      pendingBookings: Math.floor(filteredProps.reduce((sum, p) => sum + p.bookings, 0) * 0.16),
      totalRevenue: filteredProps.reduce((sum, p) => sum + p.revenue, 0),
      avgBookingValue: filteredProps.length > 0 ? 
        filteredProps.reduce((sum, p) => sum + p.revenue, 0) / filteredProps.reduce((sum, p) => sum + p.bookings, 0) : 0,
      occupancyRate: filteredProps.length > 0 ? 
        filteredProps.reduce((sum, p) => sum + p.occupancy, 0) / filteredProps.length : 0
    };

    const filteredFinancialSummary = {
      totalRevenue: filteredReservationSummary.totalRevenue,
      totalExpenses: Math.floor(filteredReservationSummary.totalRevenue * 0.585),
      netIncome: Math.floor(filteredReservationSummary.totalRevenue * 0.415),
      grossMargin: 58.5,
      operatingMargin: 41.5,
      cashFlow: Math.floor(filteredReservationSummary.totalRevenue * 0.47)
    };

    return {
      properties: filteredProps,
      reservationSummary: filteredReservationSummary,
      financialSummary: filteredFinancialSummary
    };
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'occupied':
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'vacant':
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'blocked':
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Generate chart data
  const generateRevenueData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const filteredProps = getFilteredProperties();
    const baseRevenue = filteredProps.reduce((sum, p) => sum + p.revenue, 0);
    
    return months.map((month, index) => ({
      month,
      revenue: Math.floor(baseRevenue * (0.7 + index * 0.05) + Math.random() * 2000),
      bookings: Math.floor(filteredProps.reduce((sum, p) => sum + p.bookings, 0) * (0.6 + index * 0.08) + Math.random() * 5),
      expenses: Math.floor(baseRevenue * 0.6 * (0.7 + index * 0.05) + Math.random() * 1000),
      occupancy: Math.floor(filteredProps.reduce((sum, p) => sum + p.occupancy, 0) / filteredProps.length * (0.8 + index * 0.04) + Math.random() * 5)
    }));
  };

  const generatePropertyBreakdown = () => {
    const filteredProps = getFilteredProperties();
    return filteredProps.map(property => ({
      name: property.name.split(' ')[0],
      revenue: property.revenue,
      bookings: property.bookings,
      occupancy: property.occupancy,
      adr: property.adr
    }));
  };

  const generateFinancialBreakdown = () => {
    const { financialSummary } = getFilteredData();
    return [
      { name: 'Revenue', value: financialSummary.totalRevenue, color: '#28a745' },
      { name: 'Expenses', value: financialSummary.totalExpenses, color: '#dc3545' },
      { name: 'Net Income', value: financialSummary.netIncome, color: '#667eea' }
    ];
  };

  const generateRecentActivity = () => {
    return [
      { 
        type: 'booking', 
        message: 'New booking confirmed - Miami Beach Condo', 
        time: '2h ago', 
        icon: '📅',
        color: 'text-green-600' 
      },
      { 
        type: 'sync', 
        message: 'Airbnb data synced successfully', 
        time: '4h ago', 
        icon: '🔄',
        color: 'text-blue-600' 
      },
      { 
        type: 'payment', 
        message: 'Payment received - $1,200', 
        time: '6h ago', 
        icon: '💰',
        color: 'text-green-600' 
      },
      { 
        type: 'expense', 
        message: 'New expense recorded - Cleaning services', 
        time: '8h ago', 
        icon: '📋',
        color: 'text-orange-600' 
      },
      { 
        type: 'sync', 
        message: 'QuickBooks data synced', 
        time: '12h ago', 
        icon: '🔄',
        color: 'text-blue-600' 
      }
    ];
  };

  const revenueData = generateRevenueData();
  const propertyBreakdown = generatePropertyBreakdown();
  const financialBreakdown = generateFinancialBreakdown();
  const recentActivity = generateRecentActivity();
  
  // Get filtered data
  const { properties: filteredProperties, reservationSummary: filteredReservationSummary, financialSummary: filteredFinancialSummary } = getFilteredData();
  
  // Update main KPIs based on filtered data
  const filteredMainKPIs: KPIMetric[] = [
    { name: 'Total Revenue', value: filteredFinancialSummary.totalRevenue, change: 8.7, trend: 'up', format: 'currency' },
    { name: 'Net Income', value: filteredFinancialSummary.netIncome, change: 12.3, trend: 'up', format: 'currency' },
    { name: 'Occupancy Rate', value: filteredReservationSummary.occupancyRate, change: 4.2, trend: 'up', format: 'percentage' },
    { name: 'Average ADR', value: filteredProperties.length > 0 ? filteredProperties.reduce((sum, p) => sum + p.adr, 0) / filteredProperties.length : 0, change: -2.1, trend: 'down', format: 'currency' },
    { name: 'Total Bookings', value: filteredReservationSummary.totalBookings, change: 15.8, trend: 'up', format: 'number' },
    { name: 'Cash Flow', value: filteredFinancialSummary.cashFlow, change: 7.9, trend: 'up', format: 'currency' }
  ];

  const formatLastSync = (syncTime: string): string => {
    const now = new Date();
    const sync = new Date(syncTime);
    const diffInMinutes = Math.floor((now.getTime() - sync.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center">
            <Zap className="w-8 h-8 text-indigo-600 mr-3" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-sm text-gray-600">360° Business Intelligence - Airbnb/Guesty + QuickBooks/Xero</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Controls */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex items-center">
              <div className="flex items-center mr-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">360° Business Intelligence</h2>
                  <p className="text-sm text-gray-600">Complete rental business analytics from booking to bank</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {/* Integration Status */}
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className={`w-2 h-2 rounded-full ${integrationStatus.airbnb ? 'bg-green-500' : 'bg-red-500'}`} title="Airbnb"></div>
                  <div className={`w-2 h-2 rounded-full ${integrationStatus.guesty ? 'bg-green-500' : 'bg-red-500'}`} title="Guesty"></div>
                  <div className={`w-2 h-2 rounded-full ${integrationStatus.quickbooks ? 'bg-green-500' : 'bg-red-500'}`} title="QuickBooks"></div>
                  <div className={`w-2 h-2 rounded-full ${integrationStatus.xero ? 'bg-green-500' : 'bg-red-500'}`} title="Xero"></div>
                </div>
                <span className="text-xs text-gray-500">Last sync: {formatLastSync(integrationStatus.lastSync)}</span>
              </div>
              
              {/* Sync Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setSyncDropdownOpen(!syncDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm hover:border-indigo-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                >
                  <RefreshCw className="w-4 h-4" />
                  Sync
                  <ChevronDown className={`w-4 h-4 transition-transform ${syncDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {syncDropdownOpen && (
                  <div className="absolute top-full right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 min-w-48">
                    <div className="p-2">
                      <button
                        onClick={() => {
                          showNotification('Syncing all platforms...', 'info');
                          setSyncDropdownOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded text-sm"
                      >
                        Sync All Platforms
                      </button>
                      <button
                        onClick={() => {
                          showNotification('Syncing Airbnb data...', 'info');
                          setSyncDropdownOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded text-sm"
                      >
                        Sync Airbnb Only
                      </button>
                      <button
                        onClick={() => {
                          showNotification('Syncing financial data...', 'info');
                          setSyncDropdownOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded text-sm"
                      >
                        Sync Financial Data
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <select
                value={selectedTimeframe}
                onChange={(e) => setSelectedTimeframe(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm hover:border-indigo-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
              >
                <option value="weekly">Weekly View</option>
                <option value="monthly">Monthly View</option>
                <option value="quarterly">Quarterly View</option>
                <option value="yearly">Yearly View</option>
              </select>

              {/* Property Filter Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setPropertyDropdownOpen(!propertyDropdownOpen)}
                  className="flex items-center justify-between w-48 px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm hover:border-indigo-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                >
                  <span className="truncate">{getSelectedPropertiesText()}</span>
                  <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${propertyDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {propertyDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
                    {/* All Properties Option */}
                    <div
                      className="flex items-center px-4 py-2 hover:bg-gray-50 cursor-pointer text-sm border-b border-gray-100"
                      onClick={() => handlePropertyToggle('all')}
                    >
                      <input
                        type="checkbox"
                        checked={selectedProperties.has('all')}
                        onChange={() => {}} // Handled by onClick above
                        className="mr-3 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <span className="font-medium text-gray-900">All Properties</span>
                    </div>
                    
                    {/* Individual Properties */}
                    {properties.map((property) => (
                      <div
                        key={property.id}
                        className="flex items-center px-4 py-2 hover:bg-gray-50 cursor-pointer text-sm"
                        onClick={() => handlePropertyToggle(property.id)}
                      >
                        <input
                          type="checkbox"
                          checked={selectedProperties.has(property.id)}
                          onChange={() => {}} // Handled by onClick above
                          className="mr-3 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <div className="flex items-center flex-1">
                          <span className="mr-2">{getPlatformIcon(property.platform)}</span>
                          <div>
                            <div className="text-gray-900">{property.name}</div>
                            <div className="text-xs text-gray-500">{property.location}</div>
                          </div>
                        </div>
                        <span className={`ml-2 inline-flex px-2 py-1 text-xs rounded-full ${getStatusColor(property.status)}`}>
                          {property.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={() => showNotification('Comprehensive business report exported successfully', 'success')}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
              >
                <Download className="w-4 h-4" />
                Export 360° Report
              </button>
            </div>
          </div>

          {/* Main KPI Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMainKPIs.map((kpi, index) => {
              const icons = [DollarSign, TrendingUp, BarChart3, PieChart, Calendar, CreditCard];
              const colors = ['indigo', 'green', 'blue', 'yellow', 'purple', 'pink'];
              const Icon = icons[index % icons.length];
              const color = colors[index % colors.length];
              
              return (
                <div key={kpi.name} className={`bg-white p-6 rounded-xl shadow-sm border-l-4 border-${color}-500 hover:shadow-md transition-shadow`}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="text-gray-600 text-sm font-medium mb-2">{kpi.name}</div>
                      <div className="text-3xl font-bold text-gray-900 mb-1">
                        {formatValue(kpi.value, kpi.format)}
                      </div>
                      <div className={`text-xs px-2 py-1 rounded-full inline-flex items-center ${
                        kpi.trend === 'up' ? 'bg-green-100 text-green-800' : 
                        kpi.trend === 'down' ? 'bg-red-100 text-red-800' : 
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {kpi.trend === 'up' ? <ArrowUp className="w-3 h-3 mr-1" /> : 
                         kpi.trend === 'down' ? <ArrowDown className="w-3 h-3 mr-1" /> : 
                         <span className="w-3 h-3 mr-1">−</span>}
                        {Math.abs(kpi.change)}% vs last month
                      </div>
                    </div>
                    <Icon className={`w-8 h-8 text-${color}-500`} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Revenue & Bookings Trend */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900">Revenue & Booking Performance</h3>
                <p className="text-sm text-gray-600 mt-1">Cross-platform revenue trends and booking volume analysis</p>
              </div>
              <div className="p-6">
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis yAxisId="revenue" orientation="left" tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                    <YAxis yAxisId="bookings" orientation="right" />
                    <Tooltip 
                      formatter={(value, name) => [
                        name === 'revenue' ? formatCurrency(Number(value)) : 
                        name === 'bookings' ? `${value} bookings` :
                        `${Number(value).toFixed(1)}%`,
                        name === 'revenue' ? 'Revenue' : 
                        name === 'bookings' ? 'Bookings' : 'Occupancy'
                      ]}
                    />
                    <Legend />
                    <Area 
                      yAxisId="revenue"
                      type="monotone" 
                      dataKey="revenue" 
                      fill="#667eea"
                      fillOpacity={0.6}
                      stroke="#667eea"
                      name="revenue"
                    />
                    <Bar 
                      yAxisId="bookings"
                      dataKey="bookings" 
                      fill="#28a745"
                      name="bookings"
                    />
                    <Line 
                      yAxisId="bookings"
                      type="monotone" 
                      dataKey="occupancy" 
                      stroke="#ffc107" 
                      strokeWidth={3}
                      dot={{ r: 4, fill: "#ffc107" }}
                      name="occupancy"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Property Performance */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900">Listing Performance Metrics</h3>
                <p className="text-sm text-gray-600 mt-1">Individual property ROI and platform comparison</p>
              </div>
              <div className="p-6">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={propertyBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                    <Tooltip 
                      formatter={(value, name) => [
                        name === 'revenue' ? formatCurrency(Number(value)) :
                        name === 'adr' ? formatCurrency(Number(value)) :
                        name === 'occupancy' ? `${Number(value).toFixed(1)}%` :
                        `${value} bookings`,
                        name === 'revenue' ? 'Revenue' :
                        name === 'adr' ? 'ADR' :
                        name === 'occupancy' ? 'Occupancy' : 'Bookings'
                      ]}
                    />
                    <Legend />
                    <Bar dataKey="revenue" fill="#667eea" name="revenue" />
                    <Bar dataKey="bookings" fill="#28a745" name="bookings" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Financial Overview */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900">Financial Health Overview</h3>
                <p className="text-sm text-gray-600 mt-1">Real-time P&L from integrated accounting platforms</p>
              </div>
              <div className="p-6">
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Tooltip formatter={(value) => [formatCurrency(Number(value)), '']} />
                    <Pie
                      data={financialBreakdown}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {financialBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900">Business Activity Feed</h3>
                <p className="text-sm text-gray-600 mt-1">Real-time updates from all connected platforms</p>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <div className="text-lg">{activity.icon}</div>
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${activity.color}`}>{activity.message}</p>
                        <p className="text-xs text-gray-500">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Reservation Summary */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Calendar className="w-5 h-5 mr-2 text-indigo-600" />
                  Booking Intelligence
                </h3>
                <p className="text-xs text-gray-600 mt-1">Cross-platform reservation analytics</p>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Bookings:</span>
                  <span className="font-semibold">{filteredReservationSummary.totalBookings}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Confirmed:</span>
                  <span className="font-semibold text-green-600">{filteredReservationSummary.confirmedBookings}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Pending:</span>
                  <span className="font-semibold text-yellow-600">{filteredReservationSummary.pendingBookings}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Avg Booking Value:</span>
                  <span className="font-semibold">{formatCurrency(filteredReservationSummary.avgBookingValue)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Occupancy Rate:</span>
                  <span className="font-semibold">{formatPercentage(filteredReservationSummary.occupancyRate)}</span>
                </div>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <CreditCard className="w-5 h-5 mr-2 text-green-600" />
                  Financial Performance
                </h3>
                <p className="text-xs text-gray-600 mt-1">Real-time accounting integration</p>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Revenue:</span>
                  <span className="font-semibold text-green-600">{formatCurrency(filteredFinancialSummary.totalRevenue)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Expenses:</span>
                  <span className="font-semibold text-red-600">{formatCurrency(filteredFinancialSummary.totalExpenses)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Net Income:</span>
                  <span className="font-semibold">{formatCurrency(filteredFinancialSummary.netIncome)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Gross Margin:</span>
                  <span className="font-semibold">{formatPercentage(filteredFinancialSummary.grossMargin)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Cash Flow:</span>
                  <span className="font-semibold">{formatCurrency(filteredFinancialSummary.cashFlow)}</span>
                </div>
              </div>
            </div>

            {/* Payroll Summary */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Calculator className="w-5 h-5 mr-2 text-purple-600" />
                  Operational Expenses
                </h3>
                <p className="text-xs text-gray-600 mt-1">Staff and contractor management</p>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Payroll:</span>
                  <span className="font-semibold">{formatCurrency(payrollSummary.totalPayroll)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Active Employees:</span>
                  <span className="font-semibold">{payrollSummary.activeEmployees}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Contractor Payments:</span>
                  <span className="font-semibold">{formatCurrency(payrollSummary.contractorPayments)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Payroll Taxes:</span>
                  <span className="font-semibold">{formatCurrency(payrollSummary.payrollTaxes)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Benefits:</span>
                  <span className="font-semibold">{formatCurrency(payrollSummary.benefits)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Rental Portfolio Overview */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">Rental Portfolio Performance</h3>
              <p className="text-sm text-gray-600 mt-1">Cross-platform property analytics and booking performance</p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {filteredProperties.map((property) => (
                  <div key={property.id} className="border border-gray-200 rounded-lg p-4 hover:border-indigo-300 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold text-gray-900">{property.name}</h4>
                        <p className="text-sm text-gray-600">{property.type}</p>
                        <p className="text-xs text-gray-500">{property.location}</p>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-lg">{getPlatformIcon(property.platform)}</span>
                        <span className={`text-xs px-2 py-1 rounded-full mt-1 ${getStatusColor(property.status)}`}>
                          {property.status}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Revenue:</span>
                        <span className="font-medium">{formatCurrency(property.revenue)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Occupancy:</span>
                        <span className="font-medium">{property.occupancy}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">ADR:</span>
                        <span className="font-medium">{formatCurrency(property.adr)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Bookings:</span>
                        <span className="font-medium">{property.bookings}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Notification */}
      {notification.show && (
        <div className={`fixed top-5 right-5 z-50 px-6 py-4 rounded-lg text-white font-medium shadow-lg transition-transform ${
          notification.type === 'success' ? 'bg-green-500' :
          notification.type === 'error' ? 'bg-red-500' :
          notification.type === 'warning' ? 'bg-yellow-500' :
          'bg-blue-500'
        } ${notification.show ? 'translate-x-0' : 'translate-x-full'}`}>
          {notification.message}
        </div>
      )}

      {/* Click outside to close dropdowns */}
      {(syncDropdownOpen || propertyDropdownOpen) && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => {
            setSyncDropdownOpen(false);
            setPropertyDropdownOpen(false);
          }}
        />
      )}
    </div>
  );
}
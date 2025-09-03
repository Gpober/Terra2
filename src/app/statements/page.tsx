"use client";

import React, { useState } from 'react';
import { getCurrentMonthRange } from '@/lib/utils';
import { 
  Calendar, Download, RefreshCw, Plus, X, ChevronDown, ChevronRight, 
  ArrowUp, ArrowDown, TrendingUp, DollarSign, PieChart, BarChart3, 
  Users, UserPlus, UserCheck, UserX, Settings, Bell, Search, Filter,
  Building2, Key, Wrench, CreditCard, AlertTriangle, CheckCircle,
  FileText, Calculator, Receipt, Clock, Edit3, Trash2, Eye,
  MapPin, Phone, Mail, Briefcase, Award, Target, File, FileCheck,
  Send, Archive, Printer, Share2, ExternalLink,
  TrendingDown, Activity, BookOpen
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  BarChart, Bar, PieChart as RechartsPieChart, Cell, Pie, AreaChart, Area,
  ComposedChart
} from 'recharts';

// I AM CFO Brand Colors
const BRAND_COLORS = {
  primary: '#56B6E9',      // Your brand blue
  secondary: '#3A9BD1',    // Darker shade of your blue
  tertiary: '#7CC4ED',     // Lighter shade of your blue
  accent: '#2E86C1',       // Deep blue accent
  success: '#27AE60',      // Professional green
  warning: '#F39C12',      // Professional orange
  danger: '#E74C3C',       // Professional red
  gray: {
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    900: '#0F172A'
  }
};

// Type definitions
interface Owner {
  id: string;
  name: string;
  email: string;
  phone: string;
  properties: string[];
  totalProperties: number;
  monthlyRevenue: number;
  yearToDateRevenue: number;
  status: 'active' | 'inactive';
  lastStatementSent: string;
}

interface Property {
  id: string;
  name: string;
  address: string;
  owner: string;
  ownerId: string;
  type: string;
  monthlyRevenue: number;
  occupancyRate: number;
  expenses: number;
  netIncome: number;
}

interface Statement {
  id: string;
  ownerId: string;
  ownerName: string;
  statementNumber: string;
  period: string;
  periodStart: string;
  periodEnd: string;
  generatedDate: string;
  status: 'draft' | 'sent' | 'viewed' | 'downloaded';
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
  properties: string[];
  lastSent?: string;
  downloadCount: number;
}

interface RevenueItem {
  property: string;
  description: string;
  amount: number;
  date: string;
}

interface ExpenseItem {
  property: string;
  category: string;
  description: string;
  amount: number;
  date: string;
}

interface StatementDetail {
  statement: Statement;
  revenues: RevenueItem[];
  expenses: ExpenseItem[];
  summary: {
    totalGrossRevenue: number;
    totalExpenses: number;
    managementFee: number;
    netIncome: number;
    ownerPayout: number;
  };
}

interface NotificationState {
  show: boolean;
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
}

// I AM CFO Logo Component
const IAMCFOLogo = ({ className = "w-8 h-8" }: { className?: string }) => (
  <div className={`${className} flex items-center justify-center relative`}>
    <svg viewBox="0 0 120 120" className="w-full h-full">
      <circle cx="60" cy="60" r="55" fill="#E2E8F0" stroke="#CBD5E1" strokeWidth="2"/>
      <circle cx="60" cy="60" r="42" fill={BRAND_COLORS.primary}/>
      <g fill="white">
        <rect x="35" y="70" width="6" height="15" rx="1"/>
        <rect x="44" y="65" width="6" height="20" rx="1"/>
        <rect x="53" y="55" width="6" height="30" rx="1"/>
        <rect x="62" y="50" width="6" height="35" rx="1"/>
        <rect x="71" y="60" width="6" height="25" rx="1"/>
        <rect x="80" y="45" width="6" height="40" rx="1"/>
        <path d="M35 72 L44 67 L53 57 L62 52 L71 62 L80 47" 
              stroke="#FFFFFF" strokeWidth="2.5" fill="none"/>
        <circle cx="35" cy="72" r="2.5" fill="#FFFFFF"/>
        <circle cx="44" cy="67" r="2.5" fill="#FFFFFF"/>
        <circle cx="53" cy="57" r="2.5" fill="#FFFFFF"/>
        <circle cx="62" cy="52" r="2.5" fill="#FFFFFF"/>
        <circle cx="71" cy="62" r="2.5" fill="#FFFFFF"/>
        <circle cx="80" cy="47" r="2.5" fill="#FFFFFF"/>
      </g>
      <text x="60" y="95" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold" fontFamily="Arial, sans-serif">CFO</text>
    </svg>
  </div>
);

export default function StatementsPage() {
  // State management
  const [activeTab, setActiveTab] = useState<'overview' | 'statements' | 'owners' | 'templates'>('overview');
  const [notification, setNotification] = useState<NotificationState>({ show: false, message: '', type: 'info' });
  const [selectedPeriod, setSelectedPeriod] = useState('June 2025');
  const [selectedOwner, setSelectedOwner] = useState('All Owners');
  const [selectedProperty, setSelectedProperty] = useState('All Properties');
  const [selectedStatus, setSelectedStatus] = useState('All Status');
  const [searchTerm, setSearchTerm] = useState('');
  const { start: defaultStart, end: defaultEnd } = getCurrentMonthRange();
  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);
  const [useTimeframe, setUseTimeframe] = useState(false);
  const [ownerDropdownOpen, setOwnerDropdownOpen] = useState(false);
  const [propertyDropdownOpen, setPropertyDropdownOpen] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [statementDetailModalOpen, setStatementDetailModalOpen] = useState(false);
  const [selectedStatementDetail, setSelectedStatementDetail] = useState<StatementDetail | null>(null);

  // Sample data
  const owners: Owner[] = [
    {
      id: '1',
      name: 'Sarah Mitchell',
      email: 'sarah.mitchell@gmail.com',
      phone: '(555) 123-4567',
      properties: ['Miami Beach Condo', 'Downtown Loft'],
      totalProperties: 2,
      monthlyRevenue: 8500,
      yearToDateRevenue: 51000,
      status: 'active',
      lastStatementSent: '2025-06-05'
    },
    {
      id: '2',
      name: 'Robert Johnson',
      email: 'robert.johnson@email.com',
      phone: '(555) 234-5678',
      properties: ['Seaside Villa'],
      totalProperties: 1,
      monthlyRevenue: 12800,
      yearToDateRevenue: 76800,
      status: 'active',
      lastStatementSent: '2025-06-05'
    },
    {
      id: '3',
      name: 'Maria Garcia',
      email: 'maria.garcia@company.com',
      phone: '(555) 345-6789',
      properties: ['Mountain Cabin', 'City Apartment'],
      totalProperties: 2,
      monthlyRevenue: 7200,
      yearToDateRevenue: 43200,
      status: 'active',
      lastStatementSent: '2025-06-05'
    },
    {
      id: '4',
      name: 'David Chen',
      email: 'david.chen@outlook.com',
      phone: '(555) 456-7890',
      properties: ['Suburban House'],
      totalProperties: 1,
      monthlyRevenue: 4800,
      yearToDateRevenue: 28800,
      status: 'active',
      lastStatementSent: '2025-06-05'
    }
  ];

  const properties: Property[] = [
    {
      id: '1',
      name: 'Miami Beach Condo',
      address: '123 Ocean Drive, Miami Beach, FL 33139',
      owner: 'Sarah Mitchell',
      ownerId: '1',
      type: '2BR/2BA Condo',
      monthlyRevenue: 4500,
      occupancyRate: 94,
      expenses: 1800,
      netIncome: 2700
    },
    {
      id: '2',
      name: 'Downtown Loft',
      address: '456 Biscayne Blvd, Miami, FL 33132',
      owner: 'Sarah Mitchell',
      ownerId: '1',
      type: '1BR/1BA Loft',
      monthlyRevenue: 4000,
      occupancyRate: 89,
      expenses: 1600,
      netIncome: 2400
    },
    {
      id: '3',
      name: 'Seaside Villa',
      address: '789 Collins Ave, Miami Beach, FL 33154',
      owner: 'Robert Johnson',
      ownerId: '2',
      type: '4BR/3BA Villa',
      monthlyRevenue: 12800,
      occupancyRate: 76,
      expenses: 5100,
      netIncome: 7700
    },
    {
      id: '4',
      name: 'Mountain Cabin',
      address: '321 Pine Ridge Dr, Asheville, NC 28803',
      owner: 'Maria Garcia',
      ownerId: '3',
      type: '3BR/2BA Cabin',
      monthlyRevenue: 3600,
      occupancyRate: 68,
      expenses: 1440,
      netIncome: 2160
    },
    {
      id: '5',
      name: 'City Apartment',
      address: '654 Peachtree St, Atlanta, GA 30309',
      owner: 'Maria Garcia',
      ownerId: '3',
      type: '2BR/1BA Apartment',
      monthlyRevenue: 3600,
      occupancyRate: 85,
      expenses: 1440,
      netIncome: 2160
    },
    {
      id: '6',
      name: 'Suburban House',
      address: '987 Maple Lane, Charlotte, NC 28277',
      owner: 'David Chen',
      ownerId: '4',
      type: '3BR/2BA House',
      monthlyRevenue: 4800,
      occupancyRate: 91,
      expenses: 1920,
      netIncome: 2880
    }
  ];

  const statements: Statement[] = [
    {
      id: '1',
      ownerId: '1',
      ownerName: 'Sarah Mitchell',
      statementNumber: 'STM-2025-06-001',
      period: 'June 2025',
      periodStart: '2025-06-01',
      periodEnd: '2025-06-30',
      generatedDate: '2025-07-01',
      status: 'sent',
      totalRevenue: 8500,
      totalExpenses: 3400,
      netIncome: 5100,
      properties: ['Miami Beach Condo', 'Downtown Loft'],
      lastSent: '2025-07-01',
      downloadCount: 3
    },
    {
      id: '2',
      ownerId: '2',
      ownerName: 'Robert Johnson',
      statementNumber: 'STM-2025-06-002',
      period: 'June 2025',
      periodStart: '2025-06-01',
      periodEnd: '2025-06-30',
      generatedDate: '2025-07-01',
      status: 'viewed',
      totalRevenue: 12800,
      totalExpenses: 5100,
      netIncome: 7700,
      properties: ['Seaside Villa'],
      lastSent: '2025-07-01',
      downloadCount: 1
    },
    {
      id: '3',
      ownerId: '3',
      ownerName: 'Maria Garcia',
      statementNumber: 'STM-2025-06-003',
      period: 'June 2025',
      periodStart: '2025-06-01',
      periodEnd: '2025-06-30',
      generatedDate: '2025-07-01',
      status: 'downloaded',
      totalRevenue: 7200,
      totalExpenses: 2880,
      netIncome: 4320,
      properties: ['Mountain Cabin', 'City Apartment'],
      lastSent: '2025-07-01',
      downloadCount: 2
    },
    {
      id: '4',
      ownerId: '4',
      ownerName: 'David Chen',
      statementNumber: 'STM-2025-06-004',
      period: 'June 2025',
      periodStart: '2025-06-01',
      periodEnd: '2025-06-30',
      generatedDate: '2025-07-01',
      status: 'draft',
      totalRevenue: 4800,
      totalExpenses: 1920,
      netIncome: 2880,
      properties: ['Suburban House'],
      downloadCount: 0
    },
    {
      id: '5',
      ownerId: '1',
      ownerName: 'Sarah Mitchell',
      statementNumber: 'STM-2025-05-001',
      period: 'May 2025',
      periodStart: '2025-05-01',
      periodEnd: '2025-05-31',
      generatedDate: '2025-06-01',
      status: 'sent',
      totalRevenue: 8200,
      totalExpenses: 3280,
      netIncome: 4920,
      properties: ['Miami Beach Condo', 'Downtown Loft'],
      lastSent: '2025-06-01',
      downloadCount: 5
    }
  ];

  const periods = ['June 2025', 'May 2025', 'April 2025', 'March 2025', 'February 2025', 'January 2025'];
  const statuses = ['All Status', 'Draft', 'Sent', 'Viewed', 'Downloaded'];
  const propertyNames = ['All Properties', ...Array.from(new Set(properties.map(p => p.name)))];

  // Enhanced utility functions
  const isDateInRange = (dateString: string): boolean => {
    if (!useTimeframe) return true;
    const date = new Date(dateString);
    const start = new Date(startDate);
    const end = new Date(endDate);
    return date >= start && date <= end;
  };

  // Utility functions
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const showNotification = (message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info'): void => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: 'info' });
    }, 3000);
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'sent':
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'viewed':
        return 'bg-blue-100 text-blue-800';
      case 'downloaded':
        return 'bg-purple-100 text-purple-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getFilteredStatements = () => {
    return statements.filter(statement => {
      // Period filter (only applies when not using timeframe)
      const matchesPeriod = useTimeframe || selectedPeriod === 'All Periods' || statement.period === selectedPeriod;
      
      // Date range filter (only applies when using timeframe)
      const matchesTimeframe = !useTimeframe || isDateInRange(statement.generatedDate);
      
      // Owner filter
      const matchesOwner = selectedOwner === 'All Owners' || statement.ownerName === selectedOwner;
      
      // Property filter
      const matchesProperty = selectedProperty === 'All Properties' || 
        statement.properties.includes(selectedProperty);
      
      // Status filter
      const matchesStatus = selectedStatus === 'All Status' || 
        statement.status.toLowerCase() === selectedStatus.toLowerCase();
      
      // Search filter
      const matchesSearch = searchTerm === '' || 
        statement.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        statement.statementNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        statement.properties.some(prop => prop.toLowerCase().includes(searchTerm.toLowerCase()));
      
      return matchesPeriod && matchesTimeframe && matchesOwner && matchesProperty && matchesStatus && matchesSearch;
    });
  };

  const calculateSummaryStats = () => {
    const filteredStatements = getFilteredStatements();
    const totalRevenue = filteredStatements.reduce((sum, s) => sum + s.totalRevenue, 0);
    const totalExpenses = filteredStatements.reduce((sum, s) => sum + s.totalExpenses, 0);
    const totalNetIncome = filteredStatements.reduce((sum, s) => sum + s.netIncome, 0);
    const totalStatements = filteredStatements.length;
    const sentStatements = filteredStatements.filter(s => s.status === 'sent').length;
    const draftStatements = filteredStatements.filter(s => s.status === 'draft').length;

    return {
      totalRevenue,
      totalExpenses,
      totalNetIncome,
      totalStatements,
      sentStatements,
      draftStatements,
      completionRate: totalStatements > 0 ? (sentStatements / totalStatements) * 100 : 0
    };
  };

  const generateStatementTrendData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return months.map((month, index) => {
      const baseRevenue = 32000;
      const variation = index * 2000 + Math.sin(index) * 1500;
      const revenue = baseRevenue + variation;
      const expenses = revenue * 0.4;
      const netIncome = revenue - expenses;
      
      return {
        month,
        revenue: Math.round(revenue),
        expenses: Math.round(expenses),
        netIncome: Math.round(netIncome),
        statements: 4 + Math.floor(Math.random() * 3)
      };
    });
  };

  const generateOwnerRevenueData = () => {
    return owners.map(owner => ({
      name: owner.name.split(' ')[0],
      revenue: owner.monthlyRevenue,
      properties: owner.totalProperties,
      netIncome: Math.round(owner.monthlyRevenue * 0.6)
    }));
  };

  const viewStatementDetail = (statementId: string) => {
    const statement = statements.find(s => s.id === statementId);
    if (!statement) return;

    // Generate sample detail data
    const revenues: RevenueItem[] = [
      { property: 'Miami Beach Condo', description: 'Rental Income - June 2025', amount: 4500, date: '2025-06-01' },
      { property: 'Miami Beach Condo', description: 'Cleaning Fee', amount: 150, date: '2025-06-15' },
      { property: 'Downtown Loft', description: 'Rental Income - June 2025', amount: 3800, date: '2025-06-01' },
      { property: 'Downtown Loft', description: 'Pet Fee', amount: 50, date: '2025-06-10' }
    ];

    const expenses: ExpenseItem[] = [
      { property: 'Miami Beach Condo', category: 'Maintenance', description: 'Plumbing Repair', amount: 285, date: '2025-06-05' },
      { property: 'Miami Beach Condo', category: 'Cleaning', description: 'Professional Cleaning Service', amount: 120, date: '2025-06-01' },
      { property: 'Downtown Loft', category: 'Utilities', description: 'Electricity Bill', amount: 95, date: '2025-06-15' },
      { property: 'Downtown Loft', category: 'Management', description: 'Property Management Fee', amount: 380, date: '2025-06-30' }
    ];

    const managementFee = statement.totalRevenue * 0.1;
    const ownerPayout = statement.netIncome - managementFee;

    const statementDetail: StatementDetail = {
      statement,
      revenues,
      expenses,
      summary: {
        totalGrossRevenue: statement.totalRevenue,
        totalExpenses: statement.totalExpenses,
        managementFee,
        netIncome: statement.netIncome,
        ownerPayout
      }
    };

    setSelectedStatementDetail(statementDetail);
    setStatementDetailModalOpen(true);
  };

  const handleDownloadStatement = (statementId: string) => {
    const statement = statements.find(s => s.id === statementId);
    if (statement) {
      showNotification(`Downloaded statement ${statement.statementNumber} for ${statement.ownerName}`, 'success');
      // In a real app, this would trigger a PDF download
    }
  };

  const handleSendStatement = (statementId: string) => {
    const statement = statements.find(s => s.id === statementId);
    if (statement) {
      showNotification(`Statement ${statement.statementNumber} sent to ${statement.ownerName}`, 'success');
      // In a real app, this would send an email with the statement
    }
  };

  const handleBulkAction = (action: string) => {
    const filteredStatements = getFilteredStatements();
    showNotification(`${action} applied to ${filteredStatements.length} statements`, 'success');
  };

  const summaryStats = calculateSummaryStats();
  const trendData = generateStatementTrendData();
  const ownerRevenueData = generateOwnerRevenueData();
  const filteredStatements = getFilteredStatements();

  const CHART_COLORS = [BRAND_COLORS.primary, BRAND_COLORS.success, BRAND_COLORS.warning, BRAND_COLORS.danger, BRAND_COLORS.secondary];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header with I AM CFO Branding */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center">
            <IAMCFOLogo className="w-8 h-8 mr-4" />
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl font-bold text-gray-900">I AM CFO</h1>
                <span className="text-sm px-3 py-1 rounded-full text-white" style={{ backgroundColor: BRAND_COLORS.primary }}>
                  Owner Statements
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-1">Automated statement generation • Owner portal • Revenue reporting</p>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Header Controls */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <h2 className="text-3xl font-bold" style={{ color: BRAND_COLORS.primary }}>Owner Statements</h2>
            <div className="flex flex-wrap gap-4 items-center">
              {/* Tab Selector */}
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`px-4 py-2 text-sm rounded-md transition-colors ${
                    activeTab === 'overview'
                      ? 'text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  style={{ backgroundColor: activeTab === 'overview' ? BRAND_COLORS.primary : undefined }}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab('statements')}
                  className={`px-4 py-2 text-sm rounded-md transition-colors ${
                    activeTab === 'statements'
                      ? 'text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  style={{ backgroundColor: activeTab === 'statements' ? BRAND_COLORS.primary : undefined }}
                >
                  Statements
                </button>
                <button
                  onClick={() => setActiveTab('owners')}
                  className={`px-4 py-2 text-sm rounded-md transition-colors ${
                    activeTab === 'owners'
                      ? 'text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  style={{ backgroundColor: activeTab === 'owners' ? BRAND_COLORS.primary : undefined }}
                >
                  Owners
                </button>
                <button
                  onClick={() => setActiveTab('templates')}
                  className={`px-4 py-2 text-sm rounded-md transition-colors ${
                    activeTab === 'templates'
                      ? 'text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  style={{ backgroundColor: activeTab === 'templates' ? BRAND_COLORS.primary : undefined }}
                >
                  Templates
                </button>
              </div>

              {/* Period Selector / Time Frame Toggle */}
              <div className="flex items-center gap-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={useTimeframe}
                    onChange={(e) => setUseTimeframe(e.target.checked)}
                    className="mr-2 h-4 w-4 border-gray-300 rounded"
                    style={{ accentColor: BRAND_COLORS.primary }}
                  />
                  <span className="text-sm text-gray-700">Custom Date Range</span>
                </label>
              </div>

              {useTimeframe ? (
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 transition-all"
                    style={{ '--tw-ring-color': BRAND_COLORS.secondary + '33' } as React.CSSProperties}
                  />
                  <span className="text-sm text-gray-500">to</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 transition-all"
                    style={{ '--tw-ring-color': BRAND_COLORS.secondary + '33' } as React.CSSProperties}
                  />
                </div>
              ) : (
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm hover:border-blue-500 focus:outline-none focus:ring-2 transition-all"
                  style={{ '--tw-ring-color': BRAND_COLORS.secondary + '33' } as React.CSSProperties}
                >
                  {periods.map((period) => (
                    <option key={period} value={period}>{period}</option>
                  ))}
                </select>
              )}

              {/* Action Buttons */}
              <button
                onClick={() => showNotification('Generating statements for all owners...', 'info')}
                className="flex items-center gap-2 px-4 py-2 text-white rounded-lg hover:opacity-90 transition-colors shadow-sm"
                style={{ backgroundColor: BRAND_COLORS.primary }}
              >
                <Plus className="w-4 h-4" />
                Generate Statements
              </button>

              <button
                onClick={() => showNotification('Statements exported successfully', 'success')}
                className="flex items-center gap-2 px-4 py-2 text-white rounded-lg hover:opacity-90 transition-colors shadow-sm"
                style={{ backgroundColor: BRAND_COLORS.success }}
              >
                <Download className="w-4 h-4" />
                Export All
              </button>

              <button
                onClick={() => showNotification('Statement data refreshed', 'info')}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors shadow-sm"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <>
              {/* Filter Summary Display */}
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">Showing statements for:</span>
                    <span className="font-medium text-gray-900">{selectedOwner}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">•</span>
                    <span className="font-medium text-gray-900">{selectedProperty}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">•</span>
                    {useTimeframe ? (
                      <span className="font-medium text-gray-900">
                        {new Date(startDate).toLocaleDateString()} - {new Date(endDate).toLocaleDateString()}
                      </span>
                    ) : (
                      <span className="font-medium text-gray-900">{selectedPeriod}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">•</span>
                    <span className="font-medium text-gray-900">{selectedStatus}</span>
                  </div>
                  <div className="flex items-center gap-2 ml-auto">
                    <span className="text-gray-600">Total:</span>
                    <span className="font-bold" style={{ color: BRAND_COLORS.primary }}>
                      {getFilteredStatements().length} statements
                    </span>
                  </div>
                </div>
              </div>
              {/* Summary KPIs */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 hover:shadow-md transition-shadow" style={{ borderLeftColor: BRAND_COLORS.primary }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-gray-600 text-sm font-medium mb-2">Total Revenue</div>
                      <div className="text-3xl font-bold text-gray-900 mb-1">{formatCurrency(summaryStats.totalRevenue)}</div>
                      <div className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full inline-block">
                        +8.3% vs last month
                      </div>
                    </div>
                    <DollarSign className="w-8 h-8" style={{ color: BRAND_COLORS.primary }} />
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 hover:shadow-md transition-shadow" style={{ borderLeftColor: BRAND_COLORS.success }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-gray-600 text-sm font-medium mb-2">Net Income</div>
                      <div className="text-3xl font-bold text-gray-900 mb-1">{formatCurrency(summaryStats.totalNetIncome)}</div>
                      <div className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full inline-block">
                        +12.1% vs last month
                      </div>
                    </div>
                    <TrendingUp className="w-8 h-8" style={{ color: BRAND_COLORS.success }} />
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 hover:shadow-md transition-shadow" style={{ borderLeftColor: BRAND_COLORS.warning }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-gray-600 text-sm font-medium mb-2">Statements Generated</div>
                      <div className="text-3xl font-bold text-gray-900 mb-1">{summaryStats.totalStatements}</div>
                      <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full inline-block">
                        {summaryStats.sentStatements} sent, {summaryStats.draftStatements} pending
                      </div>
                    </div>
                    <FileText className="w-8 h-8" style={{ color: BRAND_COLORS.warning }} />
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 hover:shadow-md transition-shadow" style={{ borderLeftColor: BRAND_COLORS.secondary }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-gray-600 text-sm font-medium mb-2">Completion Rate</div>
                      <div className="text-3xl font-bold text-gray-900 mb-1">{summaryStats.completionRate.toFixed(0)}%</div>
                      <div className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full inline-block">
                        On schedule
                      </div>
                    </div>
                    <CheckCircle className="w-8 h-8" style={{ color: BRAND_COLORS.secondary }} />
                  </div>
                </div>
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Revenue Trend */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-gray-200">
                    <h3 className="text-xl font-semibold text-gray-900">6-Month Revenue Trend</h3>
                    <p className="text-sm text-gray-600 mt-1">Monthly revenue, expenses, and net income</p>
                  </div>
                  <div className="p-6">
                    <ResponsiveContainer width="100%" height={300}>
                      <ComposedChart data={trendData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                        <Tooltip formatter={(value) => [formatCurrency(Number(value)), '']} />
                        <Legend />
                        <Bar dataKey="revenue" fill={BRAND_COLORS.primary} name="Revenue" />
                        <Bar dataKey="expenses" fill={BRAND_COLORS.danger} name="Expenses" />
                        <Line type="monotone" dataKey="netIncome" stroke={BRAND_COLORS.success} strokeWidth={3} name="Net Income" />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Owner Revenue Distribution */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-gray-200">
                    <h3 className="text-xl font-semibold text-gray-900">Owner Revenue Distribution</h3>
                    <p className="text-sm text-gray-600 mt-1">Monthly revenue by property owner</p>
                  </div>
                  <div className="p-6">
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={ownerRevenueData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                        <Tooltip formatter={(value) => [formatCurrency(Number(value)), '']} />
                        <Legend />
                        <Bar dataKey="revenue" fill={BRAND_COLORS.primary} name="Revenue" />
                        <Bar dataKey="netIncome" fill={BRAND_COLORS.success} name="Net Income" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Recent Statement Activity */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-gray-200">
                    <h3 className="text-xl font-semibold text-gray-900">Recent Statement Activity</h3>
                  </div>
                  <div className="p-6">
                    <div className="space-y-4">
                      {statements.slice(0, 4).map((statement) => (
                        <div key={statement.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                          <div>
                            <div className="font-medium text-gray-900">{statement.ownerName}</div>
                            <div className="text-sm text-gray-600">
                              {statement.statementNumber} • {statement.period}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium text-gray-900">{formatCurrency(statement.netIncome)}</div>
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(statement.status)}`}>
                              {statement.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Property Filter */}
                  <div className="relative">
                    <button
                      onClick={() => setPropertyDropdownOpen(!propertyDropdownOpen)}
                      className="flex items-center justify-between w-48 px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm hover:border-blue-500 focus:outline-none focus:ring-2 transition-all"
                      style={{ '--tw-ring-color': BRAND_COLORS.secondary + '33' } as React.CSSProperties}
                    >
                      <span>{selectedProperty}</span>
                      <ChevronDown className={`w-4 h-4 transition-transform ${propertyDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {propertyDropdownOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
                        {propertyNames.map((property) => (
                          <div
                            key={property}
                            className="px-4 py-2 hover:bg-gray-50 cursor-pointer text-sm"
                            onClick={() => {
                              setSelectedProperty(property);
                              setPropertyDropdownOpen(false);
                            }}
                          >
                            {property}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-gray-200">
                    <h3 className="text-xl font-semibold text-gray-900">Quick Actions</h3>
                  </div>
                  <div className="p-6">
                    <div className="space-y-3">
                      <button
                        onClick={() => showNotification('Sending all pending statements...', 'info')}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <Send className="w-4 h-4" />
                        Send All Pending Statements
                      </button>
                      <button
                        onClick={() => showNotification('Downloading all statements as ZIP...', 'info')}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <Archive className="w-4 h-4" />
                        Download All as ZIP
                      </button>
                      <button
                        onClick={() => showNotification('Opening statement template editor...', 'info')}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <Settings className="w-4 h-4" />
                        Customize Templates
                      </button>
                      <button
                        onClick={() => showNotification('Setting up automated statements...', 'info')}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 text-white rounded-lg hover:opacity-90 transition-colors"
                        style={{ backgroundColor: BRAND_COLORS.primary }}
                      >
                        <Calendar className="w-4 h-4" />
                        Schedule Auto-Send
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Statements Tab */}
          {activeTab === 'statements' && (
            <>
              {/* Statement Filters */}
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <div className="flex gap-4 items-center flex-wrap">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search statements..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 transition-all w-64"
                      style={{ '--tw-ring-color': BRAND_COLORS.secondary + '33' } as React.CSSProperties}
                    />
                  </div>

                  {/* Owner Filter */}
                  <div className="relative">
                    <button
                      onClick={() => setOwnerDropdownOpen(!ownerDropdownOpen)}
                      className="flex items-center justify-between w-48 px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm hover:border-blue-500 focus:outline-none focus:ring-2 transition-all"
                      style={{ '--tw-ring-color': BRAND_COLORS.secondary + '33' } as React.CSSProperties}
                    >
                      <span>{selectedOwner}</span>
                      <ChevronDown className={`w-4 h-4 transition-transform ${ownerDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {ownerDropdownOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50">
                        <div
                          className="px-4 py-2 hover:bg-gray-50 cursor-pointer text-sm"
                          onClick={() => {
                            setSelectedOwner('All Owners');
                            setOwnerDropdownOpen(false);
                          }}
                        >
                          All Owners
                        </div>
                        {owners.map((owner) => (
                          <div
                            key={owner.id}
                            className="px-4 py-2 hover:bg-gray-50 cursor-pointer text-sm"
                            onClick={() => {
                              setSelectedOwner(owner.name);
                              setOwnerDropdownOpen(false);
                            }}
                          >
                            {owner.name}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Property Filter */}
                  <div className="relative">
                    <button
                      onClick={() => setPropertyDropdownOpen(!propertyDropdownOpen)}
                      className="flex items-center justify-between w-48 px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm hover:border-blue-500 focus:outline-none focus:ring-2 transition-all"
                      style={{ '--tw-ring-color': BRAND_COLORS.secondary + '33' } as React.CSSProperties}
                    >
                      <span>{selectedProperty}</span>
                      <ChevronDown className={`w-4 h-4 transition-transform ${propertyDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {propertyDropdownOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
                        {propertyNames.map((property) => (
                          <div
                            key={property}
                            className="px-4 py-2 hover:bg-gray-50 cursor-pointer text-sm"
                            onClick={() => {
                              setSelectedProperty(property);
                              setPropertyDropdownOpen(false);
                            }}
                          >
                            {property}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Status Filter */}
                  <div className="relative">
                    <button
                      onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                      className="flex items-center justify-between w-32 px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm hover:border-blue-500 focus:outline-none focus:ring-2 transition-all"
                      style={{ '--tw-ring-color': BRAND_COLORS.secondary + '33' } as React.CSSProperties}
                    >
                      <span>{selectedStatus}</span>
                      <ChevronDown className={`w-4 h-4 transition-transform ${statusDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {statusDropdownOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50">
                        {statuses.map((status) => (
                          <div
                            key={status}
                            className="px-4 py-2 hover:bg-gray-50 cursor-pointer text-sm"
                            onClick={() => {
                              setSelectedStatus(status);
                              setStatusDropdownOpen(false);
                            }}
                          >
                            {status}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Time Frame Controls */}
                  <div className="flex items-center gap-3 pl-4 border-l border-gray-300">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={useTimeframe}
                        onChange={(e) => setUseTimeframe(e.target.checked)}
                        className="mr-2 h-4 w-4 border-gray-300 rounded"
                        style={{ accentColor: BRAND_COLORS.primary }}
                      />
                      <span className="text-sm text-gray-700">Custom Range</span>
                    </label>
                    
                    {useTimeframe && (
                      <div className="flex items-center gap-2">
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 transition-all"
                          style={{ '--tw-ring-color': BRAND_COLORS.secondary + '33' } as React.CSSProperties}
                        />
                        <span className="text-xs text-gray-500">to</span>
                        <input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 transition-all"
                          style={{ '--tw-ring-color': BRAND_COLORS.secondary + '33' } as React.CSSProperties}
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleBulkAction('Send All')}
                    className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Send className="w-4 h-4" />
                    Send All
                  </button>
                  <button
                    onClick={() => handleBulkAction('Download All')}
                    className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Download All
                  </button>
                </div>
              </div>

              {/* Statements Table */}
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-semibold text-gray-900">Owner Statements</h3>
                    <div className="text-sm text-gray-600">
                      Showing {filteredStatements.length} of {statements.length} statements
                    </div>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statement</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Owner</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Period</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Net Income</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredStatements.map((statement) => (
                        <tr key={statement.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{statement.statementNumber}</div>
                              <div className="text-sm text-gray-500">Generated {formatDate(statement.generatedDate)}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{statement.ownerName}</div>
                              <div className="text-sm text-gray-500">{statement.properties.length} properties</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {statement.period}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(statement.totalRevenue)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(statement.netIncome)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(statement.status)}`}>
                              {statement.status}
                            </span>
                            {statement.downloadCount > 0 && (
                              <div className="text-xs text-gray-500 mt-1">
                                Downloaded {statement.downloadCount}x
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex gap-2">
                              <button
                                onClick={() => viewStatementDetail(statement.id)}
                                className="hover:text-gray-900"
                                style={{ color: BRAND_COLORS.primary }}
                                title="View Details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDownloadStatement(statement.id)}
                                className="text-gray-600 hover:text-gray-900"
                                title="Download PDF"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleSendStatement(statement.id)}
                                className="text-gray-600 hover:text-gray-900"
                                title="Send to Owner"
                              >
                                <Send className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => showNotification(`Printing statement ${statement.statementNumber}`, 'info')}
                                className="text-gray-600 hover:text-gray-900"
                                title="Print"
                              >
                                <Printer className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* Owners Tab */}
          {activeTab === 'owners' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {owners.map((owner) => (
                <div key={owner.id} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-lg" style={{ backgroundColor: BRAND_COLORS.primary }}>
                          {owner.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div className="ml-3">
                          <h3 className="font-semibold text-gray-900">{owner.name}</h3>
                          <p className="text-sm text-gray-600">{owner.totalProperties} properties</p>
                        </div>
                      </div>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(owner.status)}`}>
                        {owner.status}
                      </span>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <Mail className="w-4 h-4 mr-2" />
                        {owner.email}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Phone className="w-4 h-4 mr-2" />
                        {owner.phone}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="w-4 h-4 mr-2" />
                        Last statement: {formatDate(owner.lastStatementSent)}
                      </div>
                    </div>

                    <div className="border-t border-gray-200 pt-4">
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <div className="text-sm text-gray-600">Monthly Revenue</div>
                          <div className="font-semibold text-gray-900">{formatCurrency(owner.monthlyRevenue)}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">YTD Revenue</div>
                          <div className="font-semibold text-gray-900">{formatCurrency(owner.yearToDateRevenue)}</div>
                        </div>
                      </div>

                      <div className="mb-4">
                        <div className="text-sm text-gray-600 mb-2">Properties</div>
                        <div className="space-y-1">
                          {owner.properties.slice(0, 2).map((property, index) => (
                            <div key={index} className="text-xs text-gray-500 flex items-center">
                              <Building2 className="w-3 h-3 mr-1" />
                              {property}
                            </div>
                          ))}
                          {owner.properties.length > 2 && (
                            <div className="text-xs text-gray-400">
                              +{owner.properties.length - 2} more
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => showNotification(`Viewing ${owner.name}'s details`, 'info')}
                          className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <Eye className="w-4 h-4 inline mr-1" />
                          View
                        </button>
                        <button
                          onClick={() => showNotification(`Generating statement for ${owner.name}`, 'info')}
                          className="flex-1 px-3 py-2 text-sm text-white rounded-lg hover:opacity-90 transition-colors"
                          style={{ backgroundColor: BRAND_COLORS.primary }}
                        >
                          <FileText className="w-4 h-4 inline mr-1" />
                          Generate
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Templates Tab */}
          {activeTab === 'templates' && (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900">Statement Templates</h3>
                <p className="text-sm text-gray-600 mt-1">Customize the appearance and content of your owner statements</p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="border border-gray-200 rounded-lg p-6 hover:border-blue-300 transition-colors">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-gray-900">Standard Template</h4>
                      <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">Active</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">Clean, professional layout with comprehensive revenue and expense breakdown</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => showNotification('Opening template preview...', 'info')}
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Preview
                      </button>
                      <button
                        onClick={() => showNotification('Opening template editor...', 'info')}
                        className="flex-1 px-3 py-2 text-sm text-white rounded-lg hover:opacity-90 transition-colors"
                        style={{ backgroundColor: BRAND_COLORS.primary }}
                      >
                        Edit
                      </button>
                    </div>
                  </div>

                  <div className="border border-gray-200 rounded-lg p-6 hover:border-blue-300 transition-colors">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-gray-900">Detailed Template</h4>
                      <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">Inactive</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">Extended format with individual transaction details and property photos</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => showNotification('Opening template preview...', 'info')}
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Preview
                      </button>
                      <button
                        onClick={() => showNotification('Activating detailed template...', 'info')}
                        className="flex-1 px-3 py-2 text-sm text-white rounded-lg hover:opacity-90 transition-colors"
                        style={{ backgroundColor: BRAND_COLORS.success }}
                      >
                        Activate
                      </button>
                    </div>
                  </div>

                  <div className="border border-gray-200 rounded-lg p-6 hover:border-blue-300 transition-colors">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-gray-900">Minimal Template</h4>
                      <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">Inactive</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">Simplified one-page summary perfect for single-property owners</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => showNotification('Opening template preview...', 'info')}
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Preview
                      </button>
                      <button
                        onClick={() => showNotification('Activating minimal template...', 'info')}
                        className="flex-1 px-3 py-2 text-sm text-white rounded-lg hover:opacity-90 transition-colors"
                        style={{ backgroundColor: BRAND_COLORS.success }}
                      >
                        Activate
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-8 p-6 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-4">Template Customization Options</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h5 className="font-medium text-gray-900 mb-2">Branding</h5>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Company logo and colors</li>
                        <li>• Custom header and footer</li>
                        <li>• Contact information</li>
                        <li>• Social media links</li>
                      </ul>
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-900 mb-2">Content</h5>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Revenue breakdown detail level</li>
                        <li>• Expense categorization</li>
                        <li>• Chart and graph inclusion</li>
                        <li>• Property performance metrics</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Statement Detail Modal */}
          {statementDetailModalOpen && selectedStatementDetail && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
              <div className="bg-white rounded-xl p-8 max-w-4xl w-full mx-4 max-h-90vh overflow-y-auto shadow-2xl">
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">Statement Details</h3>
                    <p className="text-sm text-gray-600">{selectedStatementDetail.statement.statementNumber} • {selectedStatementDetail.statement.ownerName}</p>
                  </div>
                  <button
                    onClick={() => setStatementDetailModalOpen(false)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="space-y-6">
                  {/* Statement Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-600">Gross Revenue</div>
                      <div className="text-lg font-semibold text-gray-900">{formatCurrency(selectedStatementDetail.summary.totalGrossRevenue)}</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-600">Total Expenses</div>
                      <div className="text-lg font-semibold text-red-600">{formatCurrency(selectedStatementDetail.summary.totalExpenses)}</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-600">Management Fee</div>
                      <div className="text-lg font-semibold text-yellow-600">{formatCurrency(selectedStatementDetail.summary.managementFee)}</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-600">Owner Payout</div>
                      <div className="text-lg font-semibold text-green-600">{formatCurrency(selectedStatementDetail.summary.ownerPayout)}</div>
                    </div>
                  </div>

                  {/* Revenue Details */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Revenue Breakdown</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full border border-gray-200 rounded-lg">
                        <thead className="bg-green-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Property</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Description</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Date</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {selectedStatementDetail.revenues.map((revenue, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm text-gray-900">{revenue.property}</td>
                              <td className="px-4 py-3 text-sm text-gray-900">{revenue.description}</td>
                              <td className="px-4 py-3 text-sm text-gray-900">{formatDate(revenue.date)}</td>
                              <td className="px-4 py-3 text-sm text-right text-green-600 font-medium">{formatCurrency(revenue.amount)}</td>
                            </tr>
                          ))}
                          <tr className="bg-green-100 font-semibold">
                            <td colSpan={3} className="px-4 py-3 text-sm text-gray-900">Total Revenue</td>
                            <td className="px-4 py-3 text-sm text-right text-green-700">{formatCurrency(selectedStatementDetail.summary.totalGrossRevenue)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Expense Details */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Expense Breakdown</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full border border-gray-200 rounded-lg">
                        <thead className="bg-red-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Property</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Category</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Description</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Date</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {selectedStatementDetail.expenses.map((expense, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm text-gray-900">{expense.property}</td>
                              <td className="px-4 py-3 text-sm text-gray-900">{expense.category}</td>
                              <td className="px-4 py-3 text-sm text-gray-900">{expense.description}</td>
                              <td className="px-4 py-3 text-sm text-gray-900">{formatDate(expense.date)}</td>
                              <td className="px-4 py-3 text-sm text-right text-red-600 font-medium">{formatCurrency(expense.amount)}</td>
                            </tr>
                          ))}
                          <tr className="bg-red-100 font-semibold">
                            <td colSpan={4} className="px-4 py-3 text-sm text-gray-900">Total Expenses</td>
                            <td className="px-4 py-3 text-sm text-right text-red-700">{formatCurrency(selectedStatementDetail.summary.totalExpenses)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Property Performance Summary */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Property Performance</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedStatementDetail.statement.properties.map((propertyName, index) => {
                        const property = properties.find(p => p.name === propertyName);
                        if (!property) return null;
                        
                        return (
                          <div key={index} className="border border-gray-200 rounded-lg p-4">
                            <h5 className="font-medium text-gray-900 mb-2">{property.name}</h5>
                            <div className="text-sm text-gray-600 mb-3">{property.address}</div>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Monthly Revenue:</span>
                                <span className="text-sm font-medium text-green-600">{formatCurrency(property.monthlyRevenue)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Occupancy Rate:</span>
                                <span className="text-sm font-medium text-gray-900">{property.occupancyRate}%</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Net Income:</span>
                                <span className="text-sm font-medium text-green-600">{formatCurrency(property.netIncome)}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Net Income Calculation */}
                  <div className="border-t-2 pt-6" style={{ borderTopColor: BRAND_COLORS.primary }}>
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Net Income Calculation</h4>
                    <div className="bg-gray-50 p-6 rounded-lg">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-700">Gross Revenue</span>
                          <span className="font-medium text-green-600">{formatCurrency(selectedStatementDetail.summary.totalGrossRevenue)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-700">Less: Total Expenses</span>
                          <span className="font-medium text-red-600">({formatCurrency(selectedStatementDetail.summary.totalExpenses)})</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-700">Less: Management Fee (10%)</span>
                          <span className="font-medium text-yellow-600">({formatCurrency(selectedStatementDetail.summary.managementFee)})</span>
                        </div>
                        <div className="border-t border-gray-300 pt-3">
                          <div className="flex justify-between items-center">
                            <span className="text-lg font-bold" style={{ color: BRAND_COLORS.primary }}>Owner Net Payout</span>
                            <span className="text-lg font-bold" style={{ color: BRAND_COLORS.primary }}>{formatCurrency(selectedStatementDetail.summary.ownerPayout)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-4 pt-6 border-t border-gray-200">
                    <button
                      onClick={() => {
                        handleDownloadStatement(selectedStatementDetail.statement.id);
                        setStatementDetailModalOpen(false);
                      }}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-white rounded-lg hover:opacity-90 transition-colors"
                      style={{ backgroundColor: BRAND_COLORS.primary }}
                    >
                      <Download className="w-4 h-4" />
                      Download PDF
                    </button>
                    <button
                      onClick={() => {
                        handleSendStatement(selectedStatementDetail.statement.id);
                        setStatementDetailModalOpen(false);
                      }}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-white rounded-lg hover:opacity-90 transition-colors"
                      style={{ backgroundColor: BRAND_COLORS.success }}
                    >
                      <Send className="w-4 h-4" />
                      Send to Owner
                    </button>
                    <button
                      onClick={() => showNotification(`Printing statement ${selectedStatementDetail.statement.statementNumber}`, 'info')}
                      className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Printer className="w-4 h-4" />
                      Print
                    </button>
                    <button
                      onClick={() => setStatementDetailModalOpen(false)}
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      <X className="w-4 h-4" />
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

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
          {(ownerDropdownOpen || statusDropdownOpen || propertyDropdownOpen) && (
            <div
              className="fixed inset-0 z-10"
              onClick={() => {
                setOwnerDropdownOpen(false);
                setStatusDropdownOpen(false);
                setPropertyDropdownOpen(false);
              }}
            />
          )}
        </div>
      </main>
    </div>
  );
}

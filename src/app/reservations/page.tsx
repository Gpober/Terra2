"use client";
import React, { useState, useEffect, useRef } from 'react';
import { Download, RefreshCw, Plus, X, ChevronDown } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { supabase } from '@/lib/supabaseClient';

// Constants
const BRAND_COLORS = {
  primary: '#56B6E9',
  secondary: '#3A9BD1',
  tertiary: '#7CC4ED',
  accent: '#2E86C1',
  success: '#27AE60',
  warning: '#F39C12',
  danger: '#E74C3C',
  // Chart-specific colors for better distinction
  chart: {
    miami: '#8B5CF6',      // Purple for Miami Beach
    downtown: '#10B981',   // Emerald for Downtown
    suburb: '#F59E0B',     // Amber for Suburb
    comparison2024: '#EF4444', // Red for 2024 comparison
    comparison2025: '#3B82F6'  // Blue for 2025 comparison
  },
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

const PROPERTY_PALETTE = ['#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#3B82F6'];

// Types
type Property = {
  id: string;
  name: string;
  type: string;
  description: string;
  revenue: number;
  occupancy: number;
  noi: number;
  color: string;
};

type ReservationStatus = 'confirmed' | 'pending' | 'cancelled';

type Reservation = {
  id: number;
  guest: string;
  email: string;
  phone: string;
  property: string;
  checkin: string;
  checkout: string;
  nights: number;
  revenue: number;
  status: ReservationStatus;
};

type CalendarDay = {
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  dateStr: string;
  bookings: Reservation[];
  dotClass: string;
};

type KPIs = {
  totalRevenue: number;
  avgNightlyRate: number;
  avgStayLength: number;
  occupancyRate: number;
};

type DBReservationRow = {
  id: string;
  check_in: string | null;
  check_out: string | null;
  confirmation_code: string | null;
  listing: string | null;
  guest: string | null;
  reservation_id: string | null;
  net_income: number | null;
  source: string | null;
  qbo_listing: string | null;
  created_at: string;
};

type NotificationState = {
  show: boolean;
  message: string;
  type: 'info' | 'success' | 'error';
};

type TooltipState = {
  show: boolean;
  content: string;
  x: number;
  y: number;
};

type NewReservationForm = {
  guestName: string;
  guestEmail: string;
  property: string;
  checkinDate: string;
  checkoutDate: string;
  nightlyRate: string;
  totalGuests: string;
  notes: string;
};

type ChartMode = 'monthly' | 'seasonal' | 'ytd' | '2025-only' | 'comparison';

// Helpers
const slugify = (qbo_listing: string): string =>
  qbo_listing.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const toNights = (checkIn?: string | null, checkOut?: string | null): number => {
  if (!checkIn || !checkOut) return 0;
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const diff = end.getTime() - start.getTime();
  return diff > 0 ? diff / (1000 * 60 * 60 * 24) : 0;
};

const getNightsInMonth = (
  checkIn: string,
  checkOut: string,
  monthIndex: number,
  year: number
): number => {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const monthStart = new Date(year, monthIndex, 1);
  const monthEnd = new Date(year, monthIndex + 1, 1);
  const effectiveStart = start > monthStart ? start : monthStart;
  const effectiveEnd = end < monthEnd ? end : monthEnd;
  const diff = effectiveEnd.getTime() - effectiveStart.getTime();
  return diff > 0 ? diff / (1000 * 60 * 60 * 24) : 0;
};

const calculateKPIsFromReservations = (
  reservations: Reservation[],
  propertyCount: number,
  monthIndex: number,
  year: number
): KPIs => {
  const totalRevenue = reservations.reduce((sum, r) => sum + r.revenue, 0);
  const totalNights = reservations.reduce(
    (sum, r) => sum + getNightsInMonth(r.checkin, r.checkout, monthIndex, year),
    0
  );
  const avgNightlyRate = totalNights ? totalRevenue / totalNights : 0;
  const avgStayLength = reservations.length ? totalNights / reservations.length : 0;
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const availableNights = propertyCount * daysInMonth;
  const occupancyRate = availableNights
    ? Math.round((totalNights / availableNights) * 100)
    : 0;
  return { totalRevenue, avgNightlyRate, avgStayLength, occupancyRate };
};

const PropertyDropdown = ({
  properties,
  selectedProperties,
  onPropertyChange,
  isOpen,
  onToggle
}: {
  properties: Property[];
  selectedProperties: string[];
  onPropertyChange: (id: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}) => {
  const dropdownText = selectedProperties.length === 0 
    ? 'No Properties' 
    : selectedProperties.length === properties.length 
      ? 'All Properties' 
      : selectedProperties.length === 1 
        ? properties.find(p => p.id === selectedProperties[0])?.name || '1 Property' 
        : `${selectedProperties.length} Properties`;

  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-48 px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm hover:border-blue-500 focus:outline-none focus:ring-2 transition-all"
        style={{ '--tw-ring-color': `${BRAND_COLORS.secondary}33` } as React.CSSProperties}
      >
        <span>{dropdownText}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
          <div className="flex justify-between px-4 py-2 text-sm border-b border-gray-200">
            <button onClick={() => onPropertyChange('selectAll')} className="text-blue-600 hover:underline">
              Select All
            </button>
            <button onClick={() => onPropertyChange('clearAll')} className="text-blue-600 hover:underline">
              Clear All
            </button>
          </div>
          {properties.map((property) => (
            <div
              key={property.id}
              className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 cursor-pointer"
              onClick={() => onPropertyChange(property.id)}
            >
              <input
                type="checkbox"
                checked={selectedProperties.includes(property.id)}
                onChange={() => onPropertyChange(property.id)}
                className="w-4 h-4"
                style={{ accentColor: BRAND_COLORS.primary }}
              />
              <label className="text-sm text-gray-900 flex-1 cursor-pointer">{property.name}</label>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const NewReservationModal = ({
  isOpen,
  onClose,
  onSubmit,
  formData,
  onFormChange,
  properties
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  formData: NewReservationForm;
  onFormChange: (field: keyof NewReservationForm, value: string) => void;
  properties: Property[];
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4 max-h-90vh overflow-y-auto shadow-2xl">
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900">New Reservation</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-red-500 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Guest Name</label>
            <input
              type="text"
              value={formData.guestName}
              onChange={(e) => onFormChange('guestName', e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 transition-all"
              style={{ '--tw-ring-color': `${BRAND_COLORS.secondary}33` } as React.CSSProperties}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Guest Email</label>
            <input
              type="email"
              value={formData.guestEmail}
              onChange={(e) => onFormChange('guestEmail', e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 transition-all"
              style={{ '--tw-ring-color': `${BRAND_COLORS.secondary}33` } as React.CSSProperties}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Property</label>
            <select
              value={formData.property}
              onChange={(e) => onFormChange('property', e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 transition-all"
              style={{ '--tw-ring-color': `${BRAND_COLORS.secondary}33` } as React.CSSProperties}
            >
              <option value="">Select Property</option>
              {properties.map((property) => (
                <option key={property.id} value={property.name}>{property.name}</option>
              ))}
            </select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Check-in Date</label>
              <input
                type="date"
                value={formData.checkinDate}
                onChange={(e) => onFormChange('checkinDate', e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 transition-all"
                style={{ '--tw-ring-color': `${BRAND_COLORS.secondary}33` } as React.CSSProperties}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Check-out Date</label>
              <input
                type="date"
                value={formData.checkoutDate}
                onChange={(e) => onFormChange('checkoutDate', e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 transition-all"
                style={{ '--tw-ring-color': `${BRAND_COLORS.secondary}33` } as React.CSSProperties}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nightly Rate ($)</label>
              <input
                type="number"
                value={formData.nightlyRate}
                onChange={(e) => onFormChange('nightlyRate', e.target.value)}
                step="0.01"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 transition-all"
                style={{ '--tw-ring-color': `${BRAND_COLORS.secondary}33` } as React.CSSProperties}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Total Guests</label>
              <input
                type="number"
                value={formData.totalGuests}
                onChange={(e) => onFormChange('totalGuests', e.target.value)}
                min="1"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 transition-all"
                style={{ '--tw-ring-color': `${BRAND_COLORS.secondary}33` } as React.CSSProperties}
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Special Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => onFormChange('notes', e.target.value)}
              rows={3}
              placeholder="Optional special requests or notes..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 transition-all"
              style={{ '--tw-ring-color': `${BRAND_COLORS.secondary}33` } as React.CSSProperties}
            />
          </div>
          
          <div className="flex gap-4 pt-4">
            <button
              onClick={onSubmit}
              className="flex-1 px-4 py-2 text-white rounded-lg hover:opacity-90 transition-colors"
              style={{ backgroundColor: BRAND_COLORS.primary }}
            >
              Create Reservation
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Notification = ({ notification }: { notification: NotificationState }) => {
  if (!notification.show) return null;

  const bgColor = notification.type === 'success' 
    ? 'bg-green-500' 
    : notification.type === 'error' 
      ? 'bg-red-500' 
      : 'bg-blue-500';

  return (
    <div className={`fixed top-5 right-5 z-50 px-6 py-4 rounded-lg text-white font-medium shadow-lg transition-transform ${bgColor}`}>
      {notification.message}
    </div>
  );
};

const CalendarTooltip = ({ tooltip }: { tooltip: TooltipState }) => {
  if (!tooltip.show) return null;

  return (
    <div
      className="fixed z-50 bg-gray-900 text-white p-4 rounded-lg text-xs shadow-xl pointer-events-none transition-opacity border border-gray-700"
      style={{
        left: Math.max(10, Math.min(tooltip.x - 140, window.innerWidth - 290)),
        top: tooltip.y - 10,
        transform: 'translateY(-100%)',
        maxWidth: '280px',
        minWidth: '260px'
      }}
      dangerouslySetInnerHTML={{ __html: tooltip.content }}
    />
  );
};

const ReservationsTab: React.FC = () => {
  // State
  const [selectedProperties, setSelectedProperties] = useState<string[]>(['miami-beach', 'downtown-loft', 'suburb-house']);
  const [currentView, setCurrentView] = useState<ChartMode>('monthly');
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date(2025, 5, 28));
  const [propertyDropdownOpen, setPropertyDropdownOpen] = useState(false);
  const [monthDropdownOpen, setMonthDropdownOpen] = useState(false);
  const [yearDropdownOpen, setYearDropdownOpen] = useState(false);
  const monthDropdownRef = useRef<HTMLDivElement>(null);
  const yearDropdownRef = useRef<HTMLDivElement>(null);
  const monthsList = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
  ];
  const yearsList = Array.from({ length: 10 }, (_, i) => (new Date().getFullYear() - 5 + i).toString());
  const [selectedMonth, setSelectedMonth] = useState<string>(monthsList[new Date().getMonth()]);
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [newReservationModalOpen, setNewReservationModalOpen] = useState(false);
  const [notification, setNotification] = useState<NotificationState>({ show: false, message: '', type: 'info' });
  const [calendarTooltip, setCalendarTooltip] = useState<TooltipState>({ show: false, content: '', x: 0, y: 0 });
  const [occupancyChartMode, setOccupancyChartMode] = useState<ChartMode>('2025-only');
  const [revenueChartMode, setRevenueChartMode] = useState<ChartMode>('monthly');
  const [newReservationForm, setNewReservationForm] = useState<NewReservationForm>({
    guestName: '',
    guestEmail: '',
    property: '',
    checkinDate: '',
    checkoutDate: '',
    nightlyRate: '',
    totalGuests: '',
    notes: ''
  });
const [syncing, setSyncing] = useState(false);
  
  // Add these new state variables for backend integration
  const [isConnectedToBackend, setIsConnectedToBackend] = useState(false);
  const [backendData, setBackendData] = useState<{
    properties: Property[];
    reservations: Reservation[];
    kpis?: KPIs;
  } | null>(null);
  // Load data when component mounts
  useEffect(() => {
    loadFromSupabase();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (monthDropdownRef.current && !monthDropdownRef.current.contains(event.target as Node)) {
        setMonthDropdownOpen(false);
      }
      if (yearDropdownRef.current && !yearDropdownRef.current.contains(event.target as Node)) {
        setYearDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const monthIndex = monthsList.indexOf(selectedMonth);
    setCurrentCalendarDate(new Date(Number(selectedYear), monthIndex, 1));
  }, [selectedMonth, selectedYear]);

// Use backend data if available, otherwise use demo data
  const currentData = backendData ?? {
    properties: [
      {
        id: 'miami-beach',
        name: 'Miami Beach Condo',
        type: '2BR/2BA',
        description: 'Premium Location • Airbnb/VRBO',
        revenue: 8500,
        occupancy: 94,
        noi: 5200,
        color: BRAND_COLORS.chart.miami
      },
      {
        id: 'downtown-loft',
        name: 'Downtown Loft',
        type: '1BR/1BA',
        description: 'Business District • Corporate Housing',
        revenue: 6200,
        occupancy: 89,
        noi: 3800,
        color: BRAND_COLORS.chart.downtown
      },
      {
        id: 'suburb-house',
        name: 'Suburb House',
        type: '3BR/2BA',
        description: 'Family-Friendly • Vacation Rental',
        revenue: 4800,
        occupancy: 76,
        noi: -1100,
        color: BRAND_COLORS.chart.suburb
      }
    ],
    reservations: [
      {
        id: 1,
        guest: 'John Smith',
        email: 'john@email.com',
        phone: '+1 (555) 123-4567',
        property: 'Miami Beach Condo',
        checkin: '2025-07-01',
        checkout: '2025-07-05',
        nights: 4,
        revenue: 1200,
        status: 'confirmed' as ReservationStatus
      },
      {
        id: 2,
        guest: 'Sarah Johnson',
        email: 'sarah@email.com',
        phone: '+1 (555) 234-5678',
        property: 'Downtown Loft',
        checkin: '2025-07-03',
        checkout: '2025-07-08',
        nights: 5,
        revenue: 950,
        status: 'pending' as ReservationStatus
      },
      {
        id: 3,
        guest: 'Mike Wilson',
        email: 'mike@email.com',
        phone: '+1 (555) 345-6789',
        property: 'Suburb House',
        checkin: '2025-07-05',
        checkout: '2025-07-12',
        nights: 7,
        revenue: 840,
        status: 'confirmed' as ReservationStatus
      },
      {
        id: 4,
        guest: 'Emily Davis',
        email: 'emily@email.com',
        phone: '+1 (555) 456-7890',
        property: 'Miami Beach Condo',
        checkin: '2025-07-10',
        checkout: '2025-07-15',
        nights: 5,
        revenue: 1500,
        status: 'confirmed' as ReservationStatus
      },
      {
        id: 5,
        guest: 'Robert Brown',
        email: 'robert@email.com',
        phone: '+1 (555) 567-8901',
        property: 'Downtown Loft',
        checkin: '2025-07-12',
        checkout: '2025-07-16',
        nights: 4,
        revenue: 760,
        status: 'pending' as ReservationStatus
      }
    ]
  };

 // API connection function
async function connectToAPI() {
  setSyncing(true);
  try {
    const response = await fetch('https://iamcfo-guesty-backend.onrender.com/api/guesty/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    if (response.ok) {
      showNotification('Guesty sync started successfully!', 'success');
      // Wait a few seconds then reload data
      setTimeout(() => {
        loadFromSupabase();
      }, 3000);
    } else {
      showNotification('Backend sync failed - using demo data', 'error');
    }
  } catch (error) {
    console.error(error);
    showNotification('Backend not reachable - using demo data', 'error');
  } finally {
    setSyncing(false);
  }
}

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

  const showNotification = (message: string, type: 'info' | 'success' | 'error' = 'info'): void => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: 'info' });
    }, 3000);
  };

  const getPropertyColor = (propertyName: string): string => {
    const property = currentData.properties.find(p => p.name === propertyName);
    return property ? property.color : BRAND_COLORS.primary;
  };

  const getPropertyId = (propertyName: string): string => {
    const property = currentData.properties.find(p => p.name === propertyName);
    return property ? property.id : slugify(propertyName);
  };

  const handlePropertyCheckboxChange = (propertyId: string): void => {
    if (propertyId === 'selectAll') {
      const allProperties = currentData.properties.map(p => p.id);
      setSelectedProperties(allProperties);
      return;
    }
    if (propertyId === 'clearAll') {
      setSelectedProperties([]);
      return;
    }
    setSelectedProperties(prev => {
      if (prev.includes(propertyId)) {
        return prev.filter(id => id !== propertyId);
      }
      return [...prev, propertyId];
    });
  };

  const getFilteredReservations = (): Reservation[] => {
    const selectedPropertyNames = selectedProperties
      .map(id => currentData.properties.find(p => p.id === id)?.name)
      .filter(Boolean) as string[];

    const monthIndex = monthsList.indexOf(selectedMonth);
    const year = Number(selectedYear);
    const monthStart = new Date(year, monthIndex, 1);
    const monthEnd = new Date(year, monthIndex + 1, 1);

    return currentData.reservations.filter(r => {
      const propertyMatch = selectedPropertyNames.includes(r.property);
      const checkinDate = new Date(r.checkin);
      const checkoutDate = new Date(r.checkout);
      const overlaps = checkinDate < monthEnd && checkoutDate > monthStart;
      return propertyMatch && overlaps;
    });
  };
  // Backend data loading function
  const loadFromSupabase = async (): Promise<void> => {
    try {
      const { data, error } = await supabase
        .from('reservations')
        .select('id, check_in, check_out, confirmation_code, listing, guest, reservation_id, net_income, source, qbo_listing, created_at')
        .not('qbo_listing', 'is', null);

      if (error) throw error;
      const rows: DBReservationRow[] = (data as DBReservationRow[]) || [];

      const propertiesMap = new Map<string, Property>();
      const reservations: Reservation[] = [];

      const hashId = (value: string): number => {
        let hash = 0;
        for (let i = 0; i < value.length; i++) {
          hash = Math.imul(31, hash) + value.charCodeAt(i);
        }
        return Math.abs(hash);
      };

      rows.forEach((row) => {
        const propertyName = row.qbo_listing ?? 'Unknown Property';
        let property = propertiesMap.get(propertyName);
        if (!property) {
          const color = PROPERTY_PALETTE[propertiesMap.size % PROPERTY_PALETTE.length];
          property = {
            id: slugify(propertyName),
            name: propertyName,
            type: 'Listing',
            description: 'Guesty / QBO Location',
            revenue: 0,
            occupancy: 80,
            noi: 0,
            color,
          };
          propertiesMap.set(propertyName, property);
        }
        const revenue = row.net_income ? Number(row.net_income) : 0;
        property.revenue += revenue;
        property.noi = Math.round(property.revenue * 0.6);

        const reservationId = row.reservation_id || row.id;
        reservations.push({
          id: hashId(reservationId),
          guest: row.guest && row.guest.trim() !== '' ? row.guest : 'Unknown Guest',
          email: '',
          phone: '',
          property: propertyName,
          checkin: row.check_in ?? '',
          checkout: row.check_out ?? '',
          nights: toNights(row.check_in, row.check_out),
          revenue,
          status: 'confirmed',
        });
      });

      const properties = Array.from(propertiesMap.values());
      const now = new Date();
      const kpis = calculateKPIsFromReservations(
        reservations,
        properties.length,
        now.getMonth(),
        now.getFullYear()
      );
      setBackendData({ properties, reservations, kpis });
      setSelectedProperties(properties.map((p) => p.id));
      setIsConnectedToBackend(true);
      showNotification('Connected to live Guesty data!', 'success');
    } catch (err) {
      console.error('Failed to load reservations', err);
      setIsConnectedToBackend(false);
      showNotification('Using demo data - backend not reachable', 'error');
    }
  };
  
  const calculateDemoKPIs = (): KPIs => {
    const filteredReservations = getFilteredReservations();
    return calculateKPIsFromReservations(
      filteredReservations,
      selectedProperties.length,
      monthsList.indexOf(selectedMonth),
      Number(selectedYear)
    );
  };

  const generateCalendar = (): { monthName: string; days: CalendarDay[] } => {
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];

    const days: CalendarDay[] = [];
    const currentDate = new Date(startDate);

    for (let i = 0; i < 42; i++) {
      const dayOfMonth = currentDate.getDate();
      const isCurrentMonth = currentDate.getMonth() === month;
      const isToday = currentDate.toDateString() === new Date().toDateString();
      const dateStr = currentDate.toISOString().split('T')[0];

      const dayBookings = getBookingsForDate(dateStr);
      let dotClass = '';

      if (dayBookings.length > 0 && isCurrentMonth) {
        if (dayBookings.length === 1) {
          const propertyName = dayBookings[0].property;
          const propertyId = getPropertyId(propertyName);
          dotClass = propertyId === 'miami-beach' ? 'miami' :
                    propertyId === 'downtown-loft' ? 'downtown' :
                    propertyId === 'suburb-house' ? 'suburb' : 'miami';
        } else {
          dotClass = 'multiple';
        }
      }

      days.push({
        day: dayOfMonth,
        isCurrentMonth,
        isToday,
        dateStr,
        bookings: dayBookings,
        dotClass
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return {
      monthName: `${monthNames[month]} ${year}`,
      days
    };
  };

  const getBookingsForDate = (dateStr: string): Reservation[] => {
    const targetDate = new Date(dateStr);
    const selectedPropertyNames = selectedProperties.map(id => 
      currentData.properties.find(p => p.id === id)?.name
    ).filter(Boolean) as string[];

    return currentData.reservations.filter(reservation => {
      const checkinDate = new Date(reservation.checkin);
      const checkoutDate = new Date(reservation.checkout);
      
      return targetDate >= checkinDate && 
             targetDate < checkoutDate && 
             selectedPropertyNames.includes(reservation.property);
    });
  };

  const handleCalendarMouseEnter = (event: React.MouseEvent<HTMLDivElement>, dateStr: string): void => {
    const bookings = getBookingsForDate(dateStr);
    if (bookings.length === 0) return;

    const date = new Date(dateStr);
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
    const monthDay = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    let tooltipContent = `<div style="font-weight: bold; margin-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.2); padding-bottom: 4px;">
      ${dayName} ${monthDay} • ${bookings.length} Guest${bookings.length > 1 ? 's' : ''}
    </div>`;

    bookings.forEach((booking, index) => {
      const checkinDate = new Date(booking.checkin);
      const checkoutDate = new Date(booking.checkout);
      const currentDay = Math.floor((date.getTime() - checkinDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      const totalNights = Math.floor((checkoutDate.getTime() - checkinDate.getTime()) / (1000 * 60 * 60 * 24));
      
      let stayStatus = '';
      if (date.toDateString() === checkinDate.toDateString()) {
        stayStatus = 'Check-in Today';
      } else if (date.toDateString() === new Date(checkoutDate.getTime() - 24 * 60 * 60 * 1000).toDateString()) {
        stayStatus = 'Check-out Tomorrow';
      } else {
        stayStatus = `Day ${currentDay} of ${totalNights}`;
      }
      
      const propertyColor = getPropertyColor(booking.property);
      
      tooltipContent += `
        <div style="margin-bottom: ${index < bookings.length - 1 ? '12px' : '0'}; padding-bottom: ${index < bookings.length - 1 ? '12px' : '0'}; ${index < bookings.length - 1 ? 'border-bottom: 1px solid rgba(255,255,255,0.1);' : ''}">
          <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
            <div style="width: 8px; height: 8px; background: ${propertyColor}; border-radius: 50%; flex-shrink: 0;"></div>
            <strong style="font-size: 13px;">${booking.guest}</strong>
          </div>
          <div style="font-size: 11px; opacity: 0.9; margin-bottom: 3px; display: flex; align-items: center; gap: 4px;">
            <span>🏠</span>
            <span>${booking.property}</span>
          </div>
          <div style="font-size: 11px; opacity: 0.8; margin-bottom: 3px; display: flex; align-items: center; gap: 4px;">
            <span>📧</span>
            <span>${booking.email}</span>
          </div>
          ${booking.phone ? `<div style="font-size: 11px; opacity: 0.8; margin-bottom: 3px; display: flex; align-items: center; gap: 4px;">
            <span>📞</span>
            <span>${booking.phone}</span>
          </div>` : ''}
          <div style="font-size: 11px; opacity: 0.9; margin-bottom: 3px; display: flex; align-items: center; gap: 4px;">
            <span>🏨</span>
            <span>${totalNights} night${totalNights !== 1 ? 's' : ''} (${stayStatus})</span>
          </div>
          <div style="font-size: 11px; opacity: 0.9; margin-bottom: 3px; display: flex; align-items: center; gap: 4px;">
            <span>💰</span>
            <span>${formatCurrency(booking.revenue)} total</span>
          </div>
          <div style="font-size: 10px; opacity: 0.7; margin-top: 4px; display: flex; align-items: center; gap: 4px;">
            <span>📅</span>
            <span>${formatDate(booking.checkin)} → ${formatDate(booking.checkout)}</span>
          </div>
          <div style="font-size: 10px; opacity: 0.8; margin-top: 3px;">
            <span class="inline-flex px-2 py-1 rounded-full text-xs" style="background: ${
              booking.status === 'confirmed' ? 'rgba(34, 197, 94, 0.2); color: #16a34a' :
              booking.status === 'pending' ? 'rgba(251, 191, 36, 0.2); color: #d97706' :
              'rgba(239, 68, 68, 0.2); color: #dc2626'
            };">
              ${booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
            </span>
          </div>
        </div>
      `;
    });

    const rect = (event.target as HTMLElement).getBoundingClientRect();
    setCalendarTooltip({
      show: true,
      content: tooltipContent,
      x: rect.left + rect.width / 2,
      y: rect.top - 10
    });
  };

  const handleCalendarMouseLeave = (): void => {
    setCalendarTooltip({ show: false, content: '', x: 0, y: 0 });
  };

  const handleNewReservation = (): void => {
    if (!newReservationForm.guestName || !newReservationForm.guestEmail || 
        !newReservationForm.property || !newReservationForm.checkinDate || 
        !newReservationForm.checkoutDate || !newReservationForm.nightlyRate) {
      showNotification('Please fill in all required fields', 'error');
      return;
    }

    const checkinDate = new Date(newReservationForm.checkinDate);
    const checkoutDate = new Date(newReservationForm.checkoutDate);
    const nights = Math.ceil((checkoutDate.getTime() - checkinDate.getTime()) / (1000 * 60 * 60 * 24));
    const nightlyRate = parseFloat(newReservationForm.nightlyRate);
    const totalRevenue = nights * nightlyRate;

    const newReservation: Reservation = {
      id: Date.now(),
      guest: newReservationForm.guestName,
      email: newReservationForm.guestEmail,
      phone: '+1 (555) 000-0000',
      property: newReservationForm.property,
      checkin: newReservationForm.checkinDate,
      checkout: newReservationForm.checkoutDate,
      nights: nights,
      revenue: totalRevenue,
      status: 'pending'
    };

    // Try to create via API, fallback to local update
    fetch('https://iamcfo-guesty-backend.onrender.com/api/reservations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newReservationForm)
    }).then(response => {
      if (response.ok) {
        showNotification('Reservation created in backend!', 'success');
      } else {
        // Fallback to local update
        currentData.reservations.push(newReservation);
        showNotification('Reservation created locally (backend not connected)', 'info');
      }
    }).catch(() => {
      // Fallback to local update
      currentData.reservations.push(newReservation);
      showNotification('Reservation created locally (backend not connected)', 'info');
    });

    setNewReservationModalOpen(false);
    setNewReservationForm({
      guestName: '',
      guestEmail: '',
      property: '',
      checkinDate: '',
      checkoutDate: '',
      nightlyRate: '',
      totalGuests: '',
      notes: ''
    });
  };

  const generateOccupancyChartData = () => {
    if (currentView === 'seasonal') {
      const seasons = ['Winter', 'Spring', 'Summer', 'Fall'];
      return seasons.map((season) => {
        const data: Record<string, any> = { month: season };
        selectedProperties.forEach(propertyId => {
          const property = currentData.properties.find(p => p.id === propertyId);
          if (property) {
            const seasonalMultipliers = { Winter: 0.8, Spring: 1.0, Summer: 1.3, Fall: 1.1 };
            const baseOccupancy = property.occupancy;
            const seasonalOccupancy = baseOccupancy * (seasonalMultipliers[season as keyof typeof seasonalMultipliers] || 1);
            
            if (occupancyChartMode === '2025-only') {
              data[property.name] = Math.max(20, Math.min(100, seasonalOccupancy));
            } else {
              data[`${property.name} (2024)`] = Math.max(20, Math.min(100, seasonalOccupancy - 8));
              data[`${property.name} (2025)`] = Math.max(20, Math.min(100, seasonalOccupancy));
            }
          }
        });
        return data;
      });
    } else {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return months.map((month, index) => {
        const data: Record<string, any> = { month };
        selectedProperties.forEach(propertyId => {
          const property = currentData.properties.find(p => p.id === propertyId);
          if (property) {
            const baseOccupancy = property.occupancy;
            const variation = Math.sin(index * 0.5) * 10;
            
            if (occupancyChartMode === '2025-only') {
              data[property.name] = Math.max(20, Math.min(100, baseOccupancy + variation));
            } else {
              data[`${property.name} (2024)`] = Math.max(20, Math.min(100, baseOccupancy + variation - 8));
              data[`${property.name} (2025)`] = Math.max(20, Math.min(100, baseOccupancy + variation));
            }
          }
        });
        return data;
      });
    }
  };

  const generateRevenueChartData = () => {
    if (currentView === 'seasonal') {
      const seasons = ['Winter', 'Spring', 'Summer', 'Fall'];
      return seasons.map((season) => {
        const data: Record<string, any> = { month: season };
        selectedProperties.forEach(propertyId => {
          const property = currentData.properties.find(p => p.id === propertyId);
          if (property) {
            const seasonalMultipliers = { Winter: 0.7, Spring: 1.0, Summer: 1.6, Fall: 1.2 };
            const baseRevenue = property.revenue * 90;
            const seasonalRevenue = baseRevenue * (seasonalMultipliers[season as keyof typeof seasonalMultipliers] || 1);
            data[property.name] = Math.round(seasonalRevenue);
          }
        });
        return data;
      });
    } else {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return months.map((month, index) => {
        const data: Record<string, any> = { month };
        selectedProperties.forEach(propertyId => {
          const property = currentData.properties.find(p => p.id === propertyId);
          if (property) {
            const baseRevenue = property.revenue * 14;
            const seasonalMultiplier = 1 + Math.sin((index + 5) * 0.5) * 0.4;
            data[property.name] = Math.round(baseRevenue * seasonalMultiplier);
          }
        });
        return data;
      });
    }
  };

  const kpis = backendData
    ? calculateKPIsFromReservations(
        getFilteredReservations(),
        selectedProperties.length,
        monthsList.indexOf(selectedMonth),
        Number(selectedYear)
      )
    : calculateDemoKPIs();
  const calendar = generateCalendar();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-center items-center gap-3">
            <h1 className="text-3xl font-bold text-center" style={{ color: BRAND_COLORS.primary }}>
              Reservation Management
            </h1>
            {isConnectedToBackend && (
              <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">
                Guesty Connected
              </span>
            )}
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Controls */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="relative" ref={monthDropdownRef}>
                <button
                  onClick={() => setMonthDropdownOpen(!monthDropdownOpen)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2"
                  style={{ '--tw-ring-color': `${BRAND_COLORS.secondary}33` } as React.CSSProperties}
                >
                  {selectedMonth}
                  <ChevronDown className="w-4 h-4 ml-2" />
                </button>
                {monthDropdownOpen && (
                  <div className="absolute z-10 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {monthsList.map((month) => (
                      <button
                        key={month}
                        onClick={() => {
                          setSelectedMonth(month);
                          setMonthDropdownOpen(false);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
                      >
                        {month}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="relative" ref={yearDropdownRef}>
                <button
                  onClick={() => setYearDropdownOpen(!yearDropdownOpen)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2"
                  style={{ '--tw-ring-color': `${BRAND_COLORS.secondary}33` } as React.CSSProperties}
                >
                  {selectedYear}
                  <ChevronDown className="w-4 h-4 ml-2" />
                </button>
                {yearDropdownOpen && (
                  <div className="absolute z-10 mt-1 w-32 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {yearsList.map((year) => (
                      <button
                        key={year}
                        onClick={() => {
                          setSelectedYear(year);
                          setYearDropdownOpen(false);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
                      >
                        {year}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <PropertyDropdown
                properties={currentData.properties}
                selectedProperties={selectedProperties}
                onPropertyChange={handlePropertyCheckboxChange}
                isOpen={propertyDropdownOpen}
                onToggle={() => setPropertyDropdownOpen(!propertyDropdownOpen)}
              />

              <select
                value={currentView}
                onChange={(e) => setCurrentView(e.target.value as ChartMode)}
                className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm hover:border-blue-500 focus:outline-none focus:ring-2 transition-all"
                style={{ '--tw-ring-color': `${BRAND_COLORS.secondary}33` } as React.CSSProperties}
              >
                <option value="monthly">Monthly View</option>
                <option value="seasonal">Seasonal View</option>
              </select>

              <button
                onClick={() => showNotification('Reservations exported', 'success')}
                className="flex items-center gap-2 px-4 py-2 text-white rounded-lg hover:opacity-90 transition-colors shadow-sm"
                style={{ backgroundColor: BRAND_COLORS.primary }}
              >
                <Download className="w-4 h-4" />
                Export
              </button>

              <button
                onClick={connectToAPI}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors shadow-sm disabled:opacity-50"
                disabled={syncing}
              >
                <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Syncing...' : 'Refresh'}
              </button>

              <button
                onClick={() => setNewReservationModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 text-white rounded-lg hover:opacity-90 transition-colors shadow-sm"
                style={{ backgroundColor: BRAND_COLORS.primary }}
              >
                <Plus className="w-4 h-4" />
                New Booking
              </button>
            </div>
          </div>

          {/* KPIs for Reservations */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 hover:shadow-md transition-shadow" style={{ borderLeftColor: BRAND_COLORS.primary }}>
              <div className="text-gray-600 text-sm font-medium mb-2">Total Revenue</div>
              <div className="text-3xl font-bold text-gray-900 mb-1">{formatCurrency(kpis.totalRevenue)}</div>
              <div className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full inline-block">
                +8.3% vs last month
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 hover:shadow-md transition-shadow" style={{ borderLeftColor: BRAND_COLORS.secondary }}>
              <div className="text-gray-600 text-sm font-medium mb-2">Occupancy Rate</div>
              <div className="text-3xl font-bold text-gray-900 mb-1">{kpis.occupancyRate}%</div>
              <div className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full inline-block">
                +4.2% vs last month
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 hover:shadow-md transition-shadow" style={{ borderLeftColor: BRAND_COLORS.tertiary }}>
              <div className="text-gray-600 text-sm font-medium mb-2">Avg Nightly Rate</div>
              <div className="text-3xl font-bold text-gray-900 mb-1">{formatCurrency(kpis.avgNightlyRate)}</div>
              <div className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full inline-block">
                +2.1% vs last month
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 hover:shadow-md transition-shadow" style={{ borderLeftColor: BRAND_COLORS.warning }}>
              <div className="text-gray-600 text-sm font-medium mb-2">Avg Stay Length</div>
              <div className="text-3xl font-bold text-gray-900 mb-1">{kpis.avgStayLength.toFixed(1)} nights</div>
              <div className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full inline-block">
                +0.2 vs last month
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Charts and Reservations Table */}
            <div className="lg:col-span-2 space-y-8">
              {/* Revenue Chart */}
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-semibold text-gray-900">Revenue by Property</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setRevenueChartMode('monthly')}
                        className={`px-3 py-1 text-xs rounded transition-colors ${
                          revenueChartMode === 'monthly' 
                            ? 'text-white' 
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                        style={{ backgroundColor: revenueChartMode === 'monthly' ? BRAND_COLORS.primary : undefined }}
                      >
                        Monthly
                      </button>
                      <button
                        onClick={() => setRevenueChartMode('ytd')}
                        className={`px-3 py-1 text-xs rounded transition-colors ${
                          revenueChartMode === 'ytd' 
                            ? 'text-white' 
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                        style={{ backgroundColor: revenueChartMode === 'ytd' ? BRAND_COLORS.primary : undefined }}
                      >
                        YTD
                      </button>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={generateRevenueChartData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={(value: number, name: string) => [`$${Number(value).toLocaleString()}`, name]} />
                      <Legend />
                      {selectedProperties.map(propertyId => {
                        const property = currentData.properties.find(p => p.id === propertyId);
                        return property ? (
                          <Bar 
                            key={property.id} 
                            dataKey={property.name} 
                            fill={property.color}
                            radius={[4, 4, 0, 0]}
                          />
                        ) : null;
                      })}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Reservations Table */}
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-xl font-semibold text-gray-900">Upcoming Reservations</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Guest</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check-in</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nights</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {getFilteredReservations().map((reservation) => (
                        <tr key={reservation.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {reservation.guest}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {reservation.property}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(reservation.checkin)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {reservation.nights}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(reservation.revenue)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                              reservation.status === 'confirmed' 
                                ? 'bg-green-100 text-green-800'
                                : reservation.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {reservation.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => showNotification(`Viewing reservation for ${reservation.guest}`, 'info')}
                              className="hover:text-gray-900 mr-3"
                              style={{ color: BRAND_COLORS.primary }}
                            >
                              View
                            </button>
                            <button
                              onClick={() => showNotification(`Editing reservation for ${reservation.guest}`, 'info')}
                              className="text-gray-600 hover:text-gray-900"
                            >
                              Edit
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Occupancy Trend Chart */}
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-semibold text-gray-900">
                      {currentView === 'seasonal' ? 'Seasonal' : '12-Month'} Occupancy Trend
                    </h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setOccupancyChartMode('2025-only')}
                        className={`px-3 py-1 text-xs rounded transition-colors ${
                          occupancyChartMode === '2025-only' 
                            ? 'text-white' 
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                        style={{ backgroundColor: occupancyChartMode === '2025-only' ? BRAND_COLORS.primary : undefined }}
                      >
                        2025 Only
                      </button>
                      <button
                        onClick={() => setOccupancyChartMode('comparison')}
                        className={`px-3 py-1 text-xs rounded transition-colors ${
                          occupancyChartMode === 'comparison' 
                            ? 'text-white' 
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                        style={{ backgroundColor: occupancyChartMode === 'comparison' ? BRAND_COLORS.primary : undefined }}
                      >
                        Compare 2024 vs 2025
                      </button>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <ResponsiveContainer width="100%" height={350}>
                    <LineChart data={generateOccupancyChartData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
                      <Tooltip formatter={(value: any) => [`${Number(value).toFixed(1)}%`, 'Occupancy']} />
                      <Legend />
                      {occupancyChartMode === '2025-only' ? (
                        selectedProperties.map(propertyId => {
                          const property = currentData.properties.find(p => p.id === propertyId);
                          return property ? (
                            <Line 
                              key={property.id}
                              type="monotone" 
                              dataKey={property.name} 
                              stroke={property.color}
                              strokeWidth={3}
                              dot={{ r: 6, fill: property.color }}
                              activeDot={{ r: 8, fill: property.color }}
                            />
                          ) : null;
                        })
                      ) : (
                        selectedProperties.flatMap(propertyId => {
                          const property = currentData.properties.find(p => p.id === propertyId);
                          return property ? [
                            <Line 
                              key={`${property.id}-2024`}
                              type="monotone" 
                              dataKey={`${property.name} (2024)`} 
                              stroke={BRAND_COLORS.chart.comparison2024}
                              strokeWidth={2}
                              strokeDasharray="5 5"
                              dot={{ r: 4, fill: BRAND_COLORS.chart.comparison2024 }}
                            />,
                            <Line 
                              key={`${property.id}-2025`}
                              type="monotone" 
                              dataKey={`${property.name} (2025)`} 
                              stroke={BRAND_COLORS.chart.comparison2025}
                              strokeWidth={3}
                              dot={{ r: 6, fill: BRAND_COLORS.chart.comparison2025 }}
                              activeDot={{ r: 8, fill: BRAND_COLORS.chart.comparison2025 }}
                            />
                          ] : [];
                        })
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Right Column: Calendar and Revenue Reconciliation */}
            <div className="space-y-8">
              {/* Calendar */}
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-semibold text-gray-900">Occupancy Calendar</h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          const newDate = new Date(currentCalendarDate);
                          newDate.setMonth(newDate.getMonth() - 1);
                          setCurrentCalendarDate(newDate);
                        }}
                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                      >
                        ‹
                      </button>
                      <span className="font-medium text-sm px-3 py-1 rounded text-white" style={{ backgroundColor: BRAND_COLORS.primary }}>
                        {calendar.monthName}
                      </span>
                      <button
                        onClick={() => {
                          const newDate = new Date(currentCalendarDate);
                          newDate.setMonth(newDate.getMonth() + 1);
                          setCurrentCalendarDate(newDate);
                        }}
                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                      >
                        ›
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="p-4">
                  {/* Calendar Header */}
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                      <div key={day} className="text-center text-xs font-semibold text-gray-600 py-2">
                        {day}
                      </div>
                    ))}
                  </div>
                  
                  {/* Calendar Days */}
                  <div className="grid grid-cols-7 gap-1">
                    {calendar.days.map((day, index) => (
                      <div
                        key={index}
                        className={`relative text-center p-2 text-xs font-medium cursor-pointer rounded transition-all ${
                          !day.isCurrentMonth
                            ? 'text-gray-300 cursor-default'
                            : day.isToday
                            ? 'border text-white font-semibold'
                            : 'hover:bg-gray-100 hover:scale-105'
                        }`}
                        style={day.isToday ? { backgroundColor: BRAND_COLORS.primary, borderColor: BRAND_COLORS.secondary } : {}}
                        onMouseEnter={(e) => day.isCurrentMonth && handleCalendarMouseEnter(e, day.dateStr)}
                        onMouseLeave={handleCalendarMouseLeave}
                        onClick={() => day.isCurrentMonth && showNotification(`${formatDate(day.dateStr)}: ${day.bookings.length} reservation${day.bookings.length !== 1 ? 's' : ''}`, 'info')}
                      >
                        {day.day}
                        {day.bookings.length > 0 && day.isCurrentMonth && (
                          <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 flex gap-0.5">
                            <div className={`w-1.5 h-1.5 rounded-full border border-white ${
                              day.dotClass === 'miami' ? 'bg-purple-500' :
                              day.dotClass === 'downtown' ? 'bg-emerald-500' :
                              day.dotClass === 'suburb' ? 'bg-amber-500' :
                              'bg-red-500'
                            }`} />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  {/* Calendar Legend */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex flex-wrap gap-4 text-xs mb-2">
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded" style={{ backgroundColor: BRAND_COLORS.chart.miami }}></div>
                        <span className="text-gray-600">Miami Beach</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded" style={{ backgroundColor: BRAND_COLORS.chart.downtown }}></div>
                        <span className="text-gray-600">Downtown</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded" style={{ backgroundColor: BRAND_COLORS.chart.suburb }}></div>
                        <span className="text-gray-600">Suburb</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-red-500 rounded"></div>
                        <span className="text-gray-600">Multiple</span>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      Click dates to see reservation details • Hover for guest info
                    </div>
                  </div>
                </div>
              </div>

              {/* Revenue Reconciliation */}
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-xl font-semibold text-gray-900">Revenue Reconciliation</h3>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-3">
                      <div className="text-sm text-gray-700 font-medium">Gross Income</div>
                      <div className="text-lg font-bold text-gray-900">{formatCurrency(kpis.totalRevenue)}</div>
                    </div>
                    
                    <div className="flex justify-between items-center py-3 bg-green-50 px-4 rounded-lg">
                      <div className="text-sm text-gray-700 font-medium">Reserve Releases</div>
                      <div className="text-lg font-bold text-green-600">+{formatCurrency(kpis.totalRevenue * 0.08)}</div>
                    </div>
                    
                    <div className="flex justify-between items-center py-3 bg-red-50 px-4 rounded-lg">
                      <div className="text-sm text-gray-700 font-medium">Reserves Withheld</div>
                      <div className="text-lg font-bold text-red-600">-{formatCurrency(kpis.totalRevenue * 0.12)}</div>
                    </div>
                    
                    <div className="flex justify-between items-center py-3 bg-red-50 px-4 rounded-lg">
                      <div className="text-sm text-gray-700 font-medium">Platform Fees</div>
                      <div className="text-lg font-bold text-red-600">-{formatCurrency(kpis.totalRevenue * 0.15)}</div>
                    </div>
                    
                    <div className="flex justify-between items-center py-3 bg-red-50 px-4 rounded-lg">
                      <div className="text-sm text-gray-700 font-medium">Refunds</div>
                      <div className="text-lg font-bold text-red-600">-{formatCurrency(kpis.totalRevenue * 0.02)}</div>
                    </div>
                    
                    <div className="flex justify-between items-center py-3 mt-6 pt-6 border-t-2 border-gray-200 bg-blue-50 px-4 rounded-lg">
                      <div className="text-sm text-gray-700 font-medium">Net Payment</div>
                      <div className="text-lg font-bold text-blue-600">{formatCurrency(kpis.totalRevenue * 0.79)}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modals and Notifications */}
      <NewReservationModal
        isOpen={newReservationModalOpen}
        onClose={() => setNewReservationModalOpen(false)}
        onSubmit={handleNewReservation}
        formData={newReservationForm}
        onFormChange={(field, value) => setNewReservationForm(prev => ({...prev, [field]: value}))}
        properties={currentData.properties}
      />

      <Notification notification={notification} />
      <CalendarTooltip tooltip={calendarTooltip} />

      {/* Click outside to close dropdown */}
      {propertyDropdownOpen && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setPropertyDropdownOpen(false)}
        />
      )}
    </div>
  );
};

export default ReservationsTab;

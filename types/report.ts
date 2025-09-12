export type PnL = {
  revenue: number;
  expenses: number;
  netIncome: number;
};

export type BookingAgg = {
  nights: number;
  occupancyPct: number;
  bookings: number;
  adr?: number;
  revpar?: number;
  bookingRevenue?: number;
};

export type PropertyReport = {
  id: string;
  name: string;
  classRefName: string;
  pnl: PnL;
  bookings: BookingAgg;
};

export type PortfolioReport = {
  company: { id: string; name: string };
  month: string;
  portfolio: PnL & BookingAgg;
  properties: PropertyReport[];
};

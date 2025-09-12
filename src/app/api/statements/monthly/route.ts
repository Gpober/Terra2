import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { jsPDF } from 'jspdf'
import { PortfolioReport, PropertyReport, PnL, BookingAgg } from '../../../../../types/report'
import { getMonthBounds, clipReservationToMonth, computeOccupancy } from '@/server/report-helpers'

export async function POST(req: Request) {
  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { month, companyId, propertyIds } = body || {}
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json({ error: 'Invalid month' }, { status: 400 })
  }

  const { start, end, daysInMonth } = getMonthBounds(month)

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  let propQuery = supabase
    .from('properties')
    .select('id,name,class_ref_name,units')
    .eq('is_active', true)
  if (companyId) propQuery = propQuery.eq('company_id', companyId)
  if (propertyIds && propertyIds.length) propQuery = propQuery.in('id', propertyIds)
  const { data: props, error: propErr } = await propQuery
  if (propErr) return NextResponse.json({ error: propErr.message }, { status: 500 })
  const properties = props || []

  const classNames = properties.map(p => p.class_ref_name)

  let jlQuery = supabase
    .from('journal_entry_lines')
    .select('class_ref_name, account_type, amount')
    .gte('transaction_date', start.toISOString())
    .lte('transaction_date', end.toISOString())
  if (companyId) jlQuery = jlQuery.eq('company_id', companyId)
  if (classNames.length) jlQuery = jlQuery.in('class_ref_name', classNames)
  const { data: lines, error: jlErr } = await jlQuery
  if (jlErr) return NextResponse.json({ error: jlErr.message }, { status: 500 })

  const pnlMap: Record<string, PnL> = {}
  ;(lines || []).forEach(line => {
    const cls = line.class_ref_name || 'unmapped'
    if (!pnlMap[cls]) pnlMap[cls] = { revenue: 0, expenses: 0, netIncome: 0 }
    const amt = Number(line.amount) || 0
    const type = (line.account_type || '').toLowerCase()
    if (type.startsWith('income')) pnlMap[cls].revenue += amt
    else if (type.startsWith('expense') || type.startsWith('cost of goods sold'))
      pnlMap[cls].expenses += amt
  })
  Object.values(pnlMap).forEach(p => (p.netIncome = p.revenue - p.expenses))

  let resQuery = supabase
    .from('reservations')
    .select('id, property_id, property_name, start_date, end_date, nights, adr, revenue, status')
    .in('status', ['confirmed', 'completed'])
    .lte('start_date', end.toISOString())
    .gte('end_date', start.toISOString())
  if (propertyIds && propertyIds.length) resQuery = resQuery.in('property_id', propertyIds)
  const { data: resData, error: resErr } = await resQuery
  if (resErr) return NextResponse.json({ error: resErr.message }, { status: 500 })

  const bookingMap: Record<string, BookingAgg> = {}
  ;(resData || []).forEach(r => {
    const propId = r.property_id || ''
    const clipped = clipReservationToMonth(
      {
        start_date: r.start_date,
        end_date: r.end_date,
        nights: r.nights,
        adr: r.adr,
        revenue: r.revenue,
      },
      { start, end }
    )
    if (!bookingMap[propId]) {
      bookingMap[propId] = { nights: 0, occupancyPct: 0, bookings: 0, bookingRevenue: 0 }
    }
    bookingMap[propId].nights += clipped.nights_in_month
    bookingMap[propId].bookings += 1
    bookingMap[propId].bookingRevenue =
      (bookingMap[propId].bookingRevenue || 0) + clipped.revenue_in_month
  })

  properties.forEach(p => {
    const agg = bookingMap[p.id]
    if (agg) {
      agg.adr = agg.nights > 0 ? (agg.bookingRevenue || 0) / agg.nights : undefined
      agg.occupancyPct = computeOccupancy(agg.nights, daysInMonth, p.units || 1)
      agg.revpar = agg.adr ? agg.adr * (agg.occupancyPct / 100) : undefined
    } else {
      bookingMap[p.id] = { nights: 0, occupancyPct: 0, bookings: 0 }
    }
  })

  const propertyReports: PropertyReport[] = properties.map(p => ({
    id: p.id,
    name: p.name,
    classRefName: p.class_ref_name,
    pnl: pnlMap[p.class_ref_name] || { revenue: 0, expenses: 0, netIncome: 0 },
    bookings: bookingMap[p.id] || { nights: 0, occupancyPct: 0, bookings: 0 },
  }))

  const portfolioSummary = propertyReports.reduce(
    (acc, p) => {
      acc.revenue += p.pnl.revenue
      acc.expenses += p.pnl.expenses
      acc.netIncome += p.pnl.netIncome
      acc.nights += p.bookings.nights
      acc.bookings += p.bookings.bookings
      acc.bookingRevenue += p.bookings.bookingRevenue || 0
      return acc
    },
    {
      revenue: 0,
      expenses: 0,
      netIncome: 0,
      nights: 0,
      occupancyPct: 0,
      bookings: 0,
      bookingRevenue: 0,
    } as BookingAgg & PnL & { bookingRevenue: number }
  )
  portfolioSummary.adr =
    portfolioSummary.nights > 0
      ? (portfolioSummary.bookingRevenue || 0) / portfolioSummary.nights
      : undefined
  portfolioSummary.occupancyPct = computeOccupancy(
    portfolioSummary.nights,
    daysInMonth,
    properties.length || 1
  )
  portfolioSummary.revpar =
    portfolioSummary.adr
      ? portfolioSummary.adr * (portfolioSummary.occupancyPct / 100)
      : undefined

  const report: PortfolioReport = {
    company: { id: companyId || 'all', name: companyId || 'All Companies' },
    month,
    portfolio: portfolioSummary,
    properties: propertyReports,
  }

  const doc = new jsPDF()
  doc.setFontSize(20)
  doc.text(report.company.name, 20, 30)
  doc.setFontSize(14)
  doc.text(`Month: ${month}`, 20, 40)
  doc.text(`Revenue: ${report.portfolio.revenue.toFixed(2)}`, 20, 50)
  doc.text(`Expenses: ${report.portfolio.expenses.toFixed(2)}`, 20, 60)
  doc.text(`Net Income: ${report.portfolio.netIncome.toFixed(2)}`, 20, 70)

  doc.addPage()
  doc.setFontSize(16)
  doc.text('Executive Summary', 20, 20)
  report.properties.forEach((p, idx) => {
    const y = 40 + idx * 20
    doc.text(
      `${p.name} - Rev: ${p.pnl.revenue.toFixed(2)} NI: ${p.pnl.netIncome.toFixed(2)}`,
      20,
      y
    )
  })

  report.properties.forEach(p => {
    doc.addPage()
    doc.setFontSize(16)
    doc.text(p.name, 20, 20)
    doc.setFontSize(12)
    doc.text(`Revenue: ${p.pnl.revenue.toFixed(2)}`, 20, 40)
    doc.text(`Expenses: ${p.pnl.expenses.toFixed(2)}`, 20, 50)
    doc.text(`Net Income: ${p.pnl.netIncome.toFixed(2)}`, 20, 60)
    doc.text(`Bookings: ${p.bookings.bookings}`, 20, 80)
    doc.text(`Nights: ${p.bookings.nights}`, 20, 90)
    doc.text(`Occupancy: ${p.bookings.occupancyPct.toFixed(2)}%`, 20, 100)
  })

  doc.addPage()
  doc.setFontSize(16)
  doc.text('Appendix', 20, 20)
  doc.setFontSize(12)
  doc.text('Data notes and methodology.', 20, 40)

  const pdfBytes = doc.output('arraybuffer')

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="Property-Portfolio-${month}.pdf"`,
    },
  })
}

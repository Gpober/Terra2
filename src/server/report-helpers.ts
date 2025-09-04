import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import minMax from 'dayjs/plugin/minMax'

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(minMax)

const TZ = 'America/New_York'

export function getMonthBounds(month: string) {
  const start = dayjs.tz(`${month}-01`, TZ).startOf('day')
  const end = start.endOf('month')
  return {
    start: start.toDate(),
    end: end.toDate(),
    daysInMonth: end.date(),
  }
}

export type Reservation = {
  start_date: string
  end_date: string
  nights: number
  adr?: number
  revenue?: number
}

export function clipReservationToMonth(
  res: Reservation,
  bounds: { start: Date; end: Date }
) {
  const resStart = dayjs.tz(res.start_date, TZ)
  const resEnd = dayjs.tz(res.end_date, TZ)
  const boundsStart = dayjs.tz(bounds.start, TZ)
  const boundsEnd = dayjs.tz(bounds.end, TZ)
  const start = dayjs.max(resStart, boundsStart)
  const end = dayjs.min(resEnd, boundsEnd)
  const nights = Math.max(end.diff(start, 'day'), 0)
  const adr =
    res.adr ?? (res.nights > 0 && res.revenue ? res.revenue / res.nights : 0)
  const revenue = adr * nights
  return { nights_in_month: nights, adr_in_month: adr, revenue_in_month: revenue }
}

export function computeOccupancy(
  nights: number,
  daysInMonth: number,
  units = 1
) {
  if (daysInMonth <= 0 || units <= 0) return 0
  return (nights / (daysInMonth * units)) * 100
}

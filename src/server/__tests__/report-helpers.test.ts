import test from 'node:test'
import assert from 'node:assert/strict'
import { clipReservationToMonth, computeOccupancy, getMonthBounds } from '../report-helpers'

test('clipReservationToMonth trims reservation to month', () => {
  const bounds = getMonthBounds('2025-02')
  const res = {
    start_date: '2025-01-28',
    end_date: '2025-02-03',
    nights: 6,
    revenue: 600,
  }
  const clipped = clipReservationToMonth(res, bounds)
  assert.equal(clipped.nights_in_month, 2)
  assert.equal(clipped.revenue_in_month, 200)
})

test('computeOccupancy handles units', () => {
  const pct = computeOccupancy(60, 30, 2)
  assert.equal(pct, 100)
})

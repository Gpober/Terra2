'use client'

import { useState } from 'react'
import { toast } from 'sonner'

interface Props {
  defaultMonth: string
  defaultCompanyId?: string
}

export default function GenerateStatementsButton({
  defaultMonth,
  defaultCompanyId,
}: Props) {
  const [month, setMonth] = useState(defaultMonth)
  const [companyId, setCompanyId] = useState<string | undefined>(defaultCompanyId)
  const [propertyIds, setPropertyIds] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const handleDownload = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/statements/monthly', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month, companyId, propertyIds: propertyIds.length ? propertyIds : undefined }),
      })
      if (!res.ok) throw new Error('Failed to generate')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Property-Portfolio-${month}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err: any) {
      console.error(err)
      toast.error('Failed to generate statements')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2 flex-wrap items-center">
        <input
          type="month"
          value={month}
          onChange={e => setMonth(e.target.value)}
          className="border p-2 rounded"
        />
        <input
          type="text"
          placeholder="Company ID"
          value={companyId || ''}
          onChange={e => setCompanyId(e.target.value || undefined)}
          className="border p-2 rounded"
        />
        <input
          type="text"
          placeholder="Property IDs (comma separated)"
          onChange={e =>
            setPropertyIds(
              e.target.value
                .split(',')
                .map(v => v.trim())
                .filter(Boolean)
            )
          }
          className="border p-2 rounded w-64"
        />
      </div>
      <button
        onClick={handleDownload}
        disabled={loading}
        className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
      >
        {loading ? 'Generating…' : 'Generate Monthly Property Statements'}
      </button>
    </div>
  )
}

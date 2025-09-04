import GenerateStatementsButton from './components/GenerateStatementsButton'

export default function PortfolioPage() {
  const now = new Date()
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Portfolio</h1>
      <GenerateStatementsButton defaultMonth={defaultMonth} />
    </div>
  )
}

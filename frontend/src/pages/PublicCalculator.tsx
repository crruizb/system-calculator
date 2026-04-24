import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useTenantCalculator } from '../hooks/useTenantCalculator'
import { useSheetData } from '../hooks/useSheetData'
import PriceCalculator from '../components/PriceCalculator'
import PriceSummary from '../components/PriceSummary'
import LoadingSpinner from '../components/LoadingSpinner'
import { Watermark } from '../components/Watermark'
import { getFilterFields, matchPrice } from '../utils/filters'

type Filters = Record<string, string | undefined>

interface CalculatorInstance {
  id: string
  filters: Filters
}

export function PublicCalculator() {
  const { tenantSlug = '', calcSlug = '' } = useParams<{ tenantSlug: string; calcSlug: string }>()
  const { config, loading: configLoading, error } = useTenantCalculator(tenantSlug, calcSlug)
  const { data, loading: dataLoading } = useSheetData(config?.sheetUrl ?? null)
  const [instances, setInstances] = useState<CalculatorInstance[]>([
    { id: crypto.randomUUID(), filters: {} },
  ])
  const [activeTabId, setActiveTabId] = useState<string>(() => instances[0].id)

  const filterFields = useMemo(() => getFilterFields(data), [data])

  const prices = useMemo(
    () => instances.map((inst) => matchPrice(data, inst.filters, filterFields)),
    [instances, data, filterFields],
  )

  if (configLoading) return <div role="status"><LoadingSpinner /></div>
  if (error) return <p className="text-center text-red-400 mt-20">Calculator not found.</p>
  if (!config) return null

  const { settings, branding } = config
  const currency = (settings.currency as string) ?? '€'
  const locale = (settings.locale as string) ?? 'es-ES'
  const showWatermark = !branding.companyName

  const cssVars: React.CSSProperties = branding.primaryColor
    ? ({ '--color-gold': branding.primaryColor } as React.CSSProperties)
    : {}

  return (
    <div style={cssVars}>
      <header className="text-center py-8">
        {branding.logo
          ? <img src={branding.logo} alt={branding.companyName} className="h-12 mx-auto" />
          : <img src="/diamond.png" alt="logo" className="h-12 mx-auto" />}
        <h1 className="mt-2 font-display text-2xl">
          {branding.companyName ?? 'Price Calculator'}
        </h1>
      </header>

      {dataLoading && <LoadingSpinner />}

      <div className="flex items-center gap-1 px-4 mt-2 mb-0">
        {instances.map((inst, i) => (
          <button
            key={inst.id}
            onClick={() => setActiveTabId(inst.id)}
            className={`px-3 py-1 text-sm rounded-t-lg transition-colors ${
              inst.id === activeTabId
                ? 'bg-[var(--color-surface)] text-[var(--color-gold)] font-semibold'
                : 'text-[var(--color-text-primary)]/40 hover:text-[var(--color-text-primary)]/70'
            }`}
          >
            {i + 1}
          </button>
        ))}
        <button
          onClick={() => {
            const newId = crypto.randomUUID()
            setInstances((prev) => [...prev, { id: newId, filters: {} }])
            setActiveTabId(newId)
          }}
          className="px-3 py-1 text-sm text-[var(--color-text-primary)]/40 hover:text-[var(--color-text-primary)]/70 transition-colors"
        >
          +
        </button>
      </div>

      {instances.map((inst) => inst.id === activeTabId && (
        <PriceCalculator
          key={inst.id}
          instanceId={inst.id}
          data={data}
          filterFields={filterFields}
          filters={inst.filters}
          onFiltersChange={(id, f) =>
            setInstances((prev) => prev.map((p) => p.id === id ? { ...p, filters: f } : p))
          }
          showRemove={instances.length > 1}
          onRemove={(id) => {
            const remaining = instances.filter((p) => p.id !== id)
            setInstances(remaining)
            if (activeTabId === id) setActiveTabId(remaining[remaining.length - 1].id)
          }}
          currency={currency}
          locale={locale}
        />
      ))}

      {instances.length >= 2 && (
        <PriceSummary
          instances={instances.map((inst, i) => ({ filters: inst.filters, price: prices[i] }))}
          filterFields={filterFields}
          currency={currency}
          locale={locale}
        />
      )}

      {showWatermark && <Watermark />}
    </div>
  )
}

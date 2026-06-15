import { useState, useEffect, useMemo } from 'react'
import Header from './components/Header'
import KPIBar from './components/KPIBar'
import Charts from './components/Charts'
import MainTable from './components/MainTable'
import Sidebar from './components/Sidebar'
import StatusBar from './components/StatusBar'
import { precompute, computeSummaries, computeKPIs, computeFiltered } from './utils/compute'

export default function App() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedMonths, setSelectedMonths] = useState(new Set())
  const [expandedWBS, setExpandedWBS] = useState(null)
  const [activeTab, setActiveTab] = useState({})
  const [overrides, setOverrides] = useState({})

  useEffect(() => {
    fetch('./app_data.json')
      .then(r => { if (!r.ok) throw new Error('Napaka pri nalaganju podatkov'); return r.json() })
      .then(d => {
        setData(d)
        setSelectedMonths(new Set(d.blist_months))
        setLoading(false)
      })
      .catch(e => {
        setError(e.message)
        setLoading(false)
      })
  }, [])

  const precomputed = useMemo(() => data ? precompute(data) : null, [data])
  const summaries = useMemo(() => data ? computeSummaries(data, selectedMonths, overrides) : [], [data, selectedMonths, overrides])
  const filtered = useMemo(() => data ? computeFiltered(data, selectedMonths, overrides) : null, [data, selectedMonths, overrides])
  const kpis = useMemo(() => precomputed ? computeKPIs(summaries, precomputed.BAC) : null, [summaries, precomputed])

  if (loading) return <div className="app"><div className="state-screen">Nalagam podatke…</div></div>
  if (error) return <div className="app"><div className="state-screen error">Napaka: {error}</div></div>

  return (
    <div className="app">
      <Header />
      <KPIBar kpis={kpis} bac={precomputed.BAC} />
      <div className="main">
        <div className="content">
          <Charts data={data} precomputed={precomputed} filtered={filtered} />
          <MainTable
            data={data}
            summaries={summaries}
            bac={precomputed.BAC}
            expandedWBS={expandedWBS}
            setExpandedWBS={setExpandedWBS}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            selectedMonths={selectedMonths}
            overrides={overrides}
            setOverrides={setOverrides}
          />
        </div>
        <Sidebar
          data={data}
          filtered={filtered}
          selectedMonths={selectedMonths}
          setSelectedMonths={setSelectedMonths}
          overrides={overrides}
          setOverrides={setOverrides}
        />
      </div>
      <StatusBar selectedMonths={selectedMonths} data={data} bac={precomputed.BAC} />
    </div>
  )
}

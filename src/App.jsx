import { useState, useEffect, useMemo } from 'react'
import Header from './components/Header'
import KPIBar from './components/KPIBar'
import Charts from './components/Charts'
import MainTable from './components/MainTable'
import Sidebar from './components/Sidebar'
import StatusBar from './components/StatusBar'
import { precompute, computeSummaries, computeKPIs, computeFiltered } from './utils/compute'

const BACKEND = 'https://spremljanje-backend.onrender.com'

function LoginScreen({ onLogin }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const r = await fetch(`${BACKEND}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (!r.ok) throw new Error('Napačno geslo')
      const { token } = await r.json()
      sessionStorage.setItem('token', token)
      onLogin(token)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg)' }}>
      <form onSubmit={handleSubmit} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 32, minWidth: 280, boxShadow: 'var(--shadow)' }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--navy)', marginBottom: 6 }}>Spremljanje projekta</div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 20 }}>Vnesite geslo za dostop</div>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Geslo"
          autoFocus
          style={{ width: '100%', padding: '7px 10px', fontSize: 13, border: '1px solid var(--border)', borderRadius: 5, marginBottom: 10, outline: 'none' }}
        />
        {error && <div style={{ color: 'var(--red)', fontSize: 11, marginBottom: 8 }}>{error}</div>}
        <button type="submit" disabled={loading} style={{ width: '100%', padding: '8px', background: 'var(--navy)', color: '#fff', border: 'none', borderRadius: 5, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          {loading ? 'Prijava...' : 'Prijava'}
        </button>
      </form>
    </div>
  )
}

export default function App() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [token, setToken] = useState(() => sessionStorage.getItem('token'))
  const [selectedMonths, setSelectedMonths] = useState(new Set())
  const [expandedWBS, setExpandedWBS] = useState(null)
  const [activeTab, setActiveTab] = useState({})
  const [overrides, setOverrides] = useState({})

  useEffect(() => {
    if (!token) { setLoading(false); return }
    fetch(`${BACKEND}/data`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => {
        if (r.status === 401) { sessionStorage.removeItem('token'); setToken(null); setLoading(false); return null }
        if (!r.ok) throw new Error('Napaka pri nalaganju podatkov')
        return r.json()
      })
      .then(d => {
        if (!d) return
        setData(d)
        setSelectedMonths(new Set(d.blist_months))
        setLoading(false)
      })
      .catch(e => {
        setError(e.message)
        setLoading(false)
      })
  }, [token])

  const precomputed = useMemo(() => data ? precompute(data) : null, [data])
  const summaries = useMemo(() => data ? computeSummaries(data, selectedMonths, overrides) : [], [data, selectedMonths, overrides])
  const filtered = useMemo(() => data ? computeFiltered(data, selectedMonths, overrides) : null, [data, selectedMonths, overrides])
  const kpis = useMemo(() => precomputed ? computeKPIs(summaries, precomputed.BAC) : null, [summaries, precomputed])

  if (!token) return <LoginScreen onLogin={t => { setToken(t); setLoading(true) }} />
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

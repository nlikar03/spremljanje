import { useState, useEffect, useMemo } from 'react'
import Header from './components/Header'
import KPIBar from './components/KPIBar'
import Charts from './components/Charts'
import MainTable from './components/MainTable'
import Sidebar from './components/Sidebar'
import StatusBar from './components/StatusBar'
import { precompute, computeSummaries, computeKPIs, computeFiltered } from './utils/compute'

const BACKEND = import.meta.env.VITE_BACKEND_URL

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
      if (r.status === 429) throw new Error('Preveč poskusov. Poskusite čez minuto.')
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
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100vh', background: 'var(--bg)',
      backgroundImage: 'radial-gradient(ellipse at 50% 0%, rgba(88,166,255,0.08) 0%, transparent 60%)',
    }}>
      <form onSubmit={handleSubmit} style={{
        background: 'var(--surface)',
        border: '1px solid var(--glass-border)',
        borderRadius: 16,
        padding: '36px 32px',
        minWidth: 300,
        boxShadow: '0 8px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(88,166,255,0.12)', border: '1px solid rgba(88,166,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#58a6ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', letterSpacing: '.1px' }}>Spremljanje projekta</div>
          </div>
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 24, marginTop: 2 }}>Vnesite geslo za dostop</div>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Geslo"
          autoFocus
          style={{
            width: '100%', padding: '9px 12px', fontSize: 13,
            background: 'var(--bg2)', color: 'var(--text)',
            border: '1px solid var(--glass-border)', borderRadius: 8,
            marginBottom: 12, outline: 'none',
            fontFamily: 'var(--sans)',
            transition: 'border-color .15s',
          }}
          onFocus={e => e.target.style.borderColor = 'rgba(88,166,255,0.5)'}
          onBlur={e => e.target.style.borderColor = 'var(--glass-border)'}
        />
        {error && <div style={{ color: 'var(--red)', fontSize: 11, marginBottom: 10, padding: '6px 10px', background: 'rgba(248,81,73,0.1)', borderRadius: 6, border: '1px solid rgba(248,81,73,0.2)' }}>{error}</div>}
        <button type="submit" disabled={loading} style={{
          width: '100%', padding: '9px', background: '#1f6feb', color: '#fff',
          border: '1px solid rgba(88,166,255,0.3)', borderRadius: 8,
          fontSize: 13, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.7 : 1,
          transition: 'background .15s',
          letterSpacing: '.2px',
        }}>
          {loading ? 'Prijava…' : 'Prijava'}
        </button>
      </form>
    </div>
  )
}

function UploadScreen({ token, onData }) {
  const [blist, setBlist] = useState(null)
  const [stroski, setStroski] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!blist || !stroski) { setError('Naložite obe datoteki.'); return }
    setLoading(true); setError(null)
    try {
      const fd = new FormData()
      fd.append('blist', blist)
      fd.append('stroski', stroski)
      const r = await fetch(`${BACKEND}/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      })
      if (r.status === 401) throw new Error('Seja je potekla. Prijavite se znova.')
      if (!r.ok) {
        const body = await r.json().catch(() => null)
        throw new Error(body?.detail || 'Napaka pri obdelavi datotek.')
      }
      onData(await r.json())
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const fileRow = (label, hint, file, setFile, accept) => (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 6 }}>{hint}</div>
      <input type="file" accept={accept} onChange={e => setFile(e.target.files[0] || null)}
        style={{ fontSize: 12, color: 'var(--text)' }} />
    </div>
  )

  return (
    <div className="app">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg)' }}>
        <form onSubmit={handleSubmit} style={{
          background: 'var(--surface)', border: '1px solid var(--glass-border)', borderRadius: 16,
          padding: '32px', minWidth: 380, boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
        }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>Naloži izvoze projekta</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 20 }}>Poročilo se izdela iz obeh datotek.</div>
          {fileRow('BLIST izvoz', 'blistExport.xlsx', blist, setBlist, '.xlsx')}
          {fileRow('SAP stroški', 'exportStroski.txt', stroski, setStroski, '.txt')}
          {error && <div style={{ color: 'var(--red)', fontSize: 11, margin: '10px 0', padding: '6px 10px', background: 'rgba(248,81,73,0.1)', borderRadius: 6, border: '1px solid rgba(248,81,73,0.2)' }}>{error}</div>}
          <button type="submit" disabled={loading} style={{
            width: '100%', padding: '9px', background: '#1f6feb', color: '#fff',
            border: '1px solid rgba(88,166,255,0.3)', borderRadius: 8, marginTop: 8,
            fontSize: 13, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
          }}>
            {loading ? 'Obdelujem…' : 'Ustvari poročilo'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function App() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [token, setToken] = useState(() => sessionStorage.getItem('token'))
  const [selectedMonths, setSelectedMonths] = useState(new Set())
  const [expandedWBS, setExpandedWBS] = useState(null)
  const [activeTab, setActiveTab] = useState({})
  const [overrides, setOverrides] = useState({})
  const [stroskiOverrides, setStroskiOverrides] = useState({})
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  function handleData(d) {
    setData(d)
    setSelectedMonths(new Set(d.blist_months))
  }

  const precomputed = useMemo(() => data ? precompute(data) : null, [data])
  const summaries = useMemo(() => data ? computeSummaries(data, selectedMonths, overrides, stroskiOverrides) : [], [data, selectedMonths, overrides, stroskiOverrides])
  const filtered = useMemo(() => data ? computeFiltered(data, selectedMonths, overrides) : null, [data, selectedMonths, overrides])
  const kpis = useMemo(() => precomputed ? computeKPIs(summaries, precomputed.BAC) : null, [summaries, precomputed])

  if (!token) return <LoginScreen onLogin={t => setToken(t)} />
  if (error) return <div className="app"><div className="state-screen error">Napaka: {error}</div></div>
  if (!data) return <UploadScreen token={token} onData={handleData} />

  return (
    <div className="app">
      <Header theme={theme} setTheme={setTheme} onNewUpload={() => { setData(null); setOverrides({}); setStroskiOverrides({}) }} />
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
            stroskiOverrides={stroskiOverrides}
            setStroskiOverrides={setStroskiOverrides}
          />
        </div>
        <Sidebar
          data={data}
          filtered={filtered}
          selectedMonths={selectedMonths}
          setSelectedMonths={setSelectedMonths}
          overrides={overrides}
          setOverrides={setOverrides}
          stroskiOverrides={stroskiOverrides}
          setStroskiOverrides={setStroskiOverrides}
        />
      </div>
      <StatusBar selectedMonths={selectedMonths} data={data} bac={precomputed.BAC} />
    </div>
  )
}

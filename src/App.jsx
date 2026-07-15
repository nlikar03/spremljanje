import { useState, useEffect, useMemo, useRef } from 'react'
import Header from './components/Header'
import KPIBar from './components/KPIBar'
import Charts from './components/Charts'
import MainTable from './components/MainTable'
import Sidebar from './components/Sidebar'
import StatusBar from './components/StatusBar'
import { precompute, computeSummaries, computeKPIs, computeFiltered } from './utils/compute'
import { loadSnapshot, saveSnapshot, clearSnapshot } from './utils/snapshot'

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

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function extOk(file, accept) {
  const exts = accept.split(',').map(s => s.trim().toLowerCase())
  const name = file.name.toLowerCase()
  return exts.some(e => name.endsWith(e))
}

function DropBox({ label, hint, accept, file, setFile, optional }) {
  const [drag, setDrag] = useState(false)
  const [badType, setBadType] = useState(false)
  const inputRef = useRef(null)

  function pick(f) {
    if (!f) return
    if (!extOk(f, accept)) { setBadType(true); return }
    setBadType(false)
    setFile(f)
  }

  function onDrop(e) {
    e.preventDefault(); setDrag(false)
    pick(e.dataTransfer.files?.[0])
  }

  const filled = !!file
  const borderColor = badType ? 'var(--red)'
    : drag ? 'rgba(88,166,255,0.8)'
    : filled ? 'rgba(63,185,80,0.5)'
    : 'var(--glass-border)'

  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 6 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{label}</span>
        {optional && <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 500 }}>(neobvezno)</span>}
      </div>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDrag(true) }}
        onDragLeave={() => setDrag(false)}
        onDrop={onDrop}
        style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '14px 16px', cursor: 'pointer', userSelect: 'none',
          background: drag ? 'rgba(88,166,255,0.08)' : filled ? 'rgba(63,185,80,0.06)' : 'var(--bg2)',
          border: `1.5px dashed ${borderColor}`, borderRadius: 10,
          transition: 'border-color .15s, background .15s',
        }}
      >
        <div style={{
          width: 34, height: 34, flexShrink: 0, borderRadius: 8,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: filled ? 'rgba(63,185,80,0.12)' : 'rgba(88,166,255,0.10)',
          border: `1px solid ${filled ? 'rgba(63,185,80,0.3)' : 'rgba(88,166,255,0.2)'}`,
          color: filled ? '#3fb950' : '#58a6ff',
        }}>
          {filled ? (
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
          ) : (
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M17 8l-5-5-5 5"/><path d="M12 3v12"/></svg>
          )}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          {filled ? (
            <>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>{formatSize(file.size)}</div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 12, color: 'var(--text)' }}>Povlecite datoteko sem ali <span style={{ color: '#58a6ff', fontWeight: 600 }}>izberite</span></div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>{hint}</div>
            </>
          )}
        </div>
        {filled && (
          <button
            type="button"
            onClick={e => { e.stopPropagation(); setFile(null); setBadType(false); if (inputRef.current) inputRef.current.value = '' }}
            title="Odstrani"
            style={{
              flexShrink: 0, width: 24, height: 24, borderRadius: 6, cursor: 'pointer',
              background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--text-muted)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        )}
        <input ref={inputRef} type="file" accept={accept} style={{ display: 'none' }}
          onChange={e => pick(e.target.files?.[0])} />
      </div>
      {badType && <div style={{ fontSize: 10, color: 'var(--red)', marginTop: 5 }}>Napačna vrsta datoteke. Pričakovano: {accept}</div>}
    </div>
  )
}

function UploadScreen({ token, onData }) {
  const [blist, setBlist] = useState(null)
  const [stroski, setStroski] = useState(null)
  const [wbs, setWbs] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!blist || !stroski) { setError('Naložite datoteki BLIST in SAP stroški.'); return }
    setLoading(true); setError(null)
    try {
      const fd = new FormData()
      fd.append('blist', blist)
      fd.append('stroski', stroski)
      if (wbs) fd.append('wbs', wbs)
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

  return (
    <div className="app">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: 24, background: 'var(--bg)', backgroundImage: 'radial-gradient(ellipse at 50% 0%, rgba(88,166,255,0.08) 0%, transparent 60%)' }}>
        <form onSubmit={handleSubmit} style={{
          background: 'var(--surface)', border: '1px solid var(--glass-border)', borderRadius: 16,
          padding: '32px', width: 440, maxWidth: '100%', boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
        }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>Naloži izvoze projekta</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 22 }}>Poročilo se izdela iz izvozov BLIST in SAP. Datoteko WBS dodajte za pravilna imena WBS elementov.</div>
          <DropBox label="BLIST izvoz" hint="Excel (.xlsx)" accept=".xlsx" file={blist} setFile={setBlist} />
          <DropBox label="SAP stroški" hint="Tekstovni izvoz (.txt) ali Excel (.xlsx)" accept=".txt,.xlsx" file={stroski} setFile={setStroski} />
          <DropBox label="WBS imena" hint="Excel s stolpcema Code in Description (.xlsx)" accept=".xlsx" file={wbs} setFile={setWbs} optional />
          {error && <div style={{ color: 'var(--red)', fontSize: 11, margin: '10px 0', padding: '6px 10px', background: 'rgba(248,81,73,0.1)', borderRadius: 6, border: '1px solid rgba(248,81,73,0.2)' }}>{error}</div>}
          <button type="submit" disabled={loading} style={{
            width: '100%', padding: '10px', background: '#1f6feb', color: '#fff',
            border: '1px solid rgba(88,166,255,0.3)', borderRadius: 8, marginTop: 10,
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
  const snap = useMemo(() => loadSnapshot(), [])
  const [data, setData] = useState(snap?.data || null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [token, setToken] = useState(() => sessionStorage.getItem('token'))
  const [selectedMonths, setSelectedMonths] = useState(() => snap?.selectedMonths || new Set())
  const [expandedWBS, setExpandedWBS] = useState(null)
  const [activeTab, setActiveTab] = useState({})
  const [overrides, setOverrides] = useState(() => snap?.overrides || {})
  const [stroskiOverrides, setStroskiOverrides] = useState(() => snap?.stroskiOverrides || {})
  const [wbsEdits, setWbsEdits] = useState(() => snap?.wbsEdits || { customGroups: [], labelOverrides: {}, deletedGroups: [] })
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  // Persist the open report + edits so a reload restores exactly where you were.
  useEffect(() => {
    if (!data) return
    saveSnapshot({ data, overrides, stroskiOverrides, selectedMonths, wbsEdits })
  }, [data, overrides, stroskiOverrides, selectedMonths, wbsEdits])

  const EMPTY_EDITS = { customGroups: [], labelOverrides: {}, deletedGroups: [] }

  function handleData(d) {
    // New upload replaces any saved snapshot and resets edits.
    setOverrides({})
    setStroskiOverrides({})
    setWbsEdits(EMPTY_EDITS)
    setData(d)
    setSelectedMonths(new Set(d.blist_months))
  }

  function newUpload() {
    clearSnapshot()
    setData(null)
    setOverrides({})
    setStroskiOverrides({})
    setWbsEdits(EMPTY_EDITS)
    setSelectedMonths(new Set())
  }

  const precomputed = useMemo(() => data ? precompute(data) : null, [data])
  const summaries = useMemo(() => data ? computeSummaries(data, selectedMonths, overrides, stroskiOverrides, wbsEdits) : [], [data, selectedMonths, overrides, stroskiOverrides, wbsEdits])
  const filtered = useMemo(() => data ? computeFiltered(data, selectedMonths, overrides) : null, [data, selectedMonths, overrides])
  const kpis = useMemo(() => precomputed ? computeKPIs(summaries, precomputed.BAC) : null, [summaries, precomputed])

  if (!token) return <LoginScreen onLogin={t => setToken(t)} />
  if (error) return <div className="app"><div className="state-screen error">Napaka: {error}</div></div>
  if (!data) return <UploadScreen token={token} onData={handleData} />

  return (
    <div className="app">
      <Header theme={theme} setTheme={setTheme} onNewUpload={newUpload} />
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
            wbsEdits={wbsEdits}
            setWbsEdits={setWbsEdits}
          />
        </div>
        <Sidebar
          data={data}
          filtered={filtered}
          precomputed={precomputed}
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

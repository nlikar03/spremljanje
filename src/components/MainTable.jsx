import React, { useState } from 'react'
import { fmtM, fmtP, trunc, realClass, cpiClass, cpiLabel } from '../utils/formatters'
import { IconChevronRight, IconCheck } from './Icons'
import { groupIsEmpty } from '../utils/compute'
import DetailPanel from './DetailPanel'

function MetricPair({ label, value, sub, color }) {
  return (
    <div className="wbs-metric">
      <div className="wbs-metric-label">{label}</div>
      <div className="wbs-metric-value" style={color ? { color } : undefined}>{value}</div>
      {sub && <div className="wbs-metric-sub">{sub}</div>}
    </div>
  )
}

function ProgressBar({ real }) {
  const cls = realClass(real)
  return (
    <div className="wbs-progress-wrap">
      <div className="wbs-progress-track">
        <div className={`wbs-progress-fill ${cls}`} style={{ width: `${Math.min(real, 100)}%` }} />
      </div>
      <span className="wbs-progress-label">{real.toLocaleString('sl-SI', { maximumFractionDigits: 1 })}%</span>
    </div>
  )
}

function WBSCard({ s, bac, expanded, onToggle, data, activeTab, setActiveTab, selectedMonths, overrides, setOverrides, stroskiOverrides, setStroskiOverrides, wbsEdits, setWbsEdits }) {
  const gap  = s.obrZn - s.strZn
  const real = s.pog > 0 ? s.obrZn / s.pog * 100 : 0
  const cpi  = s.strZn > 0 ? s.obrZn / s.strZn : null
  const cpiCls = cpiClass(cpi)

  const gapColor = gap >= 0 ? 'var(--green)' : 'var(--red)'

  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(s.label)
  const empty = groupIsEmpty(s.wbs, data, overrides, stroskiOverrides)

  function saveLabel() {
    setWbsEdits(prev => ({ ...prev, labelOverrides: { ...prev.labelOverrides, [s.wbs]: draft.trim() || s.wbs } }))
    setEditing(false)
  }

  function deleteGroup(e) {
    e.stopPropagation()
    if (!empty) return
    setWbsEdits(prev => ({ ...prev, deletedGroups: [...new Set([...prev.deletedGroups, s.wbs])] }))
  }

  return (
    <div className={`wbs-card${expanded ? ' wbs-card-expanded' : ''}`}>
      <div className="wbs-card-header" onClick={editing ? undefined : onToggle}>
        <div className="wbs-card-left">
          <span className={`wbs-chevron${expanded ? ' wbs-chevron-open' : ''}`}>
            <IconChevronRight size={11} />
          </span>
          <div className="wbs-card-id">{s.wbs}</div>
          {editing ? (
            <span className="wbs-edit" onClick={e => e.stopPropagation()}>
              <input
                autoFocus
                className="wbs-edit-input"
                value={draft}
                onChange={e => setDraft(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') saveLabel(); if (e.key === 'Escape') { setEditing(false); setDraft(s.label) } }}
              />
              <button className="wbs-edit-btn" onClick={saveLabel} title="Shrani"><IconCheck size={11} /></button>
            </span>
          ) : (
            <div className="wbs-card-title" title={s.label}>{s.label}</div>
          )}
          <span className="wbs-card-tools" onClick={e => e.stopPropagation()}>
            {!editing && (
              <button className="wbs-tool-btn" title="Preimenuj" onClick={e => { e.stopPropagation(); setDraft(s.label); setEditing(true) }}>✎</button>
            )}
            {!editing && (
              <button
                className="wbs-tool-btn wbs-tool-del"
                title={empty ? 'Izbriši (prazen)' : 'Najprej premakni vse postavke/stroške'}
                disabled={!empty}
                onClick={deleteGroup}
              >✕</button>
            )}
          </span>
        </div>

        <div className="wbs-card-metrics">
          <MetricPair
            label="BAC"
            value={fmtM(s.pog)}
          />
          <div className="wbs-metric-divider" />
          <MetricPair
            label="EV"
            value={fmtM(s.obrZn)}
            color="var(--blue)"
          />
          <div className="wbs-metric-divider" />
          <MetricPair
            label="AC"
            value={fmtM(s.strZn)}
          />
          <div className="wbs-metric-divider" />
          <MetricPair
            label="GAP"
            value={(gap >= 0 ? '+' : '') + fmtM(gap)}
            color={gapColor}
          />
          <div className="wbs-metric-divider" />
          <div className="wbs-metric wbs-metric-progress">
            <div className="wbs-metric-label">Realizacija</div>
            <ProgressBar real={real} />
          </div>
          <div className="wbs-metric-divider" />
          <div className="wbs-metric" style={{ alignItems: 'center', justifyContent: 'center' }}>
            <div className="wbs-metric-label">CPI</div>
            <span className={`cpi-badge ${cpiCls}`}>{cpiLabel(cpi)}</span>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="wbs-card-detail">
          <DetailPanel
            wbs={s.wbs}
            data={data}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            selectedMonths={selectedMonths}
            overrides={overrides}
            setOverrides={setOverrides}
            stroskiOverrides={stroskiOverrides}
            setStroskiOverrides={setStroskiOverrides}
            wbsEdits={wbsEdits}
          />
        </div>
      )}
    </div>
  )
}

export default function MainTable({ data, summaries, bac, expandedWBS, setExpandedWBS, activeTab, setActiveTab, selectedMonths, overrides, setOverrides, stroskiOverrides, setStroskiOverrides, wbsEdits, setWbsEdits }) {
  const [newName, setNewName] = useState('')

  function addGroup() {
    const label = newName.trim()
    if (!label) return
    // Synthesize a stable custom code; label is stored via labelOverrides.
    const code = 'NOV-' + Date.now().toString(36)
    setWbsEdits(prev => ({
      ...prev,
      customGroups: [...prev.customGroups, code],
      labelOverrides: { ...prev.labelOverrides, [code]: label },
    }))
    setNewName('')
  }

  const totPog   = summaries.reduce((s, x) => s + x.pog, 0)
  const totObrZn = summaries.reduce((s, x) => s + x.obrZn, 0)
  const totStrZn = summaries.reduce((s, x) => s + x.strZn, 0)
  const totGap   = totObrZn - totStrZn
  const totReal  = bac > 0 ? totObrZn / bac * 100 : 0
  const totCpi   = totStrZn > 0 ? totObrZn / totStrZn : null

  function toggleDetail(wbs) {
    const next = expandedWBS === wbs ? null : wbs
    setExpandedWBS(next)
    if (next && !activeTab[next]) setActiveTab(prev => ({ ...prev, [next]: 'blist' }))
  }

  return (
    <div className="wbs-list">
      {/* Totals summary bar */}
      <div className="wbs-totals-bar">
        <div className="wbs-totals-label">SKUPAJ</div>
        <div className="wbs-totals-metrics">
          <div className="wbs-totals-item">
            <span className="wbs-totals-key">BAC</span>
            <span className="wbs-totals-val">{fmtM(totPog)}</span>
          </div>
          <div className="wbs-totals-sep" />
          <div className="wbs-totals-item">
            <span className="wbs-totals-key">EV</span>
            <span className="wbs-totals-val" style={{ color: 'var(--blue)' }}>{fmtM(totObrZn)}</span>
          </div>
          <div className="wbs-totals-sep" />
          <div className="wbs-totals-item">
            <span className="wbs-totals-key">AC</span>
            <span className="wbs-totals-val">{fmtM(totStrZn)}</span>
          </div>
          <div className="wbs-totals-sep" />
          <div className="wbs-totals-item">
            <span className="wbs-totals-key">GAP</span>
            <span className="wbs-totals-val" style={{ color: totGap >= 0 ? 'var(--green)' : 'var(--red)' }}>
              {(totGap >= 0 ? '+' : '') + fmtM(totGap)}
            </span>
          </div>
          <div className="wbs-totals-sep" />
          <div className="wbs-totals-item">
            <span className="wbs-totals-key">Realizacija</span>
            <span className="wbs-totals-val">{totReal.toLocaleString('sl-SI', { maximumFractionDigits: 1 })}%</span>
          </div>
          <div className="wbs-totals-sep" />
          <div className="wbs-totals-item">
            <span className="wbs-totals-key">CPI</span>
            <span className={`cpi-badge ${cpiClass(totCpi)}`}>{cpiLabel(totCpi)}</span>
          </div>
        </div>
      </div>

      <div className="wbs-newbar">
        <span className="wbs-newbar-label">Nov WBS element:</span>
        <input
          className="wbs-newbar-input"
          placeholder="Ime elementa…"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') addGroup() }}
        />
        <button className="btn-sm" onClick={addGroup} disabled={!newName.trim()}>+ Dodaj</button>
      </div>

      {summaries.map(s => (
        <WBSCard
          key={s.wbs}
          s={s}
          bac={bac}
          expanded={expandedWBS === s.wbs}
          onToggle={() => toggleDetail(s.wbs)}
          data={data}
          activeTab={activeTab[s.wbs] || 'blist'}
          setActiveTab={tab => setActiveTab(prev => ({ ...prev, [s.wbs]: tab }))}
          selectedMonths={selectedMonths}
          overrides={overrides}
          setOverrides={setOverrides}
          stroskiOverrides={stroskiOverrides}
          setStroskiOverrides={setStroskiOverrides}
          wbsEdits={wbsEdits}
          setWbsEdits={setWbsEdits}
        />
      ))}
    </div>
  )
}

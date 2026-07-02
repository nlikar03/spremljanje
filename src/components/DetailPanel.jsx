import React, { useState } from 'react'
import { fmtP, fmtE, fmtM, monthLabel, trunc } from '../utils/formatters'
import { IconFileText, IconActivity } from './Icons'
import { itemKey, resolveWBS, stroskiKey, resolveStroskiWBS, effectiveGroups, effectiveLabel } from '../utils/compute'
import { useColWidths, ResizableTh } from './ResizableCols'

const BLIST_COL_DEFAULTS = [64, 108, null, 40, 82, 90, 112, 112, 66, 200]

function WBSSelect({ item, wbsGroups, wbsLabels, overrides, setOverrides }) {
  const current = resolveWBS(item, overrides)
  const isOverridden = itemKey(item) in overrides

  function handleChange(e) {
    const val = e.target.value
    const k = itemKey(item)
    setOverrides(prev => {
      const next = { ...prev }
      if (val === item.wbs_group) delete next[k]
      else next[k] = val
      return next
    })
  }

  return (
    <select
      className={`wbs-select${isOverridden ? ' wbs-select-overridden' : ''}`}
      value={current}
      onChange={handleChange}
      onClick={e => e.stopPropagation()}
    >
      {wbsGroups.map(g => (
        <option key={g} value={g}>{g} — {trunc(wbsLabels[g] || g, 30)}</option>
      ))}
    </select>
  )
}

function BlistRow({ it, selM, isTransplant, origLabel, wbsGroups, wbsLabels, overrides, setOverrides }) {
  const [open, setOpen] = useState(false)
  const rowZn = selM.reduce((s, m) => s + (it.meseci[m]?.znesek || 0), 0)
  const rowKol = selM.reduce((s, m) => s + (it.meseci[m]?.kolicina || 0), 0)
  const monthsWithData = selM.filter(m => it.meseci[m]?.znesek || it.meseci[m]?.kolicina)

  return (
    <>
      <tr
        className={`blist-row${isTransplant ? ' row-transplant' : ''}`}
        onClick={() => setOpen(o => !o)}
        title={isTransplant ? `Premaknjeno iz: ${origLabel}` : undefined}
      >
        <td className="blist-zst" title={it.zst}>{it.zst}</td>
        <td className="blist-sifra" title={it.sifra}>{it.sifra}</td>
        <td className="blist-opis" title={it.opis}>{it.opis}</td>
        <td className="blist-em">{it.em}</td>
        <td className="num blist-num">{fmtP(it.kolicina_pc, 3)}</td>
        <td className="num blist-num">{fmtE(it.cena_pc)}</td>
        <td className="num blist-num blist-pc-zn">{fmtE(it.znesek_pc)}</td>
        <td className="num blist-num blist-obr-zn" style={{ color: rowZn ? 'var(--blue)' : undefined }}>
          {rowZn ? fmtE(rowZn) : <span className="dp-muted">—</span>}
        </td>
        <td className="blist-months-cell">
          {monthsWithData.length > 0
            ? <span className="blist-months-badge">{monthsWithData.length} mes.</span>
            : <span className="dp-muted">—</span>}
        </td>
        <td className="blist-wbs-cell" onClick={e => e.stopPropagation()}>
          <WBSSelect item={it} wbsGroups={wbsGroups} wbsLabels={wbsLabels} overrides={overrides} setOverrides={setOverrides} />
        </td>
      </tr>
      {open && monthsWithData.length > 0 && (
        <tr className="blist-months-row">
          <td colSpan="10">
            <div className="blist-months-grid">
              {monthsWithData.map(m => {
                const md = it.meseci[m]
                return (
                  <div key={m} className="blist-month-chip">
                    <div className="blist-month-chip-label">{monthLabel(m, true)}</div>
                    {md.kolicina !== 0 && <div className="blist-month-chip-val">{fmtP(md.kolicina, 3)} {it.em}</div>}
                    <div className="blist-month-chip-zn" style={{ color: 'var(--blue)' }}>{fmtE(md.znesek)}</div>
                  </div>
                )
              })}
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

function BlistDetail({ wbs, data, selectedMonths, overrides, setOverrides, wbsGroups, wbsLabels }) {
  const { widths, onResizeStart } = useColWidths('blist', BLIST_COL_DEFAULTS)
  // Items that RESOLVE to this WBS (so moved-in items appear, moved-out leave).
  const items = data.blist_items.filter(x => resolveWBS(x, overrides) === wbs)
  const selM = data.blist_months.filter(m => selectedMonths.has(m))
  if (!items.length) return <div className="no-data">Ni BLIST postavk za ta WBS</div>

  const isTransplant = it => resolveWBS(it, overrides) !== it.wbs_group
  const hasData = it => selM.some(m => it.meseci[m]?.znesek !== 0 || it.meseci[m]?.kolicina !== 0)
  // Keep month-activity filter, but never hide an item moved INTO this WBS.
  const active = selM.length === 0 ? items
    : items.filter(it => isTransplant(it) || hasData(it))

  const overriddenCount = active.filter(it => itemKey(it) in overrides).length
  let totPog = 0, totObrZn = 0
  active.forEach(it => {
    totPog += it.znesek_pc
    totObrZn += selM.reduce((s, m) => s + (it.meseci[m]?.znesek || 0), 0)
  })

  function moveAll(targetWBS) {
    setOverrides(prev => {
      const next = { ...prev }
      active.forEach(it => {
        const k = itemKey(it)
        if (targetWBS === it.wbs_group) delete next[k]
        else next[k] = targetWBS
      })
      return next
    })
  }

  function resetAll() {
    setOverrides(prev => {
      const next = { ...prev }
      active.forEach(it => delete next[itemKey(it)])
      return next
    })
  }

  return (
    <>
      <div className="blist-toolbar">
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          {active.length} postavk
          {overriddenCount > 0 && <span className="override-badge">{overriddenCount} premaknjenih</span>}
        </span>
        <div className="blist-toolbar-actions">
          <span style={{ fontSize: 11, color: 'var(--text-muted)', marginRight: 4 }}>Premakni vse na:</span>
          <select
            className="wbs-select"
            defaultValue=""
            onChange={e => { if (e.target.value) { moveAll(e.target.value); e.target.value = '' } }}
            onClick={e => e.stopPropagation()}
          >
            <option value="" disabled>izberi WBS…</option>
            {wbsGroups.map(g => (
              <option key={g} value={g}>{g} — {trunc(wbsLabels[g] || g, 30)}</option>
            ))}
          </select>
          {overriddenCount > 0 && (
            <button className="btn-sm grey" style={{ flex: 'none', padding: '3px 8px', fontSize: 10 }} onClick={e => { e.stopPropagation(); resetAll() }}>
              Ponastavi
            </button>
          )}
        </div>
      </div>
      <div className="blist-hint">Kliknite vrstico za razpis po mesecih</div>
      <div className="dtable-wrap">
        <table className="dtable blist-table">
          <colgroup>
            {widths.map((w, i) => <col key={i} style={w != null ? { width: w } : undefined} />)}
          </colgroup>
          <thead>
            <tr>
              <ResizableTh index={0} onResizeStart={onResizeStart}>Z.Št</ResizableTh>
              <ResizableTh index={1} onResizeStart={onResizeStart}>Šifra</ResizableTh>
              <ResizableTh index={2} onResizeStart={onResizeStart} style={{ textAlign: 'left' }}>Opis</ResizableTh>
              <ResizableTh index={3} onResizeStart={onResizeStart}>EM</ResizableTh>
              <ResizableTh index={4} onResizeStart={onResizeStart}>Kol.PC</ResizableTh>
              <ResizableTh index={5} onResizeStart={onResizeStart}>Cena PC</ResizableTh>
              <ResizableTh index={6} onResizeStart={onResizeStart}>Znesek PC</ResizableTh>
              <ResizableTh index={7} onResizeStart={onResizeStart}>Skupaj obr.</ResizableTh>
              <ResizableTh index={8} onResizeStart={onResizeStart}>Mes.</ResizableTh>
              <ResizableTh index={9} onResizeStart={onResizeStart} style={{ textAlign: 'left' }}>WBS</ResizableTh>
            </tr>
          </thead>
          <tbody>
            {active.map(it => (
              <BlistRow
                key={it.zst + '_' + it.sifra}
                it={it}
                selM={selM}
                isTransplant={isTransplant(it)}
                origLabel={wbsLabels[it.wbs_group] || it.wbs_group}
                wbsGroups={wbsGroups}
                wbsLabels={wbsLabels}
                overrides={overrides}
                setOverrides={setOverrides}
              />
            ))}
            <tr className="tot">
              <td colSpan="6">SKUPAJ ({active.length}/{items.length} postavk)</td>
              <td className="num">{fmtE(totPog)}</td>
              <td className="num">{fmtE(totObrZn)}</td>
              <td colSpan="2" />
            </tr>
          </tbody>
        </table>
      </div>
    </>
  )
}

function StroskiWBSSelect({ it, idx, wbsGroups, wbsLabels, stroskiOverrides, setStroskiOverrides }) {
  const current = resolveStroskiWBS(it, idx, stroskiOverrides)
  const isOverridden = stroskiKey(it, idx) in stroskiOverrides

  function handleChange(e) {
    const val = e.target.value
    const k = stroskiKey(it, idx)
    setStroskiOverrides(prev => {
      const next = { ...prev }
      if (val === it.wbs_group) delete next[k]
      else next[k] = val
      return next
    })
  }

  return (
    <select
      className={`wbs-select${isOverridden ? ' wbs-select-overridden' : ''}`}
      value={current}
      onChange={handleChange}
      onClick={e => e.stopPropagation()}
    >
      {wbsGroups.map(g => (
        <option key={g} value={g}>{g} — {trunc(wbsLabels[g] || g, 30)}</option>
      ))}
    </select>
  )
}

function StroskiDetail({ wbs, data, selectedMonths, stroskiOverrides, setStroskiOverrides, wbsGroups, wbsLabels }) {
  // Global index keeps keys aligned with computeSummaries. Filter by RESOLVED
  // WBS so moved-in rows appear here and moved-out rows leave.
  const all = data.stroski_items
    .map((it, idx) => ({ it, idx }))
    .filter(({ it, idx }) => resolveStroskiWBS(it, idx, stroskiOverrides) === wbs)
  const items = all.filter(({ it, idx }) =>
    resolveStroskiWBS(it, idx, stroskiOverrides) !== it.wbs_group || selectedMonths.has(it.mesec))

  if (!all.length) return <div className="no-data">Ni SAP stroškov za ta WBS</div>
  if (!items.length) return <div className="no-data">Ni SAP stroškov za izbrana obdobja (skupaj {all.length} vrstic)</div>

  const overriddenCount = items.filter(({ it, idx }) => stroskiKey(it, idx) in stroskiOverrides).length

  function moveAll(targetWBS) {
    setStroskiOverrides(prev => {
      const next = { ...prev }
      items.forEach(({ it, idx }) => {
        const k = stroskiKey(it, idx)
        if (targetWBS === it.wbs_group) delete next[k]
        else next[k] = targetWBS
      })
      return next
    })
  }

  function resetAll() {
    setStroskiOverrides(prev => {
      const next = { ...prev }
      items.forEach(({ it, idx }) => delete next[stroskiKey(it, idx)])
      return next
    })
  }

  let tot = 0
  const rows = items.map(({ it, idx }) => {
    tot += it.znesek
    const desc = it.tekst || it.oznaka || ''
    const isTransplant = resolveStroskiWBS(it, idx, stroskiOverrides) !== it.wbs_group
    return (
      <tr key={idx} className={isTransplant ? 'row-transplant' : ''}
        title={isTransplant ? `Premaknjeno iz: ${wbsLabels[it.wbs_group] || it.wbs_group}` : undefined}>
        <td style={{ width: 88 }}>{it.datum}</td>
        <td style={{ width: 110, fontSize: 10 }}>{it.wbs}</td>
        <td style={{ width: 130 }} title={it.oznaka}>{trunc(it.oznaka, 20)}</td>
        <td className="wrap" style={{ minWidth: 150, maxWidth: 260 }} title={desc}>{desc}</td>
        <td className="wrap" style={{ minWidth: 120, maxWidth: 180 }} title={it.opis_protikonta}>{it.opis_protikonta}</td>
        <td className="num" style={{ width: 120, fontWeight: 700, color: 'var(--blue)' }}>{fmtE(it.znesek)}</td>
        <td style={{ width: 200 }} onClick={e => e.stopPropagation()}>
          <StroskiWBSSelect
            it={it} idx={idx}
            wbsGroups={wbsGroups} wbsLabels={wbsLabels}
            stroskiOverrides={stroskiOverrides} setStroskiOverrides={setStroskiOverrides}
          />
        </td>
      </tr>
    )
  })

  return (
    <>
      <div className="blist-toolbar">
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          {items.length} vrstic za izbrana obdobja
          {overriddenCount > 0 && <span className="override-badge">{overriddenCount} premaknjenih</span>}
        </span>
        <div className="blist-toolbar-actions">
          <span style={{ fontSize: 11, color: 'var(--text-muted)', marginRight: 4 }}>Premakni vse na:</span>
          <select
            className="wbs-select"
            defaultValue=""
            onChange={e => { if (e.target.value) { moveAll(e.target.value); e.target.value = '' } }}
            onClick={e => e.stopPropagation()}
          >
            <option value="" disabled>izberi WBS…</option>
            {wbsGroups.map(g => (
              <option key={g} value={g}>{g} — {trunc(wbsLabels[g] || g, 30)}</option>
            ))}
          </select>
          {overriddenCount > 0 && (
            <button className="btn-sm grey" style={{ flex: 'none', padding: '3px 8px', fontSize: 10 }} onClick={e => { e.stopPropagation(); resetAll() }}>
              Ponastavi
            </button>
          )}
        </div>
      </div>
      <div className="dtable-wrap">
        <table className="dtable">
          <thead>
            <tr>
              <th>Datum knj.</th><th>WBS objekt</th><th>Oznaka</th>
              <th>Tekst</th><th>Opis protikonta</th><th>Znesek</th><th style={{ textAlign: 'left' }}>WBS</th>
            </tr>
          </thead>
          <tbody>
            {rows}
            <tr className="tot">
              <td colSpan="5">SKUPAJ ({items.length} vrstic)</td>
              <td className="num" style={{ color: 'var(--blue)' }}>{fmtE(tot)}</td>
              <td />
            </tr>
          </tbody>
        </table>
      </div>
    </>
  )
}

export default function DetailPanel({ wbs, data, activeTab, setActiveTab, selectedMonths, overrides, setOverrides, stroskiOverrides, setStroskiOverrides, wbsEdits }) {
  const wbsGroups = effectiveGroups(data, wbsEdits)
  const wbsLabels = Object.fromEntries(wbsGroups.map(g => [g, effectiveLabel(g, data, wbsEdits)]))
  return (
    <div className="detail-panel">
      <div className="detail-tabs">
        <button
          className={`tab-btn${activeTab === 'blist' ? ' active' : ''}`}
          onClick={e => { e.stopPropagation(); setActiveTab('blist') }}
        >
          <IconFileText size={12} />
          BLIST Postavke
        </button>
        <button
          className={`tab-btn${activeTab === 'stroski' ? ' active' : ''}`}
          onClick={e => { e.stopPropagation(); setActiveTab('stroski') }}
        >
          <IconActivity size={12} />
          SAP Stroški
        </button>
      </div>
      <div className={`tab-content${activeTab === 'blist' ? ' active' : ''}`}>
        <BlistDetail wbs={wbs} data={data} selectedMonths={selectedMonths} overrides={overrides} setOverrides={setOverrides} wbsGroups={wbsGroups} wbsLabels={wbsLabels} />
      </div>
      <div className={`tab-content${activeTab === 'stroski' ? ' active' : ''}`}>
        <StroskiDetail wbs={wbs} data={data} selectedMonths={selectedMonths} stroskiOverrides={stroskiOverrides} setStroskiOverrides={setStroskiOverrides} wbsGroups={wbsGroups} wbsLabels={wbsLabels} />
      </div>
    </div>
  )
}

import React, { useState } from 'react'
import { fmtP, fmtE, fmtM, monthLabel, trunc } from '../utils/formatters'
import { IconFileText, IconActivity } from './Icons'
import { itemKey, resolveWBS, stroskiKey, resolveStroskiWBS } from '../utils/compute'

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

function BlistRow({ it, selM, isOverridden, wbsGroups, wbsLabels, overrides, setOverrides }) {
  const [open, setOpen] = useState(false)
  const rowZn = selM.reduce((s, m) => s + (it.meseci[m]?.znesek || 0), 0)
  const rowKol = selM.reduce((s, m) => s + (it.meseci[m]?.kolicina || 0), 0)
  const monthsWithData = selM.filter(m => it.meseci[m]?.znesek || it.meseci[m]?.kolicina)

  return (
    <>
      <tr
        className={`blist-row${isOverridden ? ' row-overridden' : ''}`}
        onClick={() => setOpen(o => !o)}
      >
        <td className="blist-zst">{it.zst}</td>
        <td className="blist-sifra">{it.sifra}</td>
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

function BlistDetail({ wbs, data, selectedMonths, overrides, setOverrides }) {
  const items = data.blist_items.filter(x => x.wbs_group === wbs)
  const selM = data.blist_months.filter(m => selectedMonths.has(m))
  if (!items.length) return <div className="no-data">Ni BLIST postavk za ta WBS</div>

  const active = selM.length === 0 ? items
    : items.filter(it => selM.some(m => it.meseci[m]?.znesek !== 0 || it.meseci[m]?.kolicina !== 0))

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
            {data.wbs_groups.map(g => (
              <option key={g} value={g}>{g} — {trunc(data.wbs_labels[g] || g, 30)}</option>
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
            <col style={{ width: 42 }} />
            <col style={{ width: 76 }} />
            <col />
            <col style={{ width: 36 }} />
            <col style={{ width: 82 }} />
            <col style={{ width: 90 }} />
            <col style={{ width: 112 }} />
            <col style={{ width: 112 }} />
            <col style={{ width: 66 }} />
            <col style={{ width: 200 }} />
          </colgroup>
          <thead>
            <tr>
              <th>Z.Št</th>
              <th>Šifra</th>
              <th style={{ textAlign: 'left' }}>Opis</th>
              <th>EM</th>
              <th>Kol.PC</th>
              <th>Cena PC</th>
              <th>Znesek PC</th>
              <th>Skupaj obr.</th>
              <th>Mes.</th>
              <th style={{ textAlign: 'left' }}>WBS</th>
            </tr>
          </thead>
          <tbody>
            {active.map(it => (
              <BlistRow
                key={it.zst + '_' + it.sifra}
                it={it}
                selM={selM}
                isOverridden={itemKey(it) in overrides}
                wbsGroups={data.wbs_groups}
                wbsLabels={data.wbs_labels}
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

function StroskiDetail({ wbs, data, selectedMonths, stroskiOverrides, setStroskiOverrides }) {
  // Keep global index so keys match computeSummaries; a row stays listed in its
  // ORIGINAL wbs panel (so it can be moved back) even after being reassigned.
  const all = data.stroski_items
    .map((it, idx) => ({ it, idx }))
    .filter(({ it }) => it.wbs_group === wbs)
  const items = all.filter(({ it }) => selectedMonths.has(it.mesec))

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
    const isOverridden = stroskiKey(it, idx) in stroskiOverrides
    return (
      <tr key={idx} className={isOverridden ? 'row-overridden' : ''}>
        <td style={{ width: 88 }}>{it.datum}</td>
        <td style={{ width: 110, fontSize: 10 }}>{it.wbs}</td>
        <td style={{ width: 130 }} title={it.oznaka}>{trunc(it.oznaka, 20)}</td>
        <td className="wrap" style={{ minWidth: 150, maxWidth: 260 }} title={desc}>{desc}</td>
        <td className="wrap" style={{ minWidth: 120, maxWidth: 180 }} title={it.opis_protikonta}>{it.opis_protikonta}</td>
        <td className="num" style={{ width: 120, fontWeight: 700, color: 'var(--blue)' }}>{fmtE(it.znesek)}</td>
        <td style={{ width: 200 }} onClick={e => e.stopPropagation()}>
          <StroskiWBSSelect
            it={it} idx={idx}
            wbsGroups={data.wbs_groups} wbsLabels={data.wbs_labels}
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
            {data.wbs_groups.map(g => (
              <option key={g} value={g}>{g} — {trunc(data.wbs_labels[g] || g, 30)}</option>
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

export default function DetailPanel({ wbs, data, activeTab, setActiveTab, selectedMonths, overrides, setOverrides, stroskiOverrides, setStroskiOverrides }) {
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
        <BlistDetail wbs={wbs} data={data} selectedMonths={selectedMonths} overrides={overrides} setOverrides={setOverrides} />
      </div>
      <div className={`tab-content${activeTab === 'stroski' ? ' active' : ''}`}>
        <StroskiDetail wbs={wbs} data={data} selectedMonths={selectedMonths} stroskiOverrides={stroskiOverrides} setStroskiOverrides={setStroskiOverrides} />
      </div>
    </div>
  )
}

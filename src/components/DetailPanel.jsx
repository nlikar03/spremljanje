import React from 'react'
import { fmtP, fmtE, monthLabel, trunc } from '../utils/formatters'
import { IconFileText, IconActivity } from './Icons'
import { itemKey, resolveWBS } from '../utils/compute'

function WBSSelect({ item, wbsGroups, wbsLabels, overrides, setOverrides }) {
  const current = resolveWBS(item, overrides)
  const isOverridden = itemKey(item) in overrides

  function handleChange(e) {
    const val = e.target.value
    const k = itemKey(item)
    setOverrides(prev => {
      const next = { ...prev }
      if (val === item.wbs_group) {
        delete next[k]
      } else {
        next[k] = val
      }
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

function BlistDetail({ wbs, data, selectedMonths, overrides, setOverrides }) {
  const items = data.blist_items.filter(x => x.wbs_group === wbs)
  const selM = data.blist_months.filter(m => selectedMonths.has(m))
  if (!items.length) return <div className="no-data">Ni BLIST postavk za ta WBS</div>

  const active = selM.length === 0 ? items
    : items.filter(it => selM.some(m => it.meseci[m]?.znesek !== 0 || it.meseci[m]?.kolicina !== 0))

  const overriddenCount = active.filter(it => itemKey(it) in overrides).length

  function moveAll(targetWBS) {
    setOverrides(prev => {
      const next = { ...prev }
      active.forEach(it => {
        const k = itemKey(it)
        if (targetWBS === it.wbs_group) {
          delete next[k]
        } else {
          next[k] = targetWBS
        }
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

  let totPog = 0, totObrZn = 0
  const mTots = {}
  selM.forEach(m => { mTots[m] = { kol: 0, zn: 0 } })

  const rows = active.map(it => {
    totPog += it.znesek_pc
    let rowZn = 0
    const mData = selM.map(m => {
      const md = it.meseci[m] || { kolicina: 0, znesek: 0 }
      mTots[m].kol += md.kolicina
      mTots[m].zn += md.znesek
      rowZn += md.znesek
      return md
    })
    totObrZn += rowZn
    const isOverridden = itemKey(it) in overrides

    return (
      <tr key={it.zst + '_' + it.sifra} className={isOverridden ? 'row-overridden' : ''}>
        <td style={{ width: 50 }}>{it.zst}</td>
        <td style={{ width: 65 }}>{it.sifra}</td>
        <td className="wrap" style={{ minWidth: 200, maxWidth: 340 }} title={it.opis}>{it.opis}</td>
        <td style={{ width: 34, textAlign: 'center' }}>{it.em}</td>
        <td className="num" style={{ width: 80 }}>{fmtP(it.kolicina_pc, 3)}</td>
        <td className="num" style={{ width: 90 }}>{fmtE(it.cena_pc)}</td>
        <td className="num" style={{ width: 110 }}>{fmtE(it.znesek_pc)}</td>
        {mData.map((md, i) => (
          <React.Fragment key={selM[i]}>
            <td className="num" style={{ width: 75 }}>{md.kolicina ? fmtP(md.kolicina, 3) : ''}</td>
            <td className="num" style={{ width: 110 }}>{md.znesek ? fmtE(md.znesek) : ''}</td>
          </React.Fragment>
        ))}
        <td className="num" style={{ width: 120, fontWeight: 600 }}>{rowZn ? fmtE(rowZn) : ''}</td>
        <td style={{ width: 260, padding: '2px 6px' }}>
          <WBSSelect
            item={it}
            wbsGroups={data.wbs_groups}
            wbsLabels={data.wbs_labels}
            overrides={overrides}
            setOverrides={setOverrides}
          />
        </td>
      </tr>
    )
  })

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
      <div className="dtable-wrap">
        <table className="dtable">
          <thead>
            <tr>
              <th>Z.Št</th><th>Šifra</th><th>Opis</th><th>EM</th>
              <th>Kol.PC</th><th>Cena PC</th><th>Znesek PC</th>
              {selM.map(m => <th key={m} colSpan="2">{monthLabel(m, true)}</th>)}
              <th>Skupaj obr.</th>
              <th>WBS</th>
            </tr>
            <tr>
              <th /><th /><th /><th /><th /><th /><th />
              {selM.map(m => (
                <React.Fragment key={m}>
                  <th>Kol.</th><th>Znesek</th>
                </React.Fragment>
              ))}
              <th /><th />
            </tr>
          </thead>
          <tbody>
            {rows}
            <tr className="tot">
              <td colSpan="3">SKUPAJ ({active.length}/{items.length} postavk)</td>
              <td /><td /><td />
              <td className="num">{fmtE(totPog)}</td>
              {selM.map(m => (
                <React.Fragment key={m}>
                  <td />
                  <td className="num">{fmtE(mTots[m].zn)}</td>
                </React.Fragment>
              ))}
              <td className="num">{fmtE(totObrZn)}</td>
              <td />
            </tr>
          </tbody>
        </table>
      </div>
    </>
  )
}

function StroskiDetail({ wbs, data, selectedMonths }) {
  const all = data.stroski_items.filter(x => x.wbs_group === wbs)
  const items = all.filter(x => selectedMonths.has(x.mesec))
  if (!all.length) return <div className="no-data">Ni SAP stroškov za ta WBS</div>
  if (!items.length) return <div className="no-data">Ni SAP stroškov za izbrana obdobja (skupaj {all.length} vrstic)</div>

  let tot = 0
  const rows = items.map((it, i) => {
    tot += it.znesek
    const desc = it.tekst || it.oznaka || ''
    return (
      <tr key={i}>
        <td style={{ width: 90 }}>{it.datum}</td>
        <td style={{ width: 120, fontSize: 10 }}>{it.wbs}</td>
        <td style={{ width: 140 }} title={it.oznaka}>{trunc(it.oznaka, 22)}</td>
        <td className="wrap" style={{ minWidth: 160, maxWidth: 300 }} title={desc}>{desc}</td>
        <td className="wrap" style={{ minWidth: 130, maxWidth: 200 }} title={it.opis_protikonta}>{it.opis_protikonta}</td>
        <td style={{ width: 140 }} title={it.opis_vrste}>{trunc(it.opis_vrste, 26)}</td>
        <td className="num" style={{ width: 120, fontWeight: 600 }}>{fmtE(it.znesek)}</td>
      </tr>
    )
  })

  return (
    <>
      <p style={{ fontSize: 11, color: 'var(--text-muted)', padding: '4px 8px' }}>{items.length} vrstic za izbrana obdobja</p>
      <div className="dtable-wrap">
        <table className="dtable">
          <thead>
            <tr>
              <th>Datum knj.</th><th>WBS objekt</th><th>Oznaka</th>
              <th>Tekst</th><th>Opis protikonta</th><th>Vrsta stroška</th><th>Znesek</th>
            </tr>
          </thead>
          <tbody>
            {rows}
            <tr className="tot">
              <td colSpan="6">SKUPAJ ({items.length} vrstic)</td>
              <td className="num">{fmtE(tot)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  )
}

export default function DetailPanel({ wbs, data, activeTab, setActiveTab, selectedMonths, overrides, setOverrides }) {
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
        <StroskiDetail wbs={wbs} data={data} selectedMonths={selectedMonths} />
      </div>
    </div>
  )
}

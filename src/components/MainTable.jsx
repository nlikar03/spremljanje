import React from 'react'
import { fmtP, trunc, realClass, cpiClass, cpiLabel } from '../utils/formatters'
import { IconChevronRight } from './Icons'
import DetailPanel from './DetailPanel'

function NumCell({ n, d = 2, gap = false, euro = false }) {
  const suffix = euro ? ' €' : ''
  if (n === 0) return <td className="num"><span className="muted">0,00{suffix}</span></td>
  const str = Math.abs(n).toLocaleString('sl-SI', { minimumFractionDigits: d, maximumFractionDigits: d, useGrouping: true }) + suffix
  if (n < 0) return <td className="num"><span className="neg">-{str}</span></td>
  if (gap) return <td className="num"><span className="pos">{str}</span></td>
  return <td className="num">{str}</td>
}

function RealCell({ real, width = 80 }) {
  return (
    <td style={{ width }}>
      <div style={{ fontSize: 10, textAlign: 'right', marginBottom: 2, fontFamily: 'var(--mono)', color: 'var(--text-muted)' }}>
        {real.toLocaleString('sl-SI', { maximumFractionDigits: 1 })}%
      </div>
      <div className="real-bar-wrap">
        <div className={`real-bar ${realClass(real)}`} style={{ width: `${Math.min(real, 100)}%` }} />
      </div>
    </td>
  )
}

export default function MainTable({ data, summaries, bac, expandedWBS, setExpandedWBS, activeTab, setActiveTab, selectedMonths, overrides, setOverrides }) {
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
    <div className="table-wrap">
      <table>
        <thead>
          <tr className="hdr1">
            <th colSpan="2" style={{ textAlign: 'left', width: 320 }}>WBS</th>
            <th colSpan="1">Pogodbeno</th>
            <th colSpan="2">Obračunano (EV)</th>
            <th colSpan="1">Stroški SAP (AC)</th>
            <th colSpan="3">Rezultat</th>
          </tr>
          <tr className="hdr2">
            <th style={{ width: 140 }}>WBS</th>
            <th style={{ width: 180 }}>Opis</th>
            <th style={{ width: 130 }}>Znesek PC (BAC)</th>
            <th style={{ width: 90 }}>Količina</th>
            <th style={{ width: 130 }}>Znesek</th>
            <th style={{ width: 130 }}>Znesek</th>
            <th style={{ width: 130 }}>GAP (EV−AC)</th>
            <th style={{ width: 90 }}>Realizacija</th>
            <th style={{ width: 66 }}>CPI</th>
          </tr>
        </thead>
        <tbody>
          {summaries.map(s => {
            const gap  = s.obrZn - s.strZn
            const real = s.pog > 0 ? s.obrZn / s.pog * 100 : 0
            const cpi  = s.strZn > 0 ? s.obrZn / s.strZn : null
            const exp  = expandedWBS === s.wbs

            return (
              <React.Fragment key={s.wbs}>
                <tr
                  className={`wbs-row${exp ? ' wbs-expanded' : ''}`}
                  onClick={() => toggleDetail(s.wbs)}
                >
                  <td style={{ fontWeight: 600, width: 140 }}>
                    <span className="expand-ico"><IconChevronRight /></span>
                    {s.wbs}
                  </td>
                  <td style={{ width: 180 }} title={s.label}>{trunc(s.label, 28)}</td>
                  <NumCell n={s.pog} euro />
                  <td className="num">
                    {s.obrKol
                      ? s.obrKol.toLocaleString('sl-SI', { minimumFractionDigits: 3, maximumFractionDigits: 3, useGrouping: true })
                      : <span className="muted">—</span>}
                  </td>
                  <NumCell n={s.obrZn} euro />
                  <NumCell n={s.strZn} euro />
                  <NumCell n={gap} gap euro />
                  <RealCell real={real} width={90} />
                  <td style={{ width: 60, textAlign: 'center' }}>
                    <span className={`cpi-badge ${cpiClass(cpi)}`}>{cpiLabel(cpi)}</span>
                  </td>
                </tr>
                {exp && (
                  <tr className="detail-row">
                    <td colSpan="9" style={{ padding: 0 }}>
                      <DetailPanel
                        wbs={s.wbs}
                        data={data}
                        activeTab={activeTab[s.wbs] || 'blist'}
                        setActiveTab={tab => setActiveTab(prev => ({ ...prev, [s.wbs]: tab }))}
                        selectedMonths={selectedMonths}
                        overrides={overrides}
                        setOverrides={setOverrides}
                      />
                    </td>
                  </tr>
                )}
              </React.Fragment>
            )
          })}
          <tr className="total-row">
            <td colSpan="2">SKUPAJ</td>
            <NumCell n={totPog} euro />
            <td className="num"><span className="muted">—</span></td>
            <NumCell n={totObrZn} euro />
            <NumCell n={totStrZn} euro />
            <NumCell n={totGap} gap euro />
            <RealCell real={totReal} width={90} />
            <td style={{ textAlign: 'center' }}>
              <span className={`cpi-badge ${cpiClass(totCpi)}`}>{cpiLabel(totCpi)}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

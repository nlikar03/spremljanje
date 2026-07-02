import { monthLabel, trunc, fmtK } from '../utils/formatters'
import { IconCalendar, IconDollarSign, IconLayers, IconInfo, IconTarget, IconCheck } from './Icons'

function SidebarHeading({ icon, children }) {
  return (
    <div className="sidebar-heading">
      {icon}
      {children}
    </div>
  )
}

export default function Sidebar({ data, filtered, precomputed, selectedMonths, setSelectedMonths, overrides, setOverrides, stroskiOverrides, setStroskiOverrides }) {
  const { topSuppliers, maxSupplier, topVrste } = filtered
  const { allMonthlyEV = {}, allMonthlyAC = {} } = precomputed || {}
  const vrstaTotal = topVrste.reduce((s, [, v]) => s + v, 0)

  const byYear = {}
  data.months.forEach(m => {
    const yr = m.split('-')[0]
    if (!byYear[yr]) byYear[yr] = []
    byYear[yr].push(m)
  })

  // Scale bars to the biggest single-stream value across all months
  const maxVal = Math.max(
    1,
    ...data.months.map(m => Math.max(allMonthlyEV[m] || 0, allMonthlyAC[m] || 0))
  )

  const selCount = data.months.filter(m => selectedMonths.has(m)).length

  function toggle(m) {
    setSelectedMonths(prev => {
      const next = new Set(prev)
      next.has(m) ? next.delete(m) : next.add(m)
      return next
    })
  }

  return (
    <div className="sidebar">
      <div className="sidebar-section">
        <SidebarHeading icon={<IconCalendar size={12} />}>
          Obračunska obdobja
          <span className="mp-count">{selCount}/{data.months.length}</span>
        </SidebarHeading>
        <div className="sidebar-btn-row">
          <button className="btn-sm" onClick={() => setSelectedMonths(new Set(data.months))}>Vse</button>
          <button className="btn-sm grey" onClick={() => setSelectedMonths(new Set())}>Nič</button>
        </div>

        <div className="mp-legend">
          <span><i className="mp-swatch mp-swatch-ev" /> Obračunano</span>
          <span><i className="mp-swatch mp-swatch-ac" /> Stroški</span>
        </div>

        {Object.keys(byYear).sort().map(yr => (
          <div className="mp-year" key={yr}>
            <div className="year-label">{yr}</div>
            {byYear[yr].map(m => {
              const ev = allMonthlyEV[m] || 0
              const ac = allMonthlyAC[m] || 0
              const sel = selectedMonths.has(m)
              return (
                <button
                  key={m}
                  type="button"
                  className={`mp-row${sel ? ' mp-row-sel' : ''}`}
                  onClick={() => toggle(m)}
                >
                  <span className="mp-check">{sel && <IconCheck />}</span>
                  <span className="mp-name">{monthLabel(m, true)}</span>
                  <span className="mp-bars">
                    <span className="mp-bar-track">
                      <span className="mp-bar mp-bar-ev" style={{ width: `${ev / maxVal * 100}%` }} />
                    </span>
                    <span className="mp-bar-track">
                      <span className="mp-bar mp-bar-ac" style={{ width: `${ac / maxVal * 100}%` }} />
                    </span>
                  </span>
                  <span className="mp-vals">
                    <span className={`mp-val mp-val-ev${ev ? '' : ' mp-val-zero'}`}>{ev ? fmtK(ev) : '–'}</span>
                    <span className={`mp-val mp-val-ac${ac ? '' : ' mp-val-zero'}`}>{ac ? fmtK(ac) : '–'}</span>
                  </span>
                </button>
              )
            })}
          </div>
        ))}
      </div>

      <div className="sidebar-section">
        <SidebarHeading icon={<IconDollarSign size={12} />}>
          Top dobavitelji (AC)
        </SidebarHeading>
        {topSuppliers.length === 0
          ? <div className="no-data">Ni podatkov</div>
          : topSuppliers.map(([name, val]) => (
            <div className="supplier-row" key={name}>
              <div className="supplier-name" title={name}>{trunc(name, 18)}</div>
              <div className="supplier-bar-wrap">
                <div className="supplier-bar" style={{ width: `${val / maxSupplier * 100}%` }} />
              </div>
              <div className="supplier-val">
                {(val / 1000).toLocaleString('sl-SI', { maximumFractionDigits: 0 })}k
              </div>
            </div>
          ))
        }
      </div>

      <div className="sidebar-section">
        <SidebarHeading icon={<IconLayers size={12} />}>
          Vrsta stroška
        </SidebarHeading>
        {topVrste.length === 0
          ? <div className="no-data">Ni podatkov</div>
          : topVrste.map(([name, val]) => (
            <div className="vrsta-row" key={name}>
              <span className="vrsta-name" title={name}>{trunc(name, 24)}</span>
              <span className="vrsta-pct">
                {vrstaTotal > 0 ? (val / vrstaTotal * 100).toFixed(1) : '0.0'}%
              </span>
            </div>
          ))
        }
      </div>

      {(Object.keys(overrides).length > 0 || Object.keys(stroskiOverrides).length > 0) && (
        <div className="sidebar-section">
          <SidebarHeading icon={<IconTarget size={12} />}>
            Prerazporeditve
          </SidebarHeading>
          {Object.keys(overrides).length > 0 && (
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 7 }}>
              {Object.keys(overrides).length} postavk {Object.keys(overrides).length === 1 ? 'premaknjena' : 'premaknjenih'}
            </div>
          )}
          {Object.keys(stroskiOverrides).length > 0 && (
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 7 }}>
              {Object.keys(stroskiOverrides).length} stroškov {Object.keys(stroskiOverrides).length === 1 ? 'premaknjen' : 'premaknjenih'}
            </div>
          )}
          <button
            className="btn-sm"
            style={{ background: 'var(--amber)', width: '100%' }}
            onClick={() => { setOverrides({}); setStroskiOverrides({}) }}
          >
            Ponastavi vse
          </button>
        </div>
      )}

      <div className="sidebar-section">
        <SidebarHeading icon={<IconInfo size={12} />}>
          Legenda
        </SidebarHeading>
        <div className="legend-item">
          <span className="legend-dot green" />
          EV &gt; AC — ugodno
        </div>
        <div className="legend-item">
          <span className="legend-dot red" />
          AC &gt; EV — stroški presegajo
        </div>
        <hr className="legend-sep" />
        <div className="legend-item">
          <span className="mp-swatch mp-swatch-ev" />
          obračunano (BLIST / EV)
        </div>
        <div className="legend-item">
          <span className="mp-swatch mp-swatch-ac" />
          stroški (SAP / AC)
        </div>
        <hr className="legend-sep" />
        <div className="legend-item" style={{ fontSize: 10, fontWeight: 600, color: 'var(--navy)', marginBottom: 3 }}>CPI</div>
        <div className="legend-item"><span className="cpi-badge cpi-good">&gt;1.0</span>&nbsp; obr. nad stroški</div>
        <div className="legend-item"><span className="cpi-badge cpi-warn">~1.0</span>&nbsp; uravnoteženo</div>
        <div className="legend-item"><span className="cpi-badge cpi-bad">&lt;1.0</span>&nbsp; stroški presegajo</div>
      </div>
    </div>
  )
}

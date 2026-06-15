import { monthLabel, trunc } from '../utils/formatters'
import { IconCalendar, IconDollarSign, IconLayers, IconInfo, IconTarget } from './Icons'

function SidebarHeading({ icon, children }) {
  return (
    <div className="sidebar-heading">
      {icon}
      {children}
    </div>
  )
}

export default function Sidebar({ data, filtered, selectedMonths, setSelectedMonths, overrides, setOverrides }) {
  const { topSuppliers, maxSupplier, topVrste } = filtered
  const BLIST_MONTHS = new Set(data.blist_months)
  const vrstaTotal = topVrste.reduce((s, [, v]) => s + v, 0)

  const byYear = {}
  data.months.forEach(m => {
    const yr = m.split('-')[0]
    if (!byYear[yr]) byYear[yr] = []
    byYear[yr].push(m)
  })

  function toggle(m, checked) {
    setSelectedMonths(prev => {
      const next = new Set(prev)
      checked ? next.add(m) : next.delete(m)
      return next
    })
  }

  return (
    <div className="sidebar">
      <div className="sidebar-section">
        <SidebarHeading icon={<IconCalendar size={12} />}>
          Obračunska obdobja
        </SidebarHeading>
        <div className="sidebar-btn-row">
          <button className="btn-sm" onClick={() => setSelectedMonths(new Set(data.months))}>Vse</button>
          <button className="btn-sm grey" onClick={() => setSelectedMonths(new Set())}>Nič</button>
        </div>
        {Object.keys(byYear).sort().map(yr => (
          <div className="month-group" key={yr}>
            <div className="year-label">{yr}</div>
            {byYear[yr].map(m => (
              <label key={m}>
                <input
                  type="checkbox"
                  checked={selectedMonths.has(m)}
                  onChange={e => toggle(m, e.target.checked)}
                />
                {monthLabel(m)}{' '}
                <span className={`badge ${BLIST_MONTHS.has(m) ? 'badge-b' : 'badge-s'}`}>
                  {BLIST_MONTHS.has(m) ? 'B' : 'S'}
                </span>
              </label>
            ))}
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

      {Object.keys(overrides).length > 0 && (
        <div className="sidebar-section">
          <SidebarHeading icon={<IconTarget size={12} />}>
            Prerazporeditve
          </SidebarHeading>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 7 }}>
            {Object.keys(overrides).length} postavk {Object.keys(overrides).length === 1 ? 'premaknjena' : 'premaknjenih'}
          </div>
          <button
            className="btn-sm"
            style={{ background: 'var(--amber)', width: '100%' }}
            onClick={() => setOverrides({})}
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
          <span className="badge badge-b">B</span>
          mesec v BLIST
        </div>
        <div className="legend-item">
          <span className="badge badge-s">S</span>
          samo SAP
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

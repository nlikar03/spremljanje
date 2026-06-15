import { fmtM } from '../utils/formatters'

function KPICard({ label, value, sub, highlight, colorClass, cardClass }) {
  const classes = ['kpi-card', highlight && 'highlight', cardClass].filter(Boolean).join(' ')
  return (
    <div className={classes}>
      <div className="kpi-label">{label}</div>
      <div className={['kpi-value', colorClass].filter(Boolean).join(' ')}>{value}</div>
      <div className="kpi-sub">{sub}</div>
    </div>
  )
}

export default function KPIBar({ kpis, bac }) {
  if (!kpis) return null
  const { EV, AC, CPI, GAP, REAL, EAC, VAC, TCPI } = kpis

  const sl3 = n => n.toLocaleString('sl-SI', { minimumFractionDigits: 3, maximumFractionDigits: 3 })
  const sl1 = n => n.toLocaleString('sl-SI', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

  return (
    <div className="kpi-bar">
      <KPICard
        label="BAC" value={fmtM(bac)} sub="Pogodbena vrednost"
        highlight
      />
      <KPICard
        label="EV — Obračunano" value={fmtM(EV)} sub="BLIST situacije"
        colorClass="kpi-neutral"
      />
      <KPICard
        label="AC — Stroški SAP" value={fmtM(AC)} sub="Knjiženi stroški"
        colorClass="kpi-neutral"
      />
      <KPICard
        label="CPI"
        value={CPI !== null ? sl3(CPI) : '—'}
        sub="EV / AC"
        colorClass={CPI === null ? '' : CPI >= 1 ? 'kpi-pos' : 'kpi-neg'}
        cardClass={CPI === null ? '' : CPI >= 1.0 ? 'good' : CPI >= 0.8 ? 'warn' : 'bad'}
      />
      <KPICard
        label="GAP (EV − AC)"
        value={(GAP >= 0 ? '+' : '') + fmtM(GAP)}
        sub="Likvidnostni presežek"
        colorClass={GAP >= 0 ? 'kpi-pos' : 'kpi-neg'}
        cardClass={GAP >= 0 ? 'good' : 'bad'}
      />
      <KPICard
        label="Realizacija" value={sl1(REAL) + '%'} sub="EV / BAC"
        colorClass="kpi-neutral"
      />
      <KPICard
        label="EAC"
        value={EAC !== null ? fmtM(EAC) : '—'}
        sub="BAC / CPI (napoved)"
        colorClass={EAC !== null && EAC <= bac ? 'kpi-pos' : 'kpi-neutral'}
      />
      <KPICard
        label="VAC"
        value={VAC !== null ? (VAC >= 0 ? '+' : '') + fmtM(VAC) : '—'}
        sub="BAC − EAC"
        colorClass={VAC === null ? '' : VAC >= 0 ? 'kpi-pos' : 'kpi-neg'}
        cardClass={VAC === null ? '' : VAC >= 0 ? 'good' : 'bad'}
      />
      <KPICard
        label="TCPI"
        value={TCPI !== null ? sl3(TCPI) : '—'}
        sub="(BAC−EV)/(BAC−AC)"
        colorClass={TCPI === null ? '' : TCPI <= 1.0 ? 'kpi-pos' : 'kpi-neg'}
        cardClass={TCPI === null ? '' : TCPI <= 1.0 ? 'good' : TCPI <= 1.1 ? 'warn' : 'bad'}
      />
    </div>
  )
}

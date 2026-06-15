import { fmtM } from '../utils/formatters'

export default function StatusBar({ selectedMonths, data, bac }) {
  const sel = [...selectedMonths].sort()

  return (
    <div className="statusbar">
      <div className="statusbar-seg">
        <span className="statusbar-label">Obdobja</span>
        <span>{sel.length ? sel.join(', ') : 'nobeno'}</span>
      </div>
      <div className="statusbar-divider" />
      <div className="statusbar-seg">
        <span className="statusbar-label">BLIST</span>
        <span>{data.blist_items.length} postavk</span>
      </div>
      <div className="statusbar-divider" />
      <div className="statusbar-seg">
        <span className="statusbar-label">SAP</span>
        <span>{data.stroski_items.length} vrstic</span>
      </div>
      <div className="statusbar-divider" />
      <div className="statusbar-seg">
        <span className="statusbar-label">BAC</span>
        <span>{fmtM(bac)}</span>
      </div>
    </div>
  )
}

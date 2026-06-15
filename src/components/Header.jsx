import { IconBriefcase, IconCalendar, IconDatabase } from './Icons'

export default function Header() {
  const today = new Date().toLocaleDateString('sl-SI')
  return (
    <div className="header">
      <div className="header-icon">
        <IconBriefcase size={18} />
      </div>
      <div>
        <span className="header-title">Finančna uspešnost izvedbe</span>
        <span className="header-subtitle"> — NOV PROJEKT</span>
      </div>
      <div className="header-right">
        <div className="header-meta">
          <IconCalendar size={12} />
          {today}
        </div>
        <div className="header-divider" />
        <div className="header-meta">
          <IconDatabase size={12} />
          <span>BLIST + SAP</span>
        </div>
        <div className="header-tag">Stroški</div>
      </div>
    </div>
  )
}

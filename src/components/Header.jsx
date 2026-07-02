import { IconBriefcase, IconCalendar, IconDatabase, IconSun, IconMoon } from './Icons'

export default function Header({ theme, setTheme, onNewUpload }) {
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
        <div className="header-divider" />
        {onNewUpload && (
          <button onClick={onNewUpload} className="theme-toggle" title="Naloži nove datoteke" style={{ width: 'auto', padding: '0 10px', fontSize: 11 }}>
            Nov izvoz
          </button>
        )}
        <button
          onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
          className="theme-toggle"
          title={theme === 'dark' ? 'Svetla tema' : 'Temna tema'}
        >
          {theme === 'dark' ? <IconSun size={14} /> : <IconMoon size={14} />}
        </button>
      </div>
    </div>
  )
}

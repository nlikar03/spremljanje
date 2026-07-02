import { useRef, useState, useCallback } from 'react'

// Column widths persist in localStorage keyed by a table id, so a user's
// manual resize sticks across reloads. UI preference only (not report data).
const KEY = 'spremljanje.colwidths.v1'

function loadWidths() {
  try { return JSON.parse(localStorage.getItem(KEY)) || {} } catch { return {} }
}
function saveWidths(all) {
  try { localStorage.setItem(KEY, JSON.stringify(all)) } catch { /* ignore */ }
}

/**
 * useColWidths(tableId, defaults)
 *   defaults: array of numbers (px) — one per column, null/undefined = flexible (auto)
 * Returns { widths, onResizeStart(index) }
 */
export function useColWidths(tableId, defaults) {
  const [widths, setWidths] = useState(() => {
    const saved = loadWidths()[tableId]
    return saved && saved.length === defaults.length ? saved : defaults
  })
  const drag = useRef(null)

  const onMove = useCallback(e => {
    const d = drag.current
    if (!d) return
    const delta = e.clientX - d.startX
    const next = Math.max(28, d.startW + delta)
    setWidths(prev => {
      const w = [...prev]
      w[d.index] = next
      return w
    })
  }, [])

  const onUp = useCallback(() => {
    if (drag.current) {
      setWidths(prev => {
        const all = loadWidths()
        all[tableId] = prev
        saveWidths(all)
        return prev
      })
    }
    drag.current = null
    document.body.classList.remove('col-resizing')
    window.removeEventListener('mousemove', onMove)
    window.removeEventListener('mouseup', onUp)
  }, [onMove, tableId])

  const onResizeStart = useCallback((index, e) => {
    e.preventDefault()
    e.stopPropagation()
    const cur = widths[index] || e.target.closest('th').offsetWidth
    drag.current = { index, startX: e.clientX, startW: cur }
    document.body.classList.add('col-resizing')
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [widths, onMove, onUp])

  return { widths, onResizeStart }
}

export function ResizableTh({ children, index, onResizeStart, ...rest }) {
  return (
    <th {...rest} className={`resizable-th${rest.className ? ' ' + rest.className : ''}`}>
      {children}
      <span
        className="col-resizer"
        onMouseDown={e => onResizeStart(index, e)}
        onClick={e => e.stopPropagation()}
      />
    </th>
  )
}

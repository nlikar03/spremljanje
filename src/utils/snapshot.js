// Persist the last-opened report + its edits to localStorage.
// Single snapshot, overwritten on each new upload. No backend.

const KEY = 'spremljanje.snapshot.v1'

export function loadSnapshot() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const s = JSON.parse(raw)
    if (!s || !s.data) return null
    return {
      data: s.data,
      overrides: s.overrides || {},
      stroskiOverrides: s.stroskiOverrides || {},
      wbsEdits: s.wbsEdits || { customGroups: [], labelOverrides: {}, deletedGroups: [] },
      selectedMonths: new Set(s.selectedMonths || []),
    }
  } catch {
    return null
  }
}

export function saveSnapshot({ data, overrides, stroskiOverrides, selectedMonths, wbsEdits }) {
  if (!data) return
  try {
    localStorage.setItem(KEY, JSON.stringify({
      data,
      overrides,
      stroskiOverrides,
      wbsEdits,
      selectedMonths: [...selectedMonths],
      savedAt: Date.now(),
    }))
  } catch (e) {
    // Quota exceeded or serialization error — degrade quietly, app still works.
    console.warn('Snapshot ni bil shranjen:', e?.name || e)
  }
}

export function clearSnapshot() {
  try { localStorage.removeItem(KEY) } catch { /* ignore */ }
}

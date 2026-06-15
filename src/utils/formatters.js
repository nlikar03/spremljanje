export const MONTH_NAMES = {
  '01':'jan','02':'feb','03':'mar','04':'apr',
  '05':'maj','06':'jun','07':'jul','08':'avg',
  '09':'sep','10':'okt','11':'nov','12':'dec',
}

export function monthLabel(m, short = false) {
  const [yr, mo] = m.split('-')
  return short ? MONTH_NAMES[mo] + ' ' + yr.slice(2) : MONTH_NAMES[mo] + ' ' + yr
}

export function fmtM(n) {
  if (Math.abs(n) >= 1e6)
    return (n / 1e6).toLocaleString('sl-SI', { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: true }) + ' M€'
  return n.toLocaleString('sl-SI', { minimumFractionDigits: 0, maximumFractionDigits: 0, useGrouping: true }) + ' €'
}

export function fmtP(n, d = 2) {
  return n.toLocaleString('sl-SI', { minimumFractionDigits: d, maximumFractionDigits: d, useGrouping: true })
}

export function fmtE(n, d = 2) {
  return n.toLocaleString('sl-SI', { minimumFractionDigits: d, maximumFractionDigits: d, useGrouping: true }) + ' €'
}

export function trunc(s, n = 55) {
  return s && s.length > n ? s.slice(0, n) + '…' : (s || '')
}

export function realClass(pct) {
  return pct >= 70 ? 'green' : pct >= 25 ? 'yellow' : 'red'
}

export function cpiClass(cpi) {
  return cpi === null ? 'cpi-na' : cpi >= 1.0 ? 'cpi-good' : cpi >= 0.8 ? 'cpi-warn' : 'cpi-bad'
}

export function cpiLabel(cpi) {
  return cpi === null ? 'n/a' : cpi.toLocaleString('sl-SI', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

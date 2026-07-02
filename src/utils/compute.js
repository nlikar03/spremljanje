export function itemKey(it) {
  return it.zst + '\x00' + it.sifra
}

export function resolveWBS(it, overrides) {
  const v = overrides[itemKey(it)]
  return v !== undefined ? v : it.wbs_group
}

// Stroski rows have no natural unique id, so include the row index to keep
// otherwise-identical rows independently movable.
export function stroskiKey(it, idx) {
  return [idx, it.wbs, it.datum, it.oznaka, it.znesek, it.tekst].join('\x00')
}

export function resolveStroskiWBS(it, idx, stroskiOverrides) {
  const v = stroskiOverrides[stroskiKey(it, idx)]
  return v !== undefined ? v : it.wbs_group
}

export function precompute(data) {
  const BAC = data.blist_items.reduce((s, x) => s + x.znesek_pc, 0)

  const allMonthlyEV = {}, allMonthlyAC = {}
  data.months.forEach(m => { allMonthlyEV[m] = 0; allMonthlyAC[m] = 0 })
  data.blist_items.forEach(item => {
    Object.entries(item.meseci).forEach(([m, md]) => {
      if (allMonthlyEV[m] !== undefined) allMonthlyEV[m] += md.znesek
    })
  })
  data.stroski_items.forEach(item => {
    if (allMonthlyAC[item.mesec] !== undefined) allMonthlyAC[item.mesec] += item.znesek
  })

  let _cumEV = 0, _cumAC = 0
  const cumEV = {}, cumAC = {}
  data.months.forEach(m => {
    _cumEV += allMonthlyEV[m] || 0
    _cumAC += allMonthlyAC[m] || 0
    cumEV[m] = _cumEV
    cumAC[m] = _cumAC
  })

  const wbsBACmap = {}, wbsEVtotal = {}
  data.blist_items.forEach(it => {
    wbsBACmap[it.wbs_group] = (wbsBACmap[it.wbs_group] || 0) + it.znesek_pc
    Object.values(it.meseci).forEach(md => {
      wbsEVtotal[it.wbs_group] = (wbsEVtotal[it.wbs_group] || 0) + md.znesek
    })
  })

  const supplierTotals = {}
  data.stroski_items.forEach(it => {
    const k = it.oznaka || 'Neznano'
    supplierTotals[k] = (supplierTotals[k] || 0) + it.znesek
  })
  const topSuppliers = Object.entries(supplierTotals).sort((a, b) => b[1] - a[1]).slice(0, 8)
  const maxSupplier = topSuppliers[0]?.[1] || 1

  const vrstaTotals = {}
  data.stroski_items.forEach(it => {
    const k = (it.opis_vrste || '').trim() || 'Neznano'
    if (k !== 'nan') vrstaTotals[k] = (vrstaTotals[k] || 0) + it.znesek
  })
  const topVrste = Object.entries(vrstaTotals)
    .filter(([k]) => k && k !== 'nan')
    .sort((a, b) => b[1] - a[1])
    .slice(0, 7)

  return { BAC, allMonthlyEV, allMonthlyAC, cumEV, cumAC, wbsBACmap, wbsEVtotal, topSuppliers, maxSupplier, topVrste }
}

export function computeSummaries(data, selectedMonths, overrides = {}, stroskiOverrides = {}) {
  const groups = {}
  for (const g of data.wbs_groups) {
    groups[g] = { wbs: g, label: data.wbs_labels[g] || g, pog: 0, obrKol: 0, obrZn: 0, strZn: 0 }
  }
  data.blist_items.forEach(it => {
    const wbs = resolveWBS(it, overrides)
    const g = groups[wbs]; if (!g) return
    g.pog += it.znesek_pc
    Object.entries(it.meseci).forEach(([m, md]) => {
      if (selectedMonths.has(m)) { g.obrKol += md.kolicina; g.obrZn += md.znesek }
    })
  })
  data.stroski_items.forEach((it, i) => {
    const wbs = resolveStroskiWBS(it, i, stroskiOverrides)
    const g = groups[wbs]; if (!g) return
    if (selectedMonths.has(it.mesec)) g.strZn += it.znesek
  })
  return Object.values(groups)
}

export function computeFiltered(data, selectedMonths, overrides = {}) {
  const months = [...selectedMonths].sort()

  const monthlyEV = {}, monthlyAC = {}
  months.forEach(m => { monthlyEV[m] = 0; monthlyAC[m] = 0 })
  data.blist_items.forEach(it => {
    months.forEach(m => {
      if (it.meseci[m]) monthlyEV[m] += it.meseci[m].znesek
    })
  })
  data.stroski_items.forEach(it => {
    if (selectedMonths.has(it.mesec)) monthlyAC[it.mesec] = (monthlyAC[it.mesec] || 0) + it.znesek
  })

  let _cumEV = 0, _cumAC = 0
  const cumEV = {}, cumAC = {}
  months.forEach(m => {
    _cumEV += monthlyEV[m] || 0
    _cumAC += monthlyAC[m] || 0
    cumEV[m] = _cumEV
    cumAC[m] = _cumAC
  })

  const wbsEVfiltered = {}
  data.blist_items.forEach(it => {
    const wbs = resolveWBS(it, overrides)
    months.forEach(m => {
      if (it.meseci[m]) {
        wbsEVfiltered[wbs] = (wbsEVfiltered[wbs] || 0) + it.meseci[m].znesek
      }
    })
  })

  const supplierTotals = {}
  data.stroski_items.forEach(it => {
    if (!selectedMonths.has(it.mesec)) return
    const k = it.oznaka || 'Neznano'
    supplierTotals[k] = (supplierTotals[k] || 0) + it.znesek
  })
  const topSuppliers = Object.entries(supplierTotals).sort((a, b) => b[1] - a[1]).slice(0, 8)
  const maxSupplier = topSuppliers[0]?.[1] || 1

  const vrstaTotals = {}
  data.stroski_items.forEach(it => {
    if (!selectedMonths.has(it.mesec)) return
    const k = (it.opis_vrste || '').trim() || 'Neznano'
    if (k !== 'nan') vrstaTotals[k] = (vrstaTotals[k] || 0) + it.znesek
  })
  const topVrste = Object.entries(vrstaTotals)
    .filter(([k]) => k && k !== 'nan')
    .sort((a, b) => b[1] - a[1])
    .slice(0, 7)

  return { months, monthlyEV, monthlyAC, cumEV, cumAC, wbsEVfiltered, topSuppliers, maxSupplier, topVrste }
}

export function computeKPIs(summaries, BAC) {
  const EV = summaries.reduce((s, x) => s + x.obrZn, 0)
  const AC = summaries.reduce((s, x) => s + x.strZn, 0)
  const CPI = AC > 0 ? EV / AC : null
  const GAP = EV - AC
  const REAL = BAC > 0 ? EV / BAC * 100 : 0
  const EAC = CPI && CPI > 0 ? BAC / CPI : null
  const VAC = EAC !== null ? BAC - EAC : null
  const TCPI = (BAC - AC) > 0 ? (BAC - EV) / (BAC - AC) : null
  return { EV, AC, CPI, GAP, REAL, EAC, VAC, TCPI }
}

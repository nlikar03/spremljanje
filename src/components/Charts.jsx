import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, Title, Tooltip, Legend, Filler,
} from 'chart.js'
import { Bar, Line } from 'react-chartjs-2'
import { monthLabel, fmtP } from '../utils/formatters'
import { IconTrendingUp, IconBarChart, IconTarget } from './Icons'

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, Filler)

const tickCb = v => v >= 1e6 ? (v / 1e6).toFixed(1) + 'M' : v >= 1e3 ? (v / 1e3).toFixed(0) + 'k' : v
const ttLabel = ctx => ' ' + fmtP(ctx.raw) + ' €'

const commonOpts = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: {
        font: { size: 10, family: "'Inter', sans-serif" },
        boxWidth: 10,
        boxHeight: 10,
        padding: 14,
        color: '#7d8590',
      },
    },
    tooltip: {
      backgroundColor: '#1c2230',
      borderColor: 'rgba(255,255,255,0.08)',
      borderWidth: 1,
      titleColor: '#e6edf3',
      bodyColor: '#7d8590',
      padding: 10,
      callbacks: { label: ttLabel },
    },
  },
  scales: {
    x: {
      ticks: { font: { size: 9 }, color: '#484f58' },
      grid: { color: 'rgba(255,255,255,0.04)' },
      border: { color: 'rgba(255,255,255,0.06)' },
    },
    y: {
      ticks: { font: { size: 9 }, callback: tickCb, color: '#484f58' },
      grid: { color: 'rgba(255,255,255,0.04)' },
      border: { color: 'rgba(255,255,255,0.06)' },
    },
  },
}

function ChartBox({ icon, title, note, flex, minWidth, height = 140, children }) {
  return (
    <div className="chart-box" style={{ flex, minWidth }}>
      <div className="chart-header">
        <span className="chart-header-icon">{icon}</span>
        <span className="chart-title">{title}</span>
      </div>
      <div style={{ height }}>
        {children}
      </div>
      {note && <div className="chart-note">{note}</div>}
    </div>
  )
}

export default function Charts({ data, precomputed, filtered }) {
  const { wbsBACmap } = precomputed
  const { months, monthlyEV, monthlyAC, cumEV, cumAC, wbsEVfiltered } = filtered
  const labels = months.map(m => monthLabel(m, true))

  const monthlyData = {
    labels,
    datasets: [
      {
        label: 'EV (Obračunano)',
        data: months.map(m => monthlyEV[m] || 0),
        backgroundColor: 'rgba(88,166,255,0.7)',
        borderRadius: 4,
        borderSkipped: false,
        order: 2,
      },
      {
        label: 'AC (SAP Stroški)',
        data: months.map(m => monthlyAC[m] || 0),
        backgroundColor: 'rgba(248,81,73,0.6)',
        borderRadius: 4,
        borderSkipped: false,
        order: 1,
      },
    ],
  }

  const cumulativeData = {
    labels,
    datasets: [
      {
        label: 'Kum. EV',
        data: months.map(m => cumEV[m] || 0),
        borderColor: '#58a6ff',
        backgroundColor: 'rgba(88,166,255,0.06)',
        fill: false,
        tension: 0.4,
        pointRadius: 3,
        pointBackgroundColor: '#58a6ff',
        borderWidth: 2,
      },
      {
        label: 'Kum. AC',
        data: months.map(m => cumAC[m] || 0),
        borderColor: '#f85149',
        backgroundColor: 'rgba(248,81,73,0.06)',
        fill: false,
        tension: 0.4,
        pointRadius: 3,
        pointBackgroundColor: '#f85149',
        borderWidth: 2,
      },
      {
        label: 'GAP (EV−AC)',
        data: months.map(m => (cumEV[m] || 0) - (cumAC[m] || 0)),
        borderColor: '#3fb950',
        backgroundColor: 'rgba(63,185,80,0.08)',
        fill: true,
        tension: 0.4,
        pointRadius: 2,
        borderDash: [5, 3],
        borderWidth: 1.5,
      },
    ],
  }

  const wbsGroups = data.wbs_groups.filter(g => wbsBACmap[g] > 0)
  const wbsReal = wbsGroups.map(g => {
    const bac = wbsBACmap[g] || 0
    return bac > 0 ? Math.min((wbsEVfiltered[g] || 0) / bac * 100, 100) : 0
  })
  const wbsData = {
    labels: wbsGroups.map(g => (data.wbs_labels[g] || g).replace(/\(.+\)/, '').trim().slice(0, 20)),
    datasets: [{
      label: 'Realizacija %',
      data: wbsReal,
      backgroundColor: wbsReal.map(r =>
        r >= 70 ? 'rgba(63,185,80,0.7)' : r >= 25 ? 'rgba(210,153,34,0.7)' : 'rgba(248,81,73,0.7)'
      ),
      borderRadius: 4,
      borderSkipped: false,
    }],
  }

  const wbsOpts = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1c2230',
        borderColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1,
        titleColor: '#e6edf3',
        bodyColor: '#7d8590',
        callbacks: { label: ctx => ' ' + ctx.raw.toFixed(1) + '%' },
      },
    },
    scales: {
      x: {
        min: 0,
        max: 100,
        ticks: { font: { size: 9 }, callback: v => v + '%', color: '#484f58' },
        grid: { color: 'rgba(255,255,255,0.04)' },
        border: { color: 'rgba(255,255,255,0.06)' },
      },
      y: {
        ticks: { font: { size: 9 }, color: '#7d8590' },
        grid: { display: false },
        border: { color: 'rgba(255,255,255,0.06)' },
      },
    },
  }

  const noData = months.length === 0

  return (
    <div className="charts-section">
      <ChartBox
        icon={<IconTrendingUp size={13} />}
        title="Mesečni EV vs AC"
        note={noData ? 'Ni izbranih mesecev' : null}
        flex={2} minWidth={320}
      >
        {noData
          ? <div className="no-data" style={{ height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Ni podatkov za izbor</div>
          : <Bar data={monthlyData} options={commonOpts} />}
      </ChartBox>

      <ChartBox
        icon={<IconBarChart size={13} />}
        title="Kumulativni EV vs AC"
        note={noData ? null : 'Kumulativni GAP (zeleno = EV > AC)'}
        flex={2} minWidth={320}
      >
        {noData
          ? <div className="no-data" style={{ height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Ni podatkov za izbor</div>
          : <Line data={cumulativeData} options={commonOpts} />}
      </ChartBox>

      <ChartBox
        icon={<IconTarget size={13} />}
        title="Realizacija po WBS"
        note="EV / BAC za izbrane mesece"
        flex={1.5} minWidth={240}
      >
        <Bar data={wbsData} options={wbsOpts} />
      </ChartBox>
    </div>
  )
}

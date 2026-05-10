import { calcPnL } from '../utils.js'

export default function StatsBar({ trades, prices }) {
  const open   = trades.filter(t => t.situation === 'open')
  const closed = trades.filter(t => t.situation === 'closed')

  const closedWithPnl = closed.filter(t => t.frozenPnl != null)
  const wins  = closedWithPnl.filter(t => t.frozenPnl > 0).length
  const losses = closedWithPnl.filter(t => t.frozenPnl <= 0).length
  const winRate = closedWithPnl.length > 0
    ? ((wins / closedWithPnl.length) * 100).toFixed(0) + '%' : '—'

  const totalPnl = closedWithPnl.reduce((s, t) => s + t.frozenPnl, 0)
  const avgPnl   = closedWithPnl.length > 0
    ? (totalPnl / closedWithPnl.length).toFixed(2) : null

  const openExposure = open.length

  return (
    <div style={styles.bar}>
      <StatCard label="Open" value={openExposure} color="#f0b90b" />
      <StatCard label="Win Rate" value={winRate}
        color={wins > losses ? '#0ecb81' : wins < losses ? '#f6465d' : '#848e9c'} />
      <StatCard label="Avg PnL"
        value={avgPnl != null ? `${avgPnl > 0 ? '+' : ''}${avgPnl}%` : '—'}
        color={avgPnl > 0 ? '#0ecb81' : avgPnl < 0 ? '#f6465d' : '#848e9c'} />
      <StatCard label="Total" value={trades.length} color="#848e9c" />
    </div>
  )
}

function StatCard({ label, value, color }) {
  return (
    <div style={styles.card}>
      <span style={{...styles.value, color}}>{value}</span>
      <span style={styles.label}>{label}</span>
    </div>
  )
}

const styles = {
  bar: {
    display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginBottom:16,
  },
  card: {
    background:'#13181e', border:'1px solid #1e2530', borderRadius:12,
    padding:'10px 8px', display:'flex', flexDirection:'column', alignItems:'center', gap:3,
  },
  value: {
    fontFamily:"'Syne', sans-serif", fontSize:18, fontWeight:700,
  },
  label: {
    fontSize:10, color:'#4e5866', letterSpacing:0.8,
  },
}

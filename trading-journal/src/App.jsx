import { useState, useMemo } from 'react'
import { useStorage } from './hooks/useStorage.js'
import { useBinancePrices } from './hooks/useBinancePrices.js'
import { calcPnL } from './utils.js'
import QuickAdd from './components/QuickAdd.jsx'
import TradeCard from './components/TradeCard.jsx'
import StatsBar from './components/StatsBar.jsx'
import EditModal from './components/EditModal.jsx'

const FILTERS = ['all', 'open', 'closed', 'long', 'short']

export default function App() {
  const [trades, setTrades]     = useStorage('fj_trades_v2', [])
  const [showAdd, setShowAdd]   = useState(false)
  const [editTrade, setEditTrade] = useState(null)
  const [filter, setFilter]     = useState('all')
  const [search, setSearch]     = useState('')
  const [sortBy, setSortBy]     = useState('date')   // date | pnl | coin

  // Gather open symbols for live price fetching
  const openSymbols = useMemo(
    () => trades.filter(t => t.situation === 'open').map(t => t.coin),
    [trades]
  )
  const { prices, loading: priceLoading } = useBinancePrices(openSymbols)

  // Filtered + sorted trades
  const visible = useMemo(() => {
    let list = [...trades]

    // Filter
    if (filter === 'open')   list = list.filter(t => t.situation === 'open')
    if (filter === 'closed') list = list.filter(t => t.situation === 'closed')
    if (filter === 'long')   list = list.filter(t => t.direction === 'LONG')
    if (filter === 'short')  list = list.filter(t => t.direction === 'SHORT')

    // Search
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(t =>
        t.coin.toLowerCase().includes(q) ||
        (t.reason || '').toLowerCase().includes(q)
      )
    }

    // Sort
    if (sortBy === 'date') list.sort((a,b) => new Date(b.date) - new Date(a.date))
    if (sortBy === 'coin') list.sort((a,b) => a.coin.localeCompare(b.coin))
    if (sortBy === 'pnl')  list.sort((a,b) => {
      const pa = a.situation === 'closed'
        ? a.frozenPnl
        : calcPnL(prices[a.coin], a.entry, a.direction)
      const pb = b.situation === 'closed'
        ? b.frozenPnl
        : calcPnL(prices[b.coin], b.entry, b.direction)
      return (pb ?? -999) - (pa ?? -999)
    })

    return list
  }, [trades, filter, search, sortBy, prices])

  // Actions
  const addTrade   = t  => setTrades(prev => [t, ...prev])
  const deleteTrade = id => setTrades(prev => prev.filter(t => t.id !== id))
  const closeTrade  = id => {
    setTrades(prev => prev.map(t => {
      if (t.id !== id) return t
      const curPrice = prices[t.coin] || t.curPrice
      const pnl      = calcPnL(curPrice, t.entry, t.direction)
      return { ...t, situation:'closed', frozenPnl: pnl, frozenPrice: curPrice }
    }))
  }
  const saveTrade = updated => {
    setTrades(prev => prev.map(t => t.id === updated.id ? updated : t))
  }

  const exportCSV = () => {
    const headers = ['Date','Coin','Direction','Entry','SL','Situation','Frozen PnL','Reason']
    const rows    = trades.map(t => [
      t.date, t.coin, t.direction, t.entry, t.sl || '',
      t.situation, t.frozenPnl != null ? t.frozenPnl.toFixed(2) : '',
      `"${(t.reason||'').replace(/"/g,'""')}"`
    ])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const a   = document.createElement('a')
    a.href    = 'data:text/csv,' + encodeURIComponent(csv)
    a.download = 'trades.csv'
    a.click()
  }

  return (
    <div style={styles.root}>
      {/* Top bar */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={styles.logo}>FJ</span>
          <div>
            <div style={styles.appName}>Futures Journal</div>
            <div style={styles.subline}>
              {priceLoading
                ? <span style={styles.refreshing}>↻ refreshing</span>
                : <span style={styles.live}>● live prices</span>}
            </div>
          </div>
        </div>
        <div style={styles.headerRight}>
          <button style={styles.iconBtn} onClick={exportCSV} title="Export CSV">↓</button>
          <button style={styles.addBtn} onClick={() => setShowAdd(true)}>
            <span style={styles.plus}>+</span> Trade
          </button>
        </div>
      </header>

      <main style={styles.main}>
        <StatsBar trades={trades} prices={prices} />

        {/* Search + sort */}
        <div style={styles.controls}>
          <input
            style={styles.searchInput}
            placeholder="Search coin or reason…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select style={styles.sortSelect} value={sortBy}
            onChange={e => setSortBy(e.target.value)}>
            <option value="date">Latest</option>
            <option value="pnl">PnL</option>
            <option value="coin">Coin</option>
          </select>
        </div>

        {/* Filter pills */}
        <div style={styles.filterRow}>
          {FILTERS.map(f => (
            <button key={f} style={{...styles.filterBtn, ...(filter===f ? styles.filterBtnActive : {})}}
              onClick={() => setFilter(f)}>
              {f === 'all'
                ? `All (${trades.length})`
                : f === 'open'
                  ? `Open (${trades.filter(t=>t.situation==='open').length})`
                  : f === 'closed'
                    ? `Closed (${trades.filter(t=>t.situation==='closed').length})`
                    : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Trade list */}
        {visible.length === 0 ? (
          <div style={styles.empty}>
            <div style={styles.emptyIcon}>📭</div>
            <p style={styles.emptyText}>
              {trades.length === 0
                ? 'No trades yet. Tap + Trade to publish your first.'
                : 'No trades match this filter.'}
            </p>
          </div>
        ) : (
          <div style={styles.list}>
            {visible.map(trade => (
              <TradeCard
                key={trade.id}
                trade={trade}
                livePrice={prices[trade.coin]}
                onClose={closeTrade}
                onDelete={deleteTrade}
                onEdit={setEditTrade}
              />
            ))}
          </div>
        )}
      </main>

      {showAdd && (
        <QuickAdd onAdd={addTrade} onClose={() => setShowAdd(false)} />
      )}
      {editTrade && (
        <EditModal trade={editTrade} onSave={saveTrade} onClose={() => setEditTrade(null)} />
      )}
    </div>
  )
}

const styles = {
  root: {
    minHeight:'100dvh',
    background:'#0b0e11',
    maxWidth:600,
    margin:'0 auto',
  },
  header: {
    display:'flex', justifyContent:'space-between', alignItems:'center',
    padding:'16px 16px 12px',
    borderBottom:'1px solid #1e2530',
    position:'sticky', top:0,
    background:'rgba(11,14,17,0.92)',
    backdropFilter:'blur(12px)',
    zIndex:50,
  },
  headerLeft: { display:'flex', alignItems:'center', gap:10 },
  logo: {
    width:36, height:36, background:'#f0b90b', borderRadius:10,
    display:'flex', alignItems:'center', justifyContent:'center',
    fontFamily:"'Syne', sans-serif", fontWeight:800, fontSize:15, color:'#000',
    letterSpacing:0.5, flexShrink:0,
  },
  appName: {
    fontFamily:"'Syne', sans-serif", fontWeight:700, fontSize:15, color:'#eaecef',
    letterSpacing:0.2,
  },
  subline: { fontSize:11, marginTop:1 },
  live: { color:'#0ecb81' },
  refreshing: { color:'#f0b90b' },
  headerRight: { display:'flex', gap:8, alignItems:'center' },
  iconBtn: {
    width:36, height:36, background:'#13181e', border:'1px solid #2a3340',
    borderRadius:10, color:'#848e9c', fontSize:18, display:'flex',
    alignItems:'center', justifyContent:'center',
  },
  addBtn: {
    display:'flex', alignItems:'center', gap:5,
    background:'#f0b90b', color:'#000',
    fontFamily:"'Syne', sans-serif", fontWeight:700, fontSize:14,
    padding:'8px 16px', borderRadius:10, letterSpacing:0.2,
  },
  plus: { fontSize:18, lineHeight:1 },
  main: { padding:'16px' },
  controls: {
    display:'flex', gap:8, marginBottom:10,
  },
  searchInput: {
    flex:1, background:'#13181e', border:'1px solid #2a3340', borderRadius:10,
    padding:'10px 14px', color:'#eaecef', fontSize:14,
    fontFamily:"'DM Mono', monospace",
  },
  sortSelect: {
    background:'#13181e', border:'1px solid #2a3340', borderRadius:10,
    padding:'10px 12px', color:'#848e9c', fontSize:13,
    fontFamily:"'DM Mono', monospace", cursor:'pointer',
  },
  filterRow: {
    display:'flex', gap:6, overflowX:'auto', marginBottom:14,
    paddingBottom:2,
  },
  filterBtn: {
    padding:'6px 12px', borderRadius:20, fontSize:12, fontWeight:500,
    background:'#13181e', border:'1px solid #1e2530', color:'#848e9c',
    whiteSpace:'nowrap', transition:'all .15s',
    fontFamily:"'DM Mono', monospace",
  },
  filterBtnActive: {
    background:'rgba(240,185,11,0.1)', border:'1px solid rgba(240,185,11,0.3)',
    color:'#f0b90b',
  },
  list: { display:'flex', flexDirection:'column', gap:10 },
  empty: {
    textAlign:'center', padding:'60px 20px',
  },
  emptyIcon: { fontSize:40, marginBottom:12 },
  emptyText: { color:'#4e5866', fontSize:14, lineHeight:1.6 },
}

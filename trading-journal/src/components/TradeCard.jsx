import { useState } from 'react'
import { formatPrice, formatPnL, calcPnL, fmtDate } from '../utils.js'

export default function TradeCard({ trade, livePrice, onClose, onDelete, onEdit }) {
  const [expanded, setExpanded] = useState(false)

  const isClosed = trade.situation === 'closed'
  const curPrice = isClosed ? trade.frozenPrice : (livePrice || trade.curPrice)
  const pnl = isClosed
    ? trade.frozenPnl
    : calcPnL(curPrice, trade.entry, trade.direction)

  const pnlColor = pnl == null ? '#848e9c' : pnl >= 0 ? '#0ecb81' : '#f6465d'
  const pnlBg    = pnl == null ? 'transparent'
    : pnl >= 0 ? 'rgba(14,203,129,0.08)' : 'rgba(246,70,93,0.08)'

  const dirColor = trade.direction === 'LONG' ? '#0ecb81' : '#f6465d'
  const dirBg    = trade.direction === 'LONG'
    ? 'rgba(14,203,129,0.12)' : 'rgba(246,70,93,0.12)'

  // SL distance %
  const slDist = trade.sl && trade.entry
    ? Math.abs(((trade.sl - trade.entry) / trade.entry) * 100).toFixed(2)
    : null

  return (
    <div style={{...styles.card, ...(isClosed ? styles.cardClosed : {}), ...(expanded ? styles.cardExpanded : {})}}>
      {/* Top Row */}
      <div style={styles.topRow} onClick={() => setExpanded(e => !e)}>
        <div style={styles.leftBlock}>
          <div style={styles.coinRow}>
            <span style={styles.coin}>{trade.coin}</span>
            <span style={{...styles.dirBadge, background: dirBg, color: dirColor}}>
              {trade.direction}
            </span>
            {isClosed && <span style={styles.closedBadge}>CLOSED</span>}
          </div>
          <span style={styles.date}>{fmtDate(trade.date)}</span>
        </div>
        <div style={{...styles.pnlBlock, background: pnlBg}}>
          <span style={{...styles.pnlValue, color: pnlColor}}>
            {formatPnL(pnl)}
          </span>
          <span style={styles.pnlLabel}>PnL</span>
        </div>
      </div>

      {/* Price Row */}
      <div style={styles.priceRow}>
        <PricePill label="Entry" value={formatPrice(trade.entry)} />
        <PricePill label="Now" value={formatPrice(curPrice)} live={!isClosed} />
        {trade.sl && <PricePill label="SL" value={formatPrice(trade.sl)} warn slDist={slDist} />}
      </div>

      {/* Expanded content */}
      {expanded && (
        <div style={styles.expandedSection}>
          {trade.rawEntry && (
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Entries</span>
              <span style={styles.detailValue}>{trade.rawEntry}</span>
            </div>
          )}
          {trade.reason && (
            <div style={{...styles.detailRow, flexDirection:'column', gap:4}}>
              <span style={styles.detailLabel}>Reasoning</span>
              <span style={{...styles.detailValue, color:'#eaecef', lineHeight:1.6, fontSize:13}}>
                {trade.reason}
              </span>
            </div>
          )}

          {/* Actions */}
          <div style={styles.actions}>
            {!isClosed && (
              <button style={styles.actionBtn} onClick={() => onClose(trade.id)}>
                ✓ Close Trade
              </button>
            )}
            <button style={{...styles.actionBtn, ...styles.actionBtnGhost}} onClick={() => onEdit(trade)}>
              ✎ Edit
            </button>
            <button style={{...styles.actionBtn, ...styles.actionBtnDanger}} onClick={() => onDelete(trade.id)}>
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function PricePill({ label, value, live, warn, slDist }) {
  return (
    <div style={styles.pill}>
      <span style={styles.pillLabel}>
        {label}
        {live && <span style={styles.liveDot} />}
      </span>
      <span style={{...styles.pillValue, color: warn ? '#f6465d' : undefined}}>
        {value}
        {slDist && <span style={styles.slDist}> -{slDist}%</span>}
      </span>
    </div>
  )
}

const styles = {
  card: {
    background:'#13181e', border:'1px solid #1e2530',
    borderRadius:16, padding:'14px 16px',
    animation:'slideIn .2s ease', transition:'border-color .2s',
    cursor:'pointer',
  },
  cardClosed: {
    opacity: 0.65, borderColor:'#1a1e25',
  },
  cardExpanded: {
    borderColor:'#2a3340',
  },
  topRow: {
    display:'flex', justifyContent:'space-between', alignItems:'flex-start',
    marginBottom:12,
  },
  leftBlock: {
    display:'flex', flexDirection:'column', gap:4,
  },
  coinRow: {
    display:'flex', alignItems:'center', gap:8,
  },
  coin: {
    fontFamily:"'Syne', sans-serif", fontSize:17, fontWeight:700, color:'#eaecef',
    letterSpacing:0.3,
  },
  dirBadge: {
    fontSize:11, fontWeight:600, padding:'2px 8px', borderRadius:6,
    letterSpacing:0.5,
  },
  closedBadge: {
    fontSize:10, padding:'2px 7px', borderRadius:5,
    background:'#1e2530', color:'#4e5866', letterSpacing:0.5,
  },
  date: {
    fontSize:11, color:'#4e5866',
  },
  pnlBlock: {
    display:'flex', flexDirection:'column', alignItems:'flex-end',
    padding:'6px 12px', borderRadius:10, minWidth:70, gap:1,
  },
  pnlValue: {
    fontFamily:"'Syne', sans-serif", fontSize:18, fontWeight:700, letterSpacing:-0.3,
  },
  pnlLabel: {
    fontSize:10, color:'#4e5866', letterSpacing:0.8,
  },
  priceRow: {
    display:'flex', gap:8, flexWrap:'wrap',
  },
  pill: {
    display:'flex', flexDirection:'column', gap:2,
    background:'#0b0e11', borderRadius:8, padding:'7px 10px',
    minWidth:80, flex:1,
  },
  pillLabel: {
    fontSize:10, color:'#4e5866', letterSpacing:0.8, display:'flex', alignItems:'center', gap:4,
  },
  pillValue: {
    fontSize:13, color:'#eaecef', fontWeight:500,
  },
  liveDot: {
    width:5, height:5, borderRadius:'50%', background:'#0ecb81',
    animation:'pulse-gold 2s infinite',
    display:'inline-block',
  },
  slDist: {
    fontSize:10, color:'#f6465d', opacity:0.8,
  },
  expandedSection: {
    marginTop:14, paddingTop:12, borderTop:'1px solid #1e2530',
    display:'flex', flexDirection:'column', gap:10,
  },
  detailRow: {
    display:'flex', justifyContent:'space-between', alignItems:'flex-start',
  },
  detailLabel: {
    fontSize:11, color:'#4e5866', letterSpacing:0.5, textTransform:'uppercase', flexShrink:0,
  },
  detailValue: {
    fontSize:12, color:'#848e9c', textAlign:'right', maxWidth:'60%',
  },
  actions: {
    display:'flex', gap:8, marginTop:4,
  },
  actionBtn: {
    flex:1, padding:'9px 0', borderRadius:8, fontSize:13, fontWeight:600,
    background:'rgba(240,185,11,0.1)', color:'#f0b90b',
    border:'1px solid rgba(240,185,11,0.25)', fontFamily:"'DM Mono', monospace",
    transition:'all .15s',
  },
  actionBtnGhost: {
    background:'#0b0e11', color:'#848e9c', border:'1px solid #2a3340', flex:0.5,
  },
  actionBtnDanger: {
    background:'rgba(246,70,93,0.08)', color:'#f6465d',
    border:'1px solid rgba(246,70,93,0.2)', flex:0.3,
  },
}

import { useState } from 'react'
import { parseCommand, calcWeightedEntry, newId } from '../utils.js'
import { fetchSinglePrice as fetchPrice } from '../hooks/useBinancePrices.js'

const FIELD_INFO = {
  coin:      { label: 'Coin', placeholder: 'BTCUSDT', hint: 'e.g. ETHUSDT' },
  direction: { label: 'Direction', type: 'toggle' },
  rawEntry:  { label: 'Entry Levels', placeholder: '68000(60%), 67500(40%)', hint: 'Price(%), ... or just price' },
  sl:        { label: 'Stop Loss', placeholder: '66000', hint: 'Price level' },
  reason:    { label: 'Reason / Notes', placeholder: '4H demand zone, RSI divergence…', hint: '', multiline: true },
}

export default function QuickAdd({ onAdd, onClose }) {
  const [mode, setMode] = useState('quick')   // 'quick' | 'form'
  const [cmd, setCmd] = useState('')
  const [form, setForm] = useState({ coin:'', direction:'LONG', rawEntry:'', sl:'', reason:'' })
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const [parsed, setParsed] = useState(null)

  // Live parse preview
  const handleCmdChange = (v) => {
    setCmd(v)
    setErr('')
    if (v.includes('|')) {
      try { setParsed(parseCommand(v)) } catch { setParsed(null) }
    } else { setParsed(null) }
  }

  const submit = async () => {
    setLoading(true)
    setErr('')
    try {
      let data
      if (mode === 'quick') {
        if (!cmd.trim()) { setErr('Enter a command'); setLoading(false); return }
        data = parseCommand(cmd)
      } else {
        if (!form.coin) { setErr('Coin is required'); setLoading(false); return }
        data = {
          coin:      form.coin.toUpperCase().trim(),
          direction: form.direction,
          rawEntry:  form.rawEntry,
          entry:     calcWeightedEntry(form.rawEntry),
          sl:        parseFloat(form.sl) || '',
          reason:    form.reason,
        }
      }
      if (!data.coin) { setErr('Could not parse coin'); setLoading(false); return }
      const curPrice = await fetchPrice(data.coin).catch(() => null)
      const trade = {
        id:        newId(),
        date:      new Date().toISOString(),
        coin:      data.coin,
        rawEntry:  data.rawEntry,
        entry:     data.entry,
        sl:        data.sl,
        direction: data.direction,
        reason:    data.reason,
        situation: 'open',
        frozenPnl: null,
        frozenPrice: null,
        curPrice,
      }
      onAdd(trade)
      onClose()
    } catch (e) {
      setErr('Parse error: ' + e.message)
    }
    setLoading(false)
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.sheet} onClick={e => e.stopPropagation()}>
        <div style={styles.handle} />

        {/* Header */}
        <div style={styles.header}>
          <span style={styles.headerTitle}>New Trade</span>
          <div style={styles.modeToggle}>
            <button style={{...styles.modeBtn, ...(mode==='quick' ? styles.modeBtnActive : {})}}
              onClick={() => setMode('quick')}>Quick</button>
            <button style={{...styles.modeBtn, ...(mode==='form' ? styles.modeBtnActive : {})}}
              onClick={() => setMode('form')}>Form</button>
          </div>
        </div>

        {/* QUICK MODE */}
        {mode === 'quick' && (
          <div style={styles.section}>
            <div style={styles.hintBox}>
              <code style={styles.hintCode}>COIN DIR | entry(%) | SL: price | REASON: text</code>
            </div>
            <textarea
              style={styles.cmdInput}
              value={cmd}
              onChange={e => handleCmdChange(e.target.value)}
              placeholder={'ETHUSDT LONG | 2400(60%), 2350(40%) | SL: 2200 | REASON: 1H RSI div'}
              rows={3}
              autoFocus
              spellCheck={false}
            />
            {parsed && (
              <div style={styles.preview}>
                <PreviewRow label="Coin"   value={parsed.coin} gold />
                <PreviewRow label="Side"   value={parsed.direction} color={parsed.direction==='LONG'?'#0ecb81':'#f6465d'} />
                <PreviewRow label="Entry"  value={parsed.entry ? parsed.entry.toFixed(4) : '—'} />
                <PreviewRow label="SL"     value={parsed.sl || '—'} />
                {parsed.reason && <PreviewRow label="Reason" value={parsed.reason} />}
              </div>
            )}
          </div>
        )}

        {/* FORM MODE */}
        {mode === 'form' && (
          <div style={styles.section}>
            <div style={styles.formGrid}>
              <div style={styles.formRow}>
                <label style={styles.label}>Coin</label>
                <input style={styles.input} placeholder="BTCUSDT"
                  value={form.coin}
                  onChange={e => setForm(f => ({...f, coin: e.target.value.toUpperCase()}))} />
              </div>
              <div style={styles.formRow}>
                <label style={styles.label}>Direction</label>
                <div style={styles.dirRow}>
                  {['LONG','SHORT'].map(d => (
                    <button key={d}
                      style={{...styles.dirBtn,
                        ...(form.direction===d
                          ? (d==='LONG' ? styles.dirBtnLong : styles.dirBtnShort)
                          : {})}}
                      onClick={() => setForm(f => ({...f, direction: d}))}>
                      {d}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{...styles.formRow, gridColumn:'1/-1'}}>
                <label style={styles.label}>Entry Levels</label>
                <input style={styles.input} placeholder="68000(60%), 67500(40%) or just 68000"
                  value={form.rawEntry}
                  onChange={e => setForm(f => ({...f, rawEntry: e.target.value}))} />
                {form.rawEntry && (
                  <span style={styles.calcHint}>
                    Weighted avg: {calcWeightedEntry(form.rawEntry).toFixed(4)}
                  </span>
                )}
              </div>
              <div style={styles.formRow}>
                <label style={styles.label}>Stop Loss</label>
                <input style={styles.input} placeholder="66000" type="number"
                  value={form.sl}
                  onChange={e => setForm(f => ({...f, sl: e.target.value}))} />
              </div>
              <div style={{...styles.formRow, gridColumn:'1/-1'}}>
                <label style={styles.label}>Reason / Notes</label>
                <textarea style={{...styles.input, minHeight:72, resize:'vertical'}}
                  placeholder="4H demand zone, RSI divergence, BTC dominance break..."
                  value={form.reason}
                  onChange={e => setForm(f => ({...f, reason: e.target.value}))} />
              </div>
            </div>
          </div>
        )}

        {err && <div style={styles.errMsg}>{err}</div>}

        <button style={{...styles.submitBtn, opacity: loading ? 0.6 : 1}} onClick={submit} disabled={loading}>
          {loading ? 'Fetching price…' : '+ Publish Trade'}
        </button>
      </div>
    </div>
  )
}

function PreviewRow({ label, value, gold, color }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', padding:'5px 0',
      borderBottom:'1px solid #1e2530', fontSize:13 }}>
      <span style={{ color:'#848e9c' }}>{label}</span>
      <span style={{ color: color || (gold ? '#f0b90b' : '#eaecef'), fontWeight: gold ? 600 : 400 }}>{value}</span>
    </div>
  )
}

const styles = {
  overlay: {
    position:'fixed', inset:0, background:'rgba(0,0,0,0.7)',
    backdropFilter:'blur(4px)', zIndex:100,
    display:'flex', alignItems:'flex-end', justifyContent:'center',
  },
  sheet: {
    background:'#13181e', borderRadius:'20px 20px 0 0',
    padding:'0 0 32px', width:'100%', maxWidth:600,
    animation:'fadeUp .25s ease',
    maxHeight:'90dvh', overflowY:'auto',
  },
  handle: {
    width:40, height:4, background:'#2a3340', borderRadius:2,
    margin:'12px auto 0',
  },
  header: {
    display:'flex', alignItems:'center', justifyContent:'space-between',
    padding:'16px 20px 12px',
  },
  headerTitle: {
    fontFamily:"'Syne', sans-serif", fontSize:20, fontWeight:700, color:'#eaecef',
  },
  modeToggle: {
    display:'flex', background:'#0b0e11', borderRadius:8, padding:3, gap:2,
  },
  modeBtn: {
    padding:'5px 14px', borderRadius:6, fontSize:13, color:'#848e9c',
    background:'none', transition:'all .15s',
  },
  modeBtnActive: {
    background:'#1e2530', color:'#f0b90b',
  },
  section: {
    padding:'0 20px 16px',
  },
  hintBox: {
    background:'#0b0e11', borderRadius:8, padding:'8px 12px', marginBottom:10,
  },
  hintCode: {
    color:'#848e9c', fontSize:11, fontFamily:"'DM Mono', monospace", lineHeight:1.6,
  },
  cmdInput: {
    width:'100%', background:'#0b0e11', border:'1px solid #2a3340',
    borderRadius:10, padding:'12px 14px', color:'#eaecef', fontSize:14,
    fontFamily:"'DM Mono', monospace", lineHeight:1.7, resize:'none',
    transition:'border-color .15s',
  },
  preview: {
    marginTop:10, background:'#0b0e11', borderRadius:8, padding:'8px 12px',
  },
  formGrid: {
    display:'grid', gridTemplateColumns:'1fr 1fr', gap:12,
  },
  formRow: {
    display:'flex', flexDirection:'column', gap:5,
  },
  label: {
    fontSize:11, color:'#848e9c', fontWeight:500, textTransform:'uppercase', letterSpacing:0.5,
  },
  input: {
    background:'#0b0e11', border:'1px solid #2a3340', borderRadius:8,
    padding:'10px 12px', color:'#eaecef', fontSize:14,
    fontFamily:"'DM Mono', monospace", width:'100%',
  },
  calcHint: {
    fontSize:11, color:'#f0b90b', marginTop:2,
  },
  dirRow: {
    display:'flex', gap:6,
  },
  dirBtn: {
    flex:1, padding:'9px 0', borderRadius:8, fontSize:13, fontWeight:600,
    border:'1px solid #2a3340', color:'#4e5866', background:'#0b0e11',
    transition:'all .15s', fontFamily:"'DM Mono', monospace",
  },
  dirBtnLong: {
    background:'rgba(14,203,129,0.12)', border:'1px solid rgba(14,203,129,0.4)', color:'#0ecb81',
  },
  dirBtnShort: {
    background:'rgba(246,70,93,0.12)', border:'1px solid rgba(246,70,93,0.4)', color:'#f6465d',
  },
  errMsg: {
    margin:'0 20px 12px', padding:'8px 12px', background:'rgba(246,70,93,0.1)',
    border:'1px solid rgba(246,70,93,0.3)', borderRadius:8, fontSize:13, color:'#f6465d',
  },
  submitBtn: {
    display:'block', width:'calc(100% - 40px)', margin:'0 20px',
    background:'#f0b90b', color:'#000', fontFamily:"'Syne', sans-serif",
    fontWeight:700, fontSize:15, padding:'15px', borderRadius:12,
    transition:'opacity .15s, transform .1s',
    letterSpacing:0.3,
  },
}

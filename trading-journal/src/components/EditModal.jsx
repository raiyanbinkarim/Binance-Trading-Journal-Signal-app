import { useState } from 'react'
import { calcWeightedEntry } from '../utils.js'

export default function EditModal({ trade, onSave, onClose }) {
  const [form, setForm] = useState({
    coin:      trade.coin,
    direction: trade.direction,
    rawEntry:  trade.rawEntry,
    sl:        trade.sl || '',
    reason:    trade.reason || '',
  })

  const save = () => {
    onSave({
      ...trade,
      coin:      form.coin.toUpperCase().trim(),
      direction: form.direction,
      rawEntry:  form.rawEntry,
      entry:     calcWeightedEntry(form.rawEntry),
      sl:        parseFloat(form.sl) || '',
      reason:    form.reason,
    })
    onClose()
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <div style={styles.header}>
          <span style={styles.title}>Edit Trade</span>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div style={styles.fields}>
          <Field label="Coin">
            <input style={styles.input} value={form.coin}
              onChange={e => setForm(f => ({...f, coin: e.target.value.toUpperCase()}))} />
          </Field>
          <Field label="Direction">
            <div style={styles.dirRow}>
              {['LONG','SHORT'].map(d => (
                <button key={d} style={{...styles.dirBtn,
                  ...(form.direction===d ? (d==='LONG' ? styles.dLong : styles.dShort) : {})}}
                  onClick={() => setForm(f => ({...f, direction: d}))}>
                  {d}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Entry Levels">
            <input style={styles.input} value={form.rawEntry}
              onChange={e => setForm(f => ({...f, rawEntry: e.target.value}))} />
            {form.rawEntry && (
              <span style={styles.hint}>Weighted avg: {calcWeightedEntry(form.rawEntry).toFixed(4)}</span>
            )}
          </Field>
          <Field label="Stop Loss">
            <input style={styles.input} type="number" value={form.sl}
              onChange={e => setForm(f => ({...f, sl: e.target.value}))} />
          </Field>
          <Field label="Reason">
            <textarea style={{...styles.input, minHeight:72, resize:'vertical'}} value={form.reason}
              onChange={e => setForm(f => ({...f, reason: e.target.value}))} />
          </Field>
        </div>

        <div style={styles.btnRow}>
          <button style={styles.cancelBtn} onClick={onClose}>Cancel</button>
          <button style={styles.saveBtn} onClick={save}>Save Changes</button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
      <label style={{ fontSize:11, color:'#4e5866', letterSpacing:0.5, textTransform:'uppercase' }}>
        {label}
      </label>
      {children}
    </div>
  )
}

const styles = {
  overlay: {
    position:'fixed', inset:0, background:'rgba(0,0,0,0.75)',
    backdropFilter:'blur(4px)', zIndex:200,
    display:'flex', alignItems:'center', justifyContent:'center', padding:16,
  },
  modal: {
    background:'#13181e', borderRadius:16, padding:'20px',
    width:'100%', maxWidth:480, maxHeight:'90dvh', overflowY:'auto',
    border:'1px solid #2a3340',
  },
  header: {
    display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20,
  },
  title: {
    fontFamily:"'Syne', sans-serif", fontSize:18, fontWeight:700, color:'#eaecef',
  },
  closeBtn: {
    color:'#4e5866', fontSize:16, padding:'4px 8px',
  },
  fields: {
    display:'flex', flexDirection:'column', gap:14,
  },
  input: {
    background:'#0b0e11', border:'1px solid #2a3340', borderRadius:8,
    padding:'10px 12px', color:'#eaecef', fontSize:14,
    fontFamily:"'DM Mono', monospace", width:'100%',
  },
  hint: { fontSize:11, color:'#f0b90b' },
  dirRow: { display:'flex', gap:8 },
  dirBtn: {
    flex:1, padding:'9px 0', borderRadius:8, fontSize:13, fontWeight:600,
    border:'1px solid #2a3340', color:'#4e5866', background:'#0b0e11',
    fontFamily:"'DM Mono', monospace",
  },
  dLong:  { background:'rgba(14,203,129,0.1)', border:'1px solid rgba(14,203,129,0.3)', color:'#0ecb81' },
  dShort: { background:'rgba(246,70,93,0.1)', border:'1px solid rgba(246,70,93,0.3)', color:'#f6465d' },
  btnRow: {
    display:'flex', gap:8, marginTop:20,
  },
  cancelBtn: {
    flex:1, padding:'12px', borderRadius:10, background:'#0b0e11',
    color:'#848e9c', border:'1px solid #2a3340',
    fontFamily:"'DM Mono', monospace", fontSize:14,
  },
  saveBtn: {
    flex:2, padding:'12px', borderRadius:10, background:'#f0b90b',
    color:'#000', fontFamily:"'Syne', sans-serif", fontWeight:700, fontSize:14,
  },
}

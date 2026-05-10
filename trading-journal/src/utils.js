export function calcWeightedEntry(inputStr) {
  if (!inputStr) return 0
  const pattern = /([\d.]+)\s*\(\s*([\d.]+)\s*%?\s*\)/g
  let match, wSum = 0, wTotal = 0
  while ((match = pattern.exec(inputStr)) !== null) {
    const price = parseFloat(match[1])
    const pct   = parseFloat(match[2]) / 100
    wSum   += price * pct
    wTotal += pct
  }
  if (wTotal === 0) {
    // Try plain number
    const plain = parseFloat(inputStr)
    return isNaN(plain) ? 0 : plain
  }
  return wSum / wTotal
}

export function calcPnL(current, entry, direction) {
  if (!entry || entry === 0 || !current) return null
  const raw = ((current - entry) / entry) * 100
  return direction === 'SHORT' ? -raw : raw
}

export function parseCommand(raw) {
  // Format: "COIN DIRECTION | entry | SL: price | REASON: text"
  const parts = raw.split('|').map(s => s.trim())
  const p0    = (parts[0] || '').trim().split(/\s+/)
  const coin      = (p0[0] || '').toUpperCase()
  const direction = (p0[1] || 'LONG').toUpperCase()
  const rawEntry  = parts[1] || ''
  const slRaw     = (parts[2] || '').replace(/SL\s*:/i, '').trim()
  const reason    = (parts[3] || '').replace(/REASON\s*:/i, '').trim()
  const entry     = calcWeightedEntry(rawEntry)
  const sl        = parseFloat(slRaw) || ''
  return { coin, direction, rawEntry, entry, sl, reason }
}

export function formatPrice(price, decimals) {
  if (price == null || isNaN(price)) return '—'
  if (decimals !== undefined) return price.toFixed(decimals)
  if (price >= 1000) return price.toFixed(2)
  if (price >= 1)    return price.toFixed(4)
  return price.toFixed(6)
}

export function formatPnL(pnl) {
  if (pnl == null) return '—'
  const sign = pnl >= 0 ? '+' : ''
  return `${sign}${pnl.toFixed(2)}%`
}

export function fmtDate(iso) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'2-digit',
    hour:'2-digit', minute:'2-digit', hour12: false })
}

export function newId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

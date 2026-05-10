import { useState, useEffect, useCallback, useRef } from 'react'

const CACHE = {}
const REFRESH_MS = 8000

export function useBinancePrices(symbols) {
  const [prices, setPrices] = useState({})
  const [loading, setLoading] = useState(false)
  const timerRef = useRef(null)

  const fetchPrices = useCallback(async () => {
    if (!symbols || symbols.length === 0) return
    const unique = [...new Set(symbols.map(s => s.toUpperCase()))]
    setLoading(true)
    try {
      const results = await Promise.allSettled(
        unique.map(sym =>
          fetch(`https://fapi.binance.com/fapi/v1/premiumIndex?symbol=${sym}`)
            .then(r => r.json())
            .then(d => ({ sym, price: parseFloat(d.markPrice) }))
        )
      )
      const updated = {}
      results.forEach(r => {
        if (r.status === 'fulfilled' && !isNaN(r.value.price)) {
          updated[r.value.sym] = r.value.price
          CACHE[r.value.sym] = r.value.price
        }
      })
      setPrices(prev => ({ ...prev, ...updated }))
    } catch (_) {}
    setLoading(false)
  }, [symbols?.join(',')])

  useEffect(() => {
    fetchPrices()
    timerRef.current = setInterval(fetchPrices, REFRESH_MS)
    return () => clearInterval(timerRef.current)
  }, [fetchPrices])

  return { prices, loading, refresh: fetchPrices }
}

export async function fetchSinglePrice(symbol) {
  try {
    const r = await fetch(`https://fapi.binance.com/fapi/v1/premiumIndex?symbol=${symbol.toUpperCase()}`)
    const d = await r.json()
    return parseFloat(d.markPrice) || null
  } catch {
    return null
  }
}

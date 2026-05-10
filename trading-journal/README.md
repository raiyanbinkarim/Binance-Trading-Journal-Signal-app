# Futures Trading Journal

Mobile-first trading journal for Binance USD-M Futures.
Dark UI · Live mark prices · Weighted entries · Local storage

---

## Deploy to Netlify (easiest — 2 minutes)

1. Go to https://app.netlify.com → "Add new site" → "Import an existing project"
2. Connect your GitHub account and push this folder as a repo:
   ```
   git init
   git add .
   git commit -m "init"
   gh repo create futures-journal --public --push --source=.
   ```
3. In Netlify: select the repo, build command is `npm run build`, publish dir is `dist`
4. Click **Deploy** — you'll get a URL like `https://your-name.netlify.app`

---

## Deploy to Vercel (alternative)

```bash
npm install -g vercel
vercel
```
Follow the prompts. Done.

---

## Local development

```bash
npm install
npm run dev
```
Opens at http://localhost:5173

---

## Usage

**Quick command (fastest on mobile):**
```
ETHUSDT LONG | 2400(60%), 2350(40%) | SL: 2200 | REASON: 1H RSI divergence
```

**Form mode:** tap + Trade → switch to Form tab for guided input.

**Closing a trade:** tap any trade card → expand → "✓ Close Trade" — freezes PnL at that moment.

**Prices:** auto-refresh every 8 seconds from Binance public API (no API key needed).

**Data:** stored in your browser's localStorage. Use the ↓ export button to save a CSV backup.

---

## Notes

- No backend, no account, no API key required
- All data lives in your browser (localStorage)
- Export CSV regularly as a backup
- Works on any device with a browser — just open your Netlify/Vercel URL

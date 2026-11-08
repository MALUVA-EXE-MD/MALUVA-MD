'use client'
import { useEffect, useState } from 'react'

const card = { background: '#1d1b36', border: '1px solid #34306a', borderRadius: 18, padding: 18, marginBottom: 16 }

export default function Home() {
  const [servers, setServers] = useState([])
  const [server, setServer] = useState('')
  const [number, setNumber] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  async function load() {
    try {
      const r = await fetch('/api/servers', { cache: 'no-store' })
      setServers(await r.json())
    } catch {}
  }
  useEffect(() => { load(); const t = setInterval(load, 15000); return () => clearInterval(t) }, [])

  const sel = servers.find((s) => String(s.id) === server)

  async function submit(e) {
    e.preventDefault()
    if (server === '') return setError('Chagua seva kwanza')
    setLoading(true); setError(''); setCode(''); setCopied(false)
    try {
      const r = await fetch('/api/pair', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ number, server }),
      })
      const d = await r.json()
      if (!r.ok) setError(d.error || 'Kuna tatizo')
      else setCode(d.code)
    } catch { setError('Mtandao una tatizo, jaribu tena') }
    setLoading(false); load()
  }

  return (
    <main style={{ maxWidth: 460, margin: '0 auto', padding: '32px 16px' }}>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ width: 84, height: 84, margin: '0 auto 12px', borderRadius: '50%', background: 'linear-gradient(135deg,#667eea,#764ba2)', display: 'grid', placeItems: 'center', fontSize: 38 }}>⚡</div>
        <h1 style={{ margin: 0, fontSize: 30, fontStyle: 'italic', color: '#8c93ff' }}>✦ MALUVA-MD ✦</h1>
        <p style={{ color: '#aaa8cc', marginTop: 6 }}>Premium Pairing Code Generator</p>
      </div>

      <div style={card}>
        <div style={{ fontWeight: 700, marginBottom: 10 }}>🖥 Chagua Seva</div>
        <select
          value={server}
          onChange={(e) => setServer(e.target.value)}
          style={{ width: '100%', padding: 14, borderRadius: 12, border: '1px solid #34306a', background: '#2a2850', color: '#fff', fontSize: 16 }}
        >
          <option value="">-- Select --</option>
          {servers.map((s) => (
            <option key={s.id} value={s.id} disabled={!s.online || s.registered >= s.limit}>
              {s.name} {s.online ? `(${s.registered}/${s.limit})` : '(offline)'}
            </option>
          ))}
        </select>
        <div style={{ display: 'flex', gap: 18, marginTop: 10, color: '#aaa8cc', fontSize: 14 }}>
          <span>🟢 Active: {sel ? sel.active : '--'}</span>
          <span>👥 Limit: {sel ? `${sel.registered}/${sel.limit}` : '--/50'}</span>
        </div>
      </div>

      <form onSubmit={submit} style={card}>
        <div style={{ fontWeight: 700, marginBottom: 10 }}>📱 WhatsApp Number</div>
        <input
          value={number}
          onChange={(e) => setNumber(e.target.value)}
          placeholder="255xxxxxxxxx"
          inputMode="numeric"
          required
          style={{ width: '100%', boxSizing: 'border-box', padding: 14, borderRadius: 12, border: '1px solid #34306a', background: '#2a2850', color: '#fff', fontSize: 16 }}
        />
        <p style={{ color: '#aaa8cc', fontSize: 13 }}>💡 Weka code ya nchi, bila + (mfano 255 kwa Tanzania)</p>
        <button
          disabled={loading}
          style={{ width: '100%', padding: 15, borderRadius: 14, border: 0, background: 'linear-gradient(90deg,#667eea,#764ba2)', color: '#fff', fontSize: 17, fontWeight: 700, opacity: loading ? 0.6 : 1 }}
        >
          {loading ? 'Inatengeneza...' : '🔑 Generate Pair Code'}
        </button>
      </form>

      <div style={{ ...card, textAlign: 'center' }}>
        {error && <p style={{ color: '#ff7b7b', margin: 0 }}>{error}</p>}
        {!error && !code && <p style={{ color: '#8c8aa8', margin: 0 }}>Code yako itaonekana hapa</p>}
        {code && (
          <>
            <div style={{ fontSize: 36, letterSpacing: 5, fontWeight: 800 }}>{code}</div>
            <button
              onClick={() => { navigator.clipboard?.writeText(code.replace('-', '')); setCopied(true) }}
              style={{ marginTop: 10, padding: '8px 18px', borderRadius: 10, border: '1px solid #34306a', background: 'transparent', color: '#fff' }}
            >
              {copied ? '✅ Imenakiliwa' : '📋 Nakili'}
            </button>
            <p style={{ color: '#aaa8cc', fontSize: 13 }}>
              WhatsApp → Vifaa vilivyounganishwa → Unganisha kifaa → Unganisha kwa namba ya simu, kisha weka code hii ndani ya dakika 3.
            </p>
          </>
        )}
      </div>
    </main>
  )
}

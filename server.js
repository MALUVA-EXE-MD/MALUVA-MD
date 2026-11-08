import express from 'express'
import pino from 'pino'
import fs from 'fs'
import path from 'path'
import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  Browsers,
} from '@whiskeysockets/baileys'
import { handleMessage } from './handler.js'

const PORT = process.env.PORT || 3001
const API_SECRET = process.env.API_SECRET
const MAX_USERS = Number(process.env.MAX_USERS || 50)
const SESSIONS_DIR = process.env.SESSIONS_DIR || './sessions'
if (!API_SECRET) throw new Error('Weka API_SECRET kwenye Variables')

fs.mkdirSync(SESSIONS_DIR, { recursive: true })
const logger = pino({ level: 'silent' })
const live = new Map() // number -> { sock, open }
const registeredCount = () =>
  fs.readdirSync(SESSIONS_DIR).filter((n) => {
    try {
      return JSON.parse(fs.readFileSync(path.join(SESSIONS_DIR, n, 'creds.json'), 'utf8')).registered
    } catch { return false }
  }).length
const activeCount = () => [...live.values()].filter((s) => s.open).length

async function startSession(number) {
  const dir = path.join(SESSIONS_DIR, number)
  const { state, saveCreds } = await useMultiFileAuthState(dir)
  const { version } = await fetchLatestBaileysVersion()

  const sock = makeWASocket({
    version,
    logger,
    printQRInTerminal: false,
    browser: Browsers.ubuntu('Chrome'),
    markOnlineOnConnect: false,
    auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, logger) },
  })
  const entry = { sock, open: false }
  live.set(number, entry)

  sock.ev.on('creds.update', saveCreds)
  sock.ev.on('messages.upsert', ({ messages, type }) => {
    if (type !== 'notify') return
    for (const msg of messages) handleMessage(sock, msg, number).catch((e) => console.error(e?.message))
  })
  sock.ev.on('connection.update', ({ connection, lastDisconnect }) => {
    if (connection === 'open') {
      entry.open = true
      console.log(`✅ ${number} imeunganishwa`)
    }
    if (connection === 'close') {
      entry.open = false
      const code = lastDisconnect?.error?.output?.statusCode
      live.delete(number)
      if (code === DisconnectReason.loggedOut) {
        fs.rmSync(dir, { recursive: true, force: true })
        console.log(`🚪 ${number} ametoka (logged out)`)
      } else if (state.creds.registered || code === DisconnectReason.restartRequired) {
        setTimeout(() => startSession(number).catch(console.error), 3000)
      }
    }
  })
  return { sock, state }
}

// Rudisha session zote zilizohifadhiwa seva ikiwashwa
async function restoreAll() {
  for (const n of fs.readdirSync(SESSIONS_DIR)) {
    try {
      const creds = JSON.parse(fs.readFileSync(path.join(SESSIONS_DIR, n, 'creds.json'), 'utf8'))
      if (creds.registered) { await startSession(n); await new Promise((r) => setTimeout(r, 1500)) }
      else fs.rmSync(path.join(SESSIONS_DIR, n), { recursive: true, force: true })
    } catch {}
  }
  console.log(`♻️ Session zilizorudishwa: ${live.size}`)
}

const app = express()
app.use(express.json())
app.get('/', (_, res) => res.send('MALUVA-MD bot server iko hewani'))

app.use((req, res, next) => {
  if (req.headers['x-api-secret'] !== API_SECRET) return res.status(401).json({ error: 'Hairuhusiwi' })
  next()
})

app.get('/status', (_, res) => res.json({ active: activeCount(), registered: registeredCount(), limit: MAX_USERS }))

app.post('/pair', async (req, res) => {
  try {
    const number = String(req.body.number || '').replace(/\D/g, '')
    if (number.length < 8 || number.length > 15)
      return res.status(400).json({ error: 'Namba si sahihi. Tumia code ya nchi, mfano 255712345678' })
    if (live.get(number)?.open) return res.status(409).json({ error: 'Namba hii tayari imeunganishwa' })
    if (registeredCount() >= MAX_USERS) return res.status(403).json({ error: 'Seva imejaa, chagua seva nyingine' })

    // futa jaribio la zamani ambalo halikukamilika
    const old = live.get(number)
    if (old) { try { old.sock.end() } catch {} live.delete(number) }
    fs.rmSync(path.join(SESSIONS_DIR, number), { recursive: true, force: true })

    const { sock, state } = await startSession(number)
    await new Promise((r) => setTimeout(r, 3000))
    const raw = await sock.requestPairingCode(number)
    res.json({ code: raw?.match(/.{1,4}/g)?.join('-') || raw })

    // kama haikuunganishwa ndani ya dakika 3, futa
    setTimeout(() => {
      if (!state.creds.registered) {
        try { sock.end() } catch {}
        live.delete(number)
        fs.rmSync(path.join(SESSIONS_DIR, number), { recursive: true, force: true })
      }
    }, 180000)
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Imeshindwa kutengeneza code, jaribu tena' })
  }
})

app.listen(PORT, () => {
  console.log(`Bot server iko hewani kwenye port ${PORT}`)
  restoreAll().catch(console.error)
})

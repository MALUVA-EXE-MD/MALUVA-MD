import { commands, PREFIX } from './commands.js'

const OWNER = (process.env.OWNER_NUMBER || '').replace(/\D/g, '')
export const settings = { antilink: new Set() }

const unwrap = (m) => m?.ephemeralMessage?.message || m?.viewOnceMessage?.message || m

export async function handleMessage(sock, msg, ownNumber) {
  if (!msg.message || msg.key.fromMe) return
  const m = unwrap(msg.message)
  msg.message = m
  const text =
    m.conversation || m.extendedTextMessage?.text || m.imageMessage?.caption || m.videoMessage?.caption || ''

  const jid = msg.key.remoteJid
  if (jid === 'status@broadcast') return
  const isGroup = jid.endsWith('@g.us')
  const sender = (isGroup ? msg.key.participant : jid) || ''
  const senderNum = sender.split('@')[0].split(':')[0]
  const isOwner = senderNum === OWNER || senderNum === ownNumber

  let participants = []
  let isAdmin = false
  let botAdmin = false
  if (isGroup) {
    try {
      const meta = await sock.groupMetadata(jid)
      participants = meta.participants
      const adminIds = participants.filter((p) => p.admin).map((p) => p.id.split('@')[0].split(':')[0])
      isAdmin = adminIds.includes(senderNum)
      botAdmin = adminIds.includes(ownNumber)
    } catch {}
  }

  // Antilink
  if (isGroup && settings.antilink.has(jid) && /chat\.whatsapp\.com\//i.test(text) && !isAdmin && !isOwner) {
    if (botAdmin) {
      await sock.sendMessage(jid, { delete: msg.key }).catch(() => {})
      await sock.groupParticipantsUpdate(jid, [sender], 'remove').catch(() => {})
    }
    return
  }

  if (!text.startsWith(PREFIX)) return
  const [name, ...args] = text.slice(PREFIX.length).trim().split(/\s+/)
  let cmd = commands[name.toLowerCase()]
  if (cmd?.alias) cmd = commands[cmd.alias]
  if (!cmd) return

  const reply = (t) => sock.sendMessage(jid, { text: t }, { quoted: msg })
  try {
    await cmd.run({ sock, msg, jid, args, isGroup, sender, isOwner, isAdmin, botAdmin, participants, reply, settings })
  } catch (e) {
    console.error('Command error:', name, e?.message)
    reply('❌ Kuna hitilafu, jaribu tena.').catch(() => {})
  }
}

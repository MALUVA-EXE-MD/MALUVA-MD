// Amri zote za bot ziko hapa. Ongeza amri mpya kwa kuongeza kitu kwenye `commands`.
export const BOT_NAME = process.env.BOT_NAME || 'MALUVA-MD'
export const PREFIX = process.env.PREFIX || '.'
export const OWNER_NAME = process.env.OWNER_NAME || 'MALUVA'

const jokes = [
  'Kwa nini kompyuta ilienda hospitali? Ilikuwa na virusi! 😂',
  'Mwalimu: Taja ndege wanaoruka usiku. Mwanafunzi: Bundi na... wale wasiolala! 🦉',
  'Simu yangu na mimi tuna kitu kimoja: tukiisha chaji, hakuna anayetutafuta. 🔋',
]
const quotes = [
  'Usikate tamaa, kila mtaalamu alianza kama mwanzo. 💪',
  'Subira huvuta heri. 🌱',
  'Haba na haba hujaza kibaba. ✨',
]
const ball = ['Ndiyo ✅', 'Hapana ❌', 'Pengine 🤔', 'Uliza tena baadaye ⏳', 'Bila shaka 💯']
const pick = (a) => a[Math.floor(Math.random() * a.length)]

export const runtimeText = () => {
  let s = Math.floor(process.uptime())
  const d = Math.floor(s / 86400); s %= 86400
  const h = Math.floor(s / 3600); s %= 3600
  const m = Math.floor(s / 60); s %= 60
  return `${d ? d + 'd ' : ''}${h}h ${m}m ${s}s`
}

const need = {
  group: (c) => c.isGroup || c.reply('⚠️ Amri hii ni ya makundi tu.') && false,
}

async function target(c) {
  const ctx = c.msg.message?.extendedTextMessage?.contextInfo
  return ctx?.mentionedJid?.[0] || ctx?.participant || null
}

async function guardAdmin(c) {
  if (!c.isGroup) { await c.reply('⚠️ Amri hii ni ya makundi tu.'); return false }
  if (!c.isAdmin && !c.isOwner) { await c.reply('⚠️ Ni kwa admin tu.'); return false }
  if (!c.botAdmin) { await c.reply('⚠️ Nifanye admin kwanza ili nifanye hivi.'); return false }
  return true
}

export const commands = {
  // ───── MAIN ─────
  menu: { cat: 'MAIN', run: (c) => c.reply(buildMenu()) },
  help: { cat: 'MAIN', run: (c) => c.reply(buildMenu()) },
  ping: {
    cat: 'MAIN',
    run: async (c) => {
      const t = Date.now()
      await c.reply('🏓 Pong!')
      await c.reply(`⚡ Kasi: ${Date.now() - t}ms`)
    },
  },
  alive: { cat: 'MAIN', run: (c) => c.reply(`✅ ${BOT_NAME} iko hewani\n⏱ Runtime: ${runtimeText()}`) },
  runtime: { cat: 'MAIN', run: (c) => c.reply(`⏱ Runtime: ${runtimeText()}`) },
  owner: { cat: 'MAIN', run: (c) => c.reply(`👑 Owner: ${OWNER_NAME}`) },

  // ───── GROUP ─────
  tagall: {
    cat: 'GROUP',
    run: async (c) => {
      if (!(await guardAdmin(c))) return
      const ids = c.participants.map((p) => p.id)
      const text = `📢 *${c.args.join(' ') || 'Tahadhari kwa wote'}*\n\n` + ids.map((i) => `@${i.split('@')[0]}`).join('\n')
      await c.sock.sendMessage(c.jid, { text, mentions: ids }, { quoted: c.msg })
    },
  },
  everyone: { cat: 'GROUP', alias: 'tagall' },
  kick: {
    cat: 'GROUP',
    run: async (c) => {
      if (!(await guardAdmin(c))) return
      const t = await target(c)
      if (!t) return c.reply('Mtag au jibu ujumbe wa mtu.')
      await c.sock.groupParticipantsUpdate(c.jid, [t], 'remove')
    },
  },
  promote: {
    cat: 'GROUP',
    run: async (c) => {
      if (!(await guardAdmin(c))) return
      const t = await target(c)
      if (!t) return c.reply('Mtag au jibu ujumbe wa mtu.')
      await c.sock.groupParticipantsUpdate(c.jid, [t], 'promote')
      c.reply('✅ Amefanywa admin.')
    },
  },
  demote: {
    cat: 'GROUP',
    run: async (c) => {
      if (!(await guardAdmin(c))) return
      const t = await target(c)
      if (!t) return c.reply('Mtag au jibu ujumbe wa mtu.')
      await c.sock.groupParticipantsUpdate(c.jid, [t], 'demote')
      c.reply('✅ Ameondolewa uadmin.')
    },
  },
  mute: {
    cat: 'GROUP',
    run: async (c) => {
      if (!(await guardAdmin(c))) return
      await c.sock.groupSettingUpdate(c.jid, 'announcement')
      c.reply('🔇 Kundi limefungwa (admin tu).')
    },
  },
  unmute: {
    cat: 'GROUP',
    run: async (c) => {
      if (!(await guardAdmin(c))) return
      await c.sock.groupSettingUpdate(c.jid, 'not_announcement')
      c.reply('🔊 Kundi limefunguliwa.')
    },
  },
  link: {
    cat: 'GROUP',
    run: async (c) => {
      if (!(await guardAdmin(c))) return
      const code = await c.sock.groupInviteCode(c.jid)
      c.reply(`🔗 https://chat.whatsapp.com/${code}`)
    },
  },
  antilink: {
    cat: 'GROUP',
    run: async (c) => {
      if (!(await guardAdmin(c))) return
      const on = (c.args[0] || '').toLowerCase()
      if (on !== 'on' && on !== 'off') return c.reply(`Tumia: ${PREFIX}antilink on / off`)
      if (on === 'on') c.settings.antilink.add(c.jid)
      else c.settings.antilink.delete(c.jid)
      c.reply(`🛡 Antilink: *${on.toUpperCase()}*`)
    },
  },

  // ───── FUN ─────
  joke: { cat: 'FUN', run: (c) => c.reply(pick(jokes)) },
  quote: { cat: 'FUN', run: (c) => c.reply(pick(quotes)) },
  '8ball': {
    cat: 'FUN',
    run: (c) => (c.args.length ? c.reply(`🎱 ${pick(ball)}`) : c.reply(`Uliza swali: ${PREFIX}8ball nitafaulu?`)),
  },

  // ───── OWNER ─────
  leave: {
    cat: 'OWNER',
    run: async (c) => {
      if (!c.isOwner) return c.reply('⚠️ Owner tu.')
      if (!c.isGroup) return c.reply('⚠️ Kundi tu.')
      await c.reply('👋 Kwaheri!')
      await c.sock.groupLeave(c.jid)
    },
  },
}

// Fonti ya kisasa kama menu yako
const BOLD = { A: '𝐀', B: '𝐁', C: '𝐂', D: '𝐃', E: '𝐄', F: '𝐅', G: '𝐆', H: '𝐇', I: '𝐈', J: '𝐉', K: '𝐊', L: '𝐋', M: '𝐌', N: '𝐍', O: '𝐎', P: '𝐏', Q: '𝐐', R: '𝐑', S: '𝐒', T: '𝐓', U: '𝐔', V: '𝐕', W: '𝐖', X: '𝐗', Y: '𝐘', Z: '𝐙' }
const b = (s) => s.replace(/[A-Z]/g, (ch) => BOLD[ch] || ch)

export function buildMenu() {
  const cats = {}
  let total = 0
  for (const [name, cmd] of Object.entries(commands)) {
    if (cmd.alias) continue
    ;(cats[cmd.cat] ||= []).push(name)
    total++
  }
  let out = `╭─❍══ ⃟ ⃟ ⃟   ${b(BOT_NAME)}   ⃟ ⃟ ⃟══⊷❍
┇◆╭┉┉┉┉┉┉┉┉┉┉━⊷
┇◆┋. ${b('OWNER')} : ${OWNER_NAME}
┇◆┋. ${b('MODE')} : public
┇◆┋. ${b('PREFIX')} : ${PREFIX}
┇◆┋. ${b('RUNTIME')} : ${runtimeText()}
┇◆┋. ${b('TOTAL COMMANDS')} : ${total}
┇◆╰┉┉┉┉┉┉┉┉┉┉┉┉┉━┈⊷
╰══════════════════⍟\n`
  for (const [cat, names] of Object.entries(cats)) {
    out += `╭─❍══ ⃟ ⃟ ⃟   ${b(cat)}   ⃟ ⃟ ⃟══⊷❍
┇◆╭┉┉┉┉┉┉┉┉┉┉━⊷\n`
    out += names.map((n) => `┇◆┋. _${n}_`).join('\n')
    out += `\n┇◆╰┉┉┉┉┉┉┉┉┉┉┉┉┉━┈⊷
╰══════════════════⍟\n`
  }
  return out + `\n> *© ᴘᴏᴡᴇʀᴇᴅ ʙʏ ${b(BOT_NAME)}*`
}

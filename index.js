const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');

const BOT_NAME = "MALUVA MD";
const OWNER_NAME = "Maluva";
const OWNER_NUMBER = "255615440040";
const PREFIX = ".";

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('session');
  const sock = makeWASocket({
    logger: pino({ level: 'silent' }),
    auth: state,
    printQRInTerminal: true
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message || msg.key.fromMe) return;
    const text = msg.message.conversation || msg.message.extendedTextMessage?.text || "";
    const from = msg.key.remoteJid;

    if (text === `${PREFIX}ping`) {
      await sock.sendMessage(from, { text: `*${BOT_NAME} is Online* ⚡\nSpeed: Fast\nOwner: ${OWNER_NAME}` });
    }
    if (text === `${PREFIX}menu`) {
      await sock.sendMessage(from, { text: `*${BOT_NAME} MENU*\n\nOwner: ${OWNER_NAME}\nPrefix: ${PREFIX}\n\n${PREFIX}ping - Check bot\n${PREFIX}menu - Menu\n${PREFIX}owner - Owner info` });
    }
    if (text === `${PREFIX}owner`) {
      await sock.sendMessage(from, { text: `*Owner wa ${BOT_NAME}*\nJina: ${OWNER_NAME}\nNamba: ${OWNER_NUMBER}` });
    }
  });

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      if (shouldReconnect) startBot();
    } else if (connection === 'open') {
      console.log(BOT_NAME + ' IMEWAKA!');
    }
  });
}
startBot();

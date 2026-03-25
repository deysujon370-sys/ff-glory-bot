const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const express = require('express');
const pino = require('pino');

const app = express();
app.get('/', (req, res) => res.send('Bot is Running!'));
app.listen(3000);

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');
    const sock = makeWASocket({
        auth: state,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false // QR band kar diya
    });

    // --- PAIRING CODE LOGIC ---
    if (!sock.authState.creds.registered) {
        // Yahan apna WhatsApp number daalein (Country code ke saath)
        const phoneNumber = "918399987633"; // <--- APNA NUMBER YAHAN DALO
        setTimeout(async () => {
            let code = await sock.requestPairingCode(phoneNumber);
            console.log(`\n\n👉 YOUR PAIRING CODE: ${code}\n\n`);
        }, 5000);
    }

    sock.ev.on('creds.update', saveCreds);
    sock.ev.on('connection.update', (u) => {
        if (u.connection === 'open') console.log('✅ Connected!');
        if (u.connection === 'close') startBot();
    });
}
startBot();

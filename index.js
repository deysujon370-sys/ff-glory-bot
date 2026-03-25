const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    DisconnectReason 
} = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const express = require('express');

// --- KEEP ALIVE SERVER ---
const app = express();
app.get('/', (req, res) => res.send('Bot is Running!'));
app.listen(3000, () => console.log('Server started on port 3000'));

// --- GLORY DATA ---
let gloryData = {}; 

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true // Terminal mein QR code dikhayega
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        if (qr) {
            console.log("Scan this QR Code with WhatsApp:");
            qrcode.generate(qr, { small: true });
        }

        if (connection === 'close') {
            const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('Connection closed. Reconnecting...', shouldReconnect);
            if (shouldReconnect) startBot();
        } else if (connection === 'open') {
            console.log('WhatsApp Connected Successfully!');
        }
    });

    // --- COMMANDS LOGIC ---
    sock.ev.on('messages.upsert', async m => {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const text = msg.message.conversation || msg.message.extendedTextMessage?.text || "";
        const from = msg.key.remoteJid;

        // Command: !addglory [Name] [Amount]
        if (text.startsWith('!addglory')) {
            const args = text.split(' ');
            if (args.length < 3) return sock.sendMessage(from, { text: "Usage: !addglory [Name] [Amount]" });
            
            const name = args[1];
            const amount = parseInt(args[2]);
            
            gloryData[name] = (gloryData[name] || 0) + amount;
            await sock.sendMessage(from, { text: `✅ ${name} ki glory add ho gayi! Total: ${gloryData[name]}` });
        }

        // Command: !listglory
        if (text === '!listglory') {
            let list = "🏆 *GUILD GLORY LIST* 🏆\n\n";
            for (let name in gloryData) {
                list += `👤 ${name}: ${gloryData[name]}\n`;
            }
            if (Object.keys(gloryData).length === 0) list = "Abhi tak koi data nahi hai.";
            await sock.sendMessage(from, { text: list });
        }

        // Command: !resetglory
        if (text === '!resetglory') {
            gloryData = {};
            await sock.sendMessage(from, { text: "🧹 Saari glory reset ho gayi hai!" });
        }
    });
}

startBot();

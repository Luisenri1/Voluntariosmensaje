import express from 'express';
import { Boom } from '@hapi/boom';
import makeWASocket, { useMultiFileAuthState, MessageUpsertType } from '@whiskeysockets/baileys';

const app = express();
app.use(express.json());

// Configuración de Baileys
let sock: ReturnType<typeof makeWASocket>;
const initializeWA = async () => {
  const { state, saveCreds } = await useMultiFileAuthState('baileys_auth');
  
  sock = makeWASocket({
    auth: state,
    printQRInTerminal: true,
  });

  sock.ev.on('connection.update', (update) => {
    if (update.connection === 'open') {
      console.log('¡Conectado a WhatsApp!');
    }
  });

  sock.ev.on('creds.update', saveCreds);
};

initializeWA().catch(console.error);

// Endpoint seguro para enviar mensajes
app.post('/send-whatsapp', async (req, res) => {
  try {
    // Validar API Key
    if (req.headers['x-api-key'] !== process.env.API_KEY) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    const { phone, name } = req.body;
    const formattedPhone = `${phone.replace(/[^0-9]/g, '')}@s.whatsapp.net`;
    
    await sock.sendMessage(formattedPhone, {
      text: `✅ Hola ${name}! Hemos recibido tu formulario correctamente.\n\nGracias por participar.`
    });
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al enviar mensaje' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

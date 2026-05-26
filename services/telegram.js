const twilio = require('twilio');

class NotificationService {
  constructor() {
    this.telegramToken   = process.env.TELEGRAM_BOT_TOKEN;
    this.telegramChatId  = process.env.TELEGRAM_CHAT_ID;
    this.telegramEnabled = !!(this.telegramToken && this.telegramChatId);

    this.twilioClient = null;
    this.twilioFrom   = process.env.TWILIO_PHONE_NUMBER;
    this.smsRecipients = (process.env.SMS_RECIPIENTS || '')
      .split(',')
      .map(n => n.trim())
      .filter(Boolean);

    const sid   = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    this.smsEnabled = !!(sid && token && this.twilioFrom && this.smsRecipients.length);

    if (this.smsEnabled) {
      this.twilioClient = twilio(sid, token);
    }
  }

  sendTelegram(message) {
    return new Promise((resolve, reject) => {
      if (!this.telegramEnabled) {
        console.warn('[Telegram] No configurado. Notificación omitida.');
        return resolve({ ok: false, skipped: true });
      }

      const https = require('https');
      const body  = JSON.stringify({
        chat_id: this.telegramChatId,
        text: message,
        parse_mode: 'Markdown'
      });

      const options = {
        hostname: 'api.telegram.org',
        path:     `/bot${this.telegramToken}/sendMessage`,
        method:   'POST',
        headers:  {
          'Content-Type':   'application/json',
          'Content-Length': Buffer.byteLength(body)
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => { data += chunk; });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (parsed.ok) {
              console.log(`[Telegram] Enviado. message_id: ${parsed.result.message_id}`);
              resolve(parsed);
            } else {
              console.error('[Telegram] Error API:', parsed.description);
              reject(new Error(parsed.description));
            }
          } catch (e) { reject(e); }
        });
      });
      req.on('error', err => { console.error('[Telegram] Red:', err.message); reject(err); });
      req.write(body);
      req.end();
    });
  }

  async sendSMS(to, body) {
    if (!this.smsEnabled) {
      console.warn('[SMS] Twilio no configurado. SMS omitido.');
      return { skipped: true };
    }
    try {
      const msg = await this.twilioClient.messages.create({
        body,
        from: this.twilioFrom,
        to
      });
      console.log(`[SMS] Enviado a ${to}. SID: ${msg.sid}`);
      return msg;
    } catch (err) {
      console.error(`[SMS] Error enviando a ${to}:`, err.message);
      throw err;
    }
  }

  async broadcastSMS(text) {
    if (!this.smsEnabled) return;
    const results = await Promise.allSettled(
      this.smsRecipients.map(number => this.sendSMS(number, text))
    );
    results.forEach((r, i) => {
      if (r.status === 'rejected')
        console.error(`[SMS] Falló envío a ${this.smsRecipients[i]}:`, r.reason?.message);
    });
  }

  async notifyNewPost(post) {
    const telegramText =
      `*Nueva publicación en UniMercs*\n\n` +
      `*${post.title}*\n` +
      `Precio: $${Number(post.price).toLocaleString('es-CO')}\n` +
      `Categoría: ${post.category}\n` +
      `Vendedor: ${post.sellerName}\n` +
      `${new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' })}`;

    const smsText =
      `UniMercs - Nueva publicacion: ${post.title} | ` +
      `$${Number(post.price).toLocaleString('es-CO')} | Vendedor: ${post.sellerName}`;

    await Promise.allSettled([
      this.sendTelegram(telegramText),
      this.broadcastSMS(smsText)
    ]);
  }

  async notifyNewUser(user) {
    const telegramText =
      `*Nuevo usuario registrado en UniMercs*\n\n` +
      `Nombre: ${user.name}\n` +
      `Email: ${user.email}\n` +
      `${new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' })}`;

    const smsText = `UniMercs - Nuevo usuario: ${user.name} (${user.email})`;

    await Promise.allSettled([
      this.sendTelegram(telegramText),
      this.broadcastSMS(smsText)
    ]);
  }
}

module.exports = new NotificationService();
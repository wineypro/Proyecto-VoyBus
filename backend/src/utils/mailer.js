const nodemailer = require('nodemailer');

// Envío de correos. Si SMTP_USER y SMTP_PASS están en el .env, el correo se envía de verdad
// (por ejemplo con Gmail). Si no están, el correo se SIMULA: se muestra en la consola del backend.
// Así el proyecto funciona igual en cualquier computador, sin configurar nada.
function isConfigured() {
  return Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);
}

let transporter = null;
function getTransporter() {
  if (!transporter) {
    const port = Number(process.env.SMTP_PORT) || 465;
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port,
      secure: port === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  return transporter;
}

// Devuelve { simulated: true } si no hay credenciales, o { simulated: false, sent: true | false }.
// Nunca lanza: si el envío falla, el error se registra en consola y se devuelve sent:false.
async function sendMail({ to, subject, text, html }) {
  if (!isConfigured()) {
    console.log(`[correo simulado] Para: ${to} | Asunto: ${subject}\n${text}`);
    return { simulated: true, sent: true };
  }
  try {
    await getTransporter().sendMail({
      from: process.env.MAIL_FROM || `VoyBus <${process.env.SMTP_USER}>`,
      to,
      subject,
      text,
      html,
    });
    return { simulated: false, sent: true };
  } catch (err) {
    console.error('No se pudo enviar el correo:', err.message);
    return { simulated: false, sent: false };
  }
}

// Los datos del usuario (como su nombre) se escapan antes de ponerlos en el HTML del correo.
const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

// Correo con un código de 6 dígitos.
function codeEmail({ title, intro, code, minutes }) {
  const text = `${title}\n\n${intro}\n\nTu código: ${code}\n\nVence en ${minutes} minutos y solo puede usarse una vez.\nSi no fuiste tú, ignora este mensaje.`;
  const html = `
<div style="font-family:Arial,Helvetica,sans-serif;background:#f4f8f6;padding:24px">
  <div style="max-width:480px;margin:auto;background:#ffffff;border-radius:12px;padding:24px">
    <div style="font-size:20px;font-weight:bold;color:#1b7f5c">VoyBus</div>
    <h2 style="color:#12362a">${escapeHtml(title)}</h2>
    <p style="color:#35524a">${escapeHtml(intro)}</p>
    <div style="background:#e3f4ec;border-radius:10px;padding:16px;text-align:center;font-size:32px;letter-spacing:8px;font-weight:bold;color:#12362a">${code}</div>
    <p style="color:#35524a">El código vence en <b>${minutes} minutos</b> y solo puede usarse una vez.</p>
    <p style="color:#6b8279;font-size:13px">Si no fuiste tú, ignora este mensaje. Tu cuenta sigue protegida.</p>
  </div>
</div>`;
  return { text, html };
}

module.exports = { sendMail, codeEmail, isConfigured };

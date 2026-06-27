// emailService.js — Notifications email pour les tickets de support VacciTrack
const nodemailer = require('nodemailer');

// ── Destinataires des notifications ──────────────────────────────────────────
const DEFAULT_SUPPORT_EMAILS = [
  'sarabelmahi378@gmail.com',
];

function getSupportEmails() {
  const raw = process.env.SUPPORT_EMAILS;
  if (!raw) return DEFAULT_SUPPORT_EMAILS;

  return raw
    .split(/[;,]+/)
    .map(email => email.trim())
    .filter(Boolean);
}

function normalizeSmtpPass(value) {
  return String(value || '').trim().replace(/\s+/g, '');
}

// ── Config SMTP ───────────────────────────────────────────────────────────────
// Variables d'environnement recommandées :
//   SMTP_HOST     (défaut: smtp.gmail.com)
//   SMTP_PORT     (défaut: 587)
//   SMTP_USER     → adresse Gmail de l'expéditeur
//   SMTP_PASS     → mot de passe d'application Gmail (pas le mot de passe principal)
//   SMTP_FROM     → nom affiché (défaut: VacciTrack Support)
//
// Pour Gmail : activer "Mots de passe des applications" dans
// https://myaccount.google.com/security → Connexion à Google → Mots de passe des applications

function createTransporter() {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = String(process.env.SMTP_USER || '').trim();
  const pass = normalizeSmtpPass(process.env.SMTP_PASS);

  if (!user || !pass) {
    console.warn('⚠️  SMTP_USER / SMTP_PASS non configurés — les emails ne seront pas envoyés.');
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    tls: { rejectUnauthorized: false },
  });
}

// ── Template HTML du ticket ───────────────────────────────────────────────────
function buildTicketEmailHtml(ticket) {
  const priorityColors = {
    haute:  { bg: '#fef2f2', border: '#fca5a5', text: '#dc2626', label: '🔴 HAUTE' },
    normal: { bg: '#eff6ff', border: '#93c5fd', text: '#2563eb', label: '🔵 NORMAL' },
    basse:  { bg: '#f0fdf4', border: '#86efac', text: '#16a34a', label: '🟢 BASSE'  },
  };
  const categoryIcons = {
    Bug:          '🐛',
    Amélioration: '✨',
    Question:     '❓',
    Autre:        '📌',
  };

  const prio    = priorityColors[ticket.priorite] || priorityColors.normal;
  const catIcon = categoryIcons[ticket.categorie] || '📌';
  const dateStr = new Date(ticket.createdAt).toLocaleString('fr-FR', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
  if (supportEmails.length === 0) {
    console.warn('Aucun destinataire SUPPORT_EMAILS configure - email non envoye.');
    return { sent: false, reason: 'Aucun destinataire email configure' };
  }

  const shortId = String(ticket.id || '').substring(0, 8).toUpperCase();

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nouveau ticket VacciTrack</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="background:#0a0f1e;border-radius:16px 16px 0 0;padding:28px 32px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <div style="font-size:11px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:#60a5fa;margin-bottom:6px;">
                    Système de support
                  </div>
                  <div style="font-size:22px;font-weight:800;color:#ffffff;line-height:1.2;">
                    🏥 VacciTrack — Nouveau ticket
                  </div>
                </td>
                <td align="right" style="vertical-align:top;">
                  <div style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);color:#94a3b8;font-size:12px;font-weight:700;padding:6px 14px;border-radius:999px;white-space:nowrap;">
                    #${shortId}
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="background:#ffffff;padding:32px;">

            <!-- Badges priorité + catégorie -->
            <table cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
              <tr>
                <td style="padding-right:8px;">
                  <span style="display:inline-block;background:${prio.bg};border:1px solid ${prio.border};color:${prio.text};font-size:12px;font-weight:700;padding:5px 14px;border-radius:999px;">
                    ${prio.label}
                  </span>
                </td>
                <td>
                  <span style="display:inline-block;background:#f8fafc;border:1px solid #e2e8f0;color:#475569;font-size:12px;font-weight:600;padding:5px 14px;border-radius:999px;">
                    ${catIcon} ${ticket.categorie || 'Question'}
                  </span>
                </td>
              </tr>
            </table>

            <!-- Titre -->
            <div style="font-size:11px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:#94a3b8;margin-bottom:6px;">
              Sujet
            </div>
            <div style="font-size:18px;font-weight:700;color:#0f172a;margin-bottom:24px;line-height:1.4;">
              ${escapeHtml(ticket.titre || 'Sans titre')}
            </div>

            <!-- Description -->
            <div style="font-size:11px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:#94a3b8;margin-bottom:8px;">
              Description
            </div>
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-left:3px solid #2563eb;border-radius:0 10px 10px 0;padding:16px 18px;font-size:14px;color:#374151;line-height:1.7;margin-bottom:24px;white-space:pre-line;">
              ${escapeHtml(ticket.description || '—')}
            </div>

            <!-- Métadonnées -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
              <tr style="border-bottom:1px solid #e2e8f0;">
                <td style="padding:12px 16px;font-size:12px;font-weight:600;color:#64748b;width:140px;">ID ticket</td>
                <td style="padding:12px 16px;font-size:12px;font-weight:700;color:#0f172a;font-family:monospace;">#${shortId}</td>
              </tr>
              <tr style="border-bottom:1px solid #e2e8f0;">
                <td style="padding:12px 16px;font-size:12px;font-weight:600;color:#64748b;">Statut</td>
                <td style="padding:12px 16px;font-size:12px;font-weight:700;color:#dc2626;">🔴 OUVERT</td>
              </tr>
              <tr style="border-bottom:1px solid #e2e8f0;">
                <td style="padding:12px 16px;font-size:12px;font-weight:600;color:#64748b;">Priorité</td>
                <td style="padding:12px 16px;font-size:12px;font-weight:700;color:${prio.text};">${prio.label}</td>
              </tr>
              <tr style="border-bottom:1px solid #e2e8f0;">
                <td style="padding:12px 16px;font-size:12px;font-weight:600;color:#64748b;">Catégorie</td>
                <td style="padding:12px 16px;font-size:12px;color:#0f172a;">${catIcon} ${ticket.categorie || 'Question'}</td>
              </tr>
              <tr>
                <td style="padding:12px 16px;font-size:12px;font-weight:600;color:#64748b;">Reçu le</td>
                <td style="padding:12px 16px;font-size:12px;color:#0f172a;">${dateStr}</td>
              </tr>
            </table>

          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 16px 16px;padding:20px 32px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="font-size:12px;color:#94a3b8;line-height:1.6;">
                  Ce message a été généré automatiquement par <strong style="color:#64748b;">VacciTrack</strong>.<br>
                  CHU Tlemcen — Service d'Épidémiologie
                </td>
              </tr>
            </table>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>

</body>
</html>`;
}

// ── Échapper le HTML ──────────────────────────────────────────────────────────
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ── Texte brut (fallback) ─────────────────────────────────────────────────────
function buildTicketEmailText(ticket) {
  const shortId = String(ticket.id || '').substring(0, 8).toUpperCase();
  const dateStr = new Date(ticket.createdAt).toLocaleString('fr-FR');
  return `
VacciTrack — Nouveau ticket de support
========================================

ID         : #${shortId}
Sujet      : ${ticket.titre || 'Sans titre'}
Catégorie  : ${ticket.categorie || 'Question'}
Priorité   : ${(ticket.priorite || 'normal').toUpperCase()}
Statut     : OUVERT
Reçu le    : ${dateStr}

Description
-----------
${ticket.description || '—'}

--
Ce message a été généré automatiquement par VacciTrack.
CHU Tlemcen — Service d'Épidémiologie
`.trim();
}

// ── Fonction principale d'envoi ───────────────────────────────────────────────
async function sendTicketNotification(ticket) {
  const transporter = createTransporter();
  const supportEmails = getSupportEmails();

  if (!transporter) {
    console.log('📧 Email non envoyé (SMTP non configuré). Ticket enregistré en base.');
    return { sent: false, reason: 'SMTP non configuré' };
  }

  const shortId = String(ticket.id || '').substring(0, 8).toUpperCase();
  const priorityEmoji = { haute: '🔴', normal: '🔵', basse: '🟢' }[ticket.priorite] || '🔵';
  const subject = `${priorityEmoji} [VacciTrack #${shortId}] ${ticket.titre || 'Nouveau ticket'}`;

  const mailOptions = {
    from: `"${process.env.SMTP_FROM || 'VacciTrack Support'}" <${process.env.SMTP_USER}>`,
    to: supportEmails.join(', '),
    subject,
    text: buildTicketEmailText(ticket),
    html: buildTicketEmailHtml(ticket),
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email ticket #${shortId} envoyé → ${supportEmails.join(', ')} (messageId: ${info.messageId})`);
    if (Array.isArray(info.rejected) && info.rejected.length > 0) {
      console.warn(`Destinataires rejetes pour ticket #${shortId}: ${info.rejected.join(', ')}`);
    }
    return { sent: true, messageId: info.messageId, accepted: info.accepted, rejected: info.rejected };
  } catch (err) {
    console.error(`❌ Échec envoi email ticket #${shortId}:`, err.message);
    return { sent: false, error: err.message };
  }
}

// ── Vérifier la config SMTP au démarrage ──────────────────────────────────────
async function checkSmtpConfig() {
  const user = String(process.env.SMTP_USER || '').trim();
  const pass = normalizeSmtpPass(process.env.SMTP_PASS);
  const supportEmails = getSupportEmails();
  if (!user || !pass) {
    console.warn('');
    console.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.warn('⚠️  SMTP non configuré — les tickets ne déclencheront pas d\'email.');
    console.warn('   Ajoutez dans votre .env (ou variables d\'environnement) :');
    console.warn('   SMTP_USER=sarabelmahi378@gmail.com');
    console.warn('   SMTP_PASS=lcza gffq kzly ljsf   (mot de passe d\'application)');
    console.warn('   SMTP_HOST=smtp.gmail.com         (optionnel)');
    console.warn('   SMTP_PORT=587                    (optionnel)');
    console.warn('   SMTP_FROM=VacciTrack Support     (optionnel)');
    console.warn('   SUPPORT_EMAILS=mail1@example.com,mail2@example.com');
    console.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.warn('');
  } else {
    console.log(`📧 SMTP configuré → ${user} (envoi vers ${supportEmails.join(', ')})`);
    try {
      const transporter = createTransporter();
      if (!transporter) return;
      await transporter.verify();
      console.log('✅ Connexion SMTP vérifiée avec succès.');
    } catch (err) {
      console.error(`❌ Vérification SMTP échouée: ${err.message}`);
    }
  }
}

module.exports = { sendTicketNotification, checkSmtpConfig };

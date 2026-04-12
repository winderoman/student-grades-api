import nodemailer from 'nodemailer';
import logger from '../utils/logger';

interface BulletinPayload {
  to: string;
  studentName: string;
  period: string;
  report: Array<{
    subject: { name: string; code: string };
    average: number;
    totalGrades: number;
    status: string;
  }>;
  globalAverage: number;
}

const createTransporter = () =>
  nodemailer.createTransport({
    host: process.env.MAIL_HOST ?? 'smtp.gmail.com',
    port: Number(process.env.MAIL_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASSWORD,
    },
  });

const buildBulletinHtml = (payload: BulletinPayload): string => {
  const rows = payload.report
    .map(
      ({ subject, average, totalGrades, status }) => `
    <tr style="border-bottom:1px solid #eee;">
      <td style="padding:8px;">${subject.name} (${subject.code})</td>
      <td style="padding:8px;text-align:center;">${average}</td>
      <td style="padding:8px;text-align:center;">${totalGrades}</td>
      <td style="padding:8px;text-align:center;color:${status === 'Aprobado' ? 'green' : 'red'};">${status}</td>
    </tr>`
    )
    .join('');

  return `
  <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:20px;border:1px solid #ddd;border-radius:8px;">
    <h2 style="color:#2c3e50;text-align:center;">📋 Boletín de Calificaciones</h2>
    <p>Estimado/a <strong>${payload.studentName}</strong>,</p>
    <p>Adjuntamos tu reporte de calificaciones para el período <strong>${payload.period}</strong>.</p>
    <table style="width:100%;border-collapse:collapse;margin-top:16px;">
      <thead style="background:#2c3e50;color:white;">
        <tr>
          <th style="padding:10px;text-align:left;">Materia</th>
          <th style="padding:10px;">Promedio</th>
          <th style="padding:10px;">Notas</th>
          <th style="padding:10px;">Estado</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <p style="margin-top:16px;font-weight:bold;">
      Promedio Global: <span style="color:#2980b9;">${payload.globalAverage}</span>
    </p>
    <p style="color:#7f8c8d;font-size:12px;margin-top:20px;">
      Este mensaje fue generado automáticamente por el Sistema de Notas Estudiantiles.
    </p>
  </div>`;
};

export const EmailService = {
  async sendBulletin(payload: BulletinPayload): Promise<void> {
    const transporter = createTransporter();

    await transporter.sendMail({
      from: process.env.MAIL_FROM ?? 'noreply@school.edu',
      to: payload.to,
      subject: `📋 Boletín de Calificaciones — Período ${payload.period}`,
      html: buildBulletinHtml(payload),
    });

    logger.info(`Boletín enviado a ${payload.to} para el período ${payload.period}`);
  },

  async sendBulkBulletins(bulletins: BulletinPayload[]): Promise<{ sent: number; failed: number }> {
    let sent = 0;
    let failed = 0;

    for (const bulletin of bulletins) {
      try {
        await this.sendBulletin(bulletin);
        sent++;
      } catch (error) {
        logger.error(`Error enviando boletín a ${bulletin.to}:`, error);
        failed++;
      }
    }

    return { sent, failed };
  },
};

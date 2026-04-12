import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';

interface ReportRow {
  studentName: string;
  studentCode: string;
  subject: string;
  period: string;
  gradeType: string;
  score: number;
}

interface StudentReport {
  studentName: string;
  studentCode: string;
  period: string;
  subjects: Array<{
    name: string;
    average: number;
    totalGrades: number;
    status: string;
  }>;
  globalAverage: number;
}

export const ExportService = {
  async generateExcel(rows: ReportRow[], title = 'Reporte de Notas'): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Sistema de Notas';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Notas', {
      pageSetup: { paperSize: 9, orientation: 'landscape' },
    });

    sheet.mergeCells('A1:F1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = title;
    titleCell.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2C3E50' } };
    sheet.getRow(1).height = 30;

    sheet.columns = [
      { header: 'Estudiante', key: 'studentName', width: 30 },
      { header: 'Código', key: 'studentCode', width: 15 },
      { header: 'Materia', key: 'subject', width: 25 },
      { header: 'Período', key: 'period', width: 12 },
      { header: 'Tipo', key: 'gradeType', width: 15 },
      { header: 'Nota', key: 'score', width: 10 },
    ];

    const headerRow = sheet.getRow(2);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2980B9' } };
    headerRow.alignment = { horizontal: 'center' };
    headerRow.height = 22;

    rows.forEach((row, idx) => {
      const dataRow = sheet.addRow(row);
      const scoreCell = dataRow.getCell('score');
      scoreCell.font = {
        bold: true,
        color: { argb: Number(row.score) >= 60 ? 'FF27AE60' : 'FFE74C3C' },
      };
      if (idx % 2 === 0) {
        dataRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F6FA' } };
      }
    });

    sheet.autoFilter = { from: 'A2', to: 'F2' };

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  },

  async generatePDF(report: StudentReport): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc.rect(0, 0, doc.page.width, 80).fill('#2C3E50');
      doc.fillColor('white').fontSize(20).text('BOLETÍN DE CALIFICACIONES', 50, 25, { align: 'center' });
      doc.fontSize(11).text('Sistema de Notas Estudiantiles', { align: 'center' });

      doc.moveDown(2);

      // Student info
      doc.fillColor('#2C3E50').fontSize(13).text('Información del Estudiante', { underline: true });
      doc.moveDown(0.4);
      doc
        .fillColor('#333')
        .fontSize(11)
        .text(`Nombre: ${report.studentName}`)
        .text(`Código: ${report.studentCode}`)
        .text(`Período: ${report.period}`);

      doc.moveDown(1);

      // Table header
      const tableTop = doc.y;
      const colWidths = [200, 80, 70, 80];
      const headers = ['Materia', 'Promedio', 'Notas', 'Estado'];
      let x = 50;

      doc.rect(50, tableTop, 495, 24).fill('#2980B9');
      doc.fillColor('white').fontSize(10);
      headers.forEach((h, i) => {
        doc.text(h, x + 5, tableTop + 7, { width: colWidths[i], align: 'center' });
        x += colWidths[i];
      });

      let rowY = tableTop + 24;
      report.subjects.forEach((s, idx) => {
        if (idx % 2 === 0) doc.rect(50, rowY, 495, 22).fill('#F5F6FA');
        else doc.rect(50, rowY, 495, 22).fill('#FFFFFF');

        x = 50;
        doc.fillColor('#333').fontSize(10);
        doc.text(s.name, x + 5, rowY + 6, { width: colWidths[0] });
        x += colWidths[0];
        doc.text(String(s.average), x + 5, rowY + 6, { width: colWidths[1], align: 'center' });
        x += colWidths[1];
        doc.text(String(s.totalGrades), x + 5, rowY + 6, { width: colWidths[2], align: 'center' });
        x += colWidths[2];
        doc.fillColor(s.status === 'Aprobado' ? '#27AE60' : '#E74C3C');
        doc.text(s.status, x + 5, rowY + 6, { width: colWidths[3], align: 'center' });
        rowY += 22;
      });

      doc.moveDown(1.5);
      doc
        .fillColor('#2C3E50')
        .fontSize(13)
        .text(`Promedio Global: ${report.globalAverage}`, { align: 'right' });

      doc
        .fillColor('#AAA')
        .fontSize(9)
        .text(
          `Generado el ${new Date().toLocaleDateString('es-ES')} — Sistema de Notas Estudiantiles`,
          50,
          doc.page.height - 40,
          { align: 'center' }
        );

      doc.end();
    });
  },
};

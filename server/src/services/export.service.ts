import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import { Response } from 'express';

export class ExportService {
  static async exportTasksPDF(res: Response, tasks: any[], employeeName: string) {
    const doc = new PDFDocument({ margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Tasks_Report_${employeeName.replace(/\s+/g, '_')}.pdf`);

    doc.pipe(res);

    // Title
    doc.fontSize(20).text(`Tasks Report - ${employeeName}`, { align: 'center' });
    doc.moveDown();

    tasks.forEach((task, idx) => {
      doc.fontSize(12).text(`${idx + 1}. [${task.status}] ${task.title}`, { underline: true });
      doc.fontSize(10).text(`Priority: ${task.priority} | Est. Hours: ${task.estimatedHours || 0}h | Actual Hours: ${task.actualHours || 0}h`);
      if (task.description) {
        doc.fontSize(10).text(`Description: ${task.description}`);
      }
      doc.moveDown();
    });

    doc.end();
  }

  static async exportTasksExcel(res: Response, tasks: any[], employeeName: string) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Tasks');

    worksheet.columns = [
      { header: 'Title', key: 'title', width: 30 },
      { header: 'Description', key: 'description', width: 40 },
      { header: 'Priority', key: 'priority', width: 15 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Estimated Hours', key: 'estimatedHours', width: 18 },
      { header: 'Actual Hours', key: 'actualHours', width: 18 },
      { header: 'Date', key: 'createdAt', width: 20 }
    ];

    tasks.forEach(task => {
      worksheet.addRow({
        title: task.title,
        description: task.description || '',
        priority: task.priority,
        status: task.status,
        estimatedHours: task.estimatedHours || 0,
        actualHours: task.actualHours || 0,
        createdAt: task.createdAt.toDateString()
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=Tasks_Report_${employeeName.replace(/\s+/g, '_')}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
  }

  static async exportTasksCSV(res: Response, tasks: any[], employeeName: string) {
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=Tasks_Report_${employeeName.replace(/\s+/g, '_')}.csv`);

    let csvContent = 'Title,Description,Priority,Status,Estimated Hours,Actual Hours,Created At\n';
    tasks.forEach(task => {
      const row = [
        `"${task.title.replace(/"/g, '""')}"`,
        `"${(task.description || '').replace(/"/g, '""')}"`,
        task.priority,
        task.status,
        task.estimatedHours || 0,
        task.actualHours || 0,
        task.createdAt.toDateString()
      ].join(',');
      csvContent += row + '\n';
    });

    res.send(csvContent);
  }
}

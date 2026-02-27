import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import * as puppeteer from 'puppeteer';
import { PrismaService } from '../../../core/prisma/prisma.service.js';
import { StorageService } from '../../../core/storage/storage.service.js';
import { NotificationsService } from '../../notifications/notifications.service.js';
import { PdfJobData } from '../reports.service.js';
import { adToBs, formatBsDate } from '../../../common/utils/nepali-date.util.js';
import { toNepaliDigits, formatBsDateEnglish } from '../../../common/utils/nepali-format.util.js';

@Processor('pdf-generation')
export class PdfProcessor extends WorkerHost {
  private readonly logger = new Logger(PdfProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly notifications: NotificationsService,
  ) {
    super();
  }

  async process(job: Job<PdfJobData>): Promise<void> {
    const { type, schoolId, userId, studentId, examId } = job.data;
    this.logger.log(`Processing PDF job ${job.id}: ${type}`);

    try {
      let html: string;
      let fileName: string;

      switch (type) {
        case 'marksheet':
          ({ html, fileName } = await this.buildMarksheetHtml(
            schoolId,
            studentId!,
            examId!,
          ));
          break;
        case 'grade-sheet':
          ({ html, fileName } = await this.buildGradeSheetHtml(
            schoolId,
            examId!,
          ));
          break;
        case 'ledger':
          ({ html, fileName } = await this.buildLedgerHtml(
            schoolId,
            studentId!,
          ));
          break;
        case 'character-certificate':
          ({ html, fileName } = await this.buildCharacterCertificateHtml(
            schoolId,
            studentId!,
          ));
          break;
        case 'transfer-certificate':
          ({ html, fileName } = await this.buildTransferCertificateHtml(
            schoolId,
            studentId!,
          ));
          break;
        default:
          throw new Error(`Unknown report type: ${type}`);
      }

      // Generate PDF with Puppeteer
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' },
      });
      await browser.close();

      // Upload to S3
      const folder = `reports/${schoolId}/${type}`;
      const uploadResult = await this.storage.uploadBuffer(
        Buffer.from(pdfBuffer),
        folder,
        'application/pdf',
      );
      const s3Key = uploadResult.s3Key;

      // Save file asset record
      await this.prisma.fileAsset.create({
        data: {
          schoolId,
          context: 'Report',
          contextId: examId || studentId || schoolId,
          fileName,
          mimeType: 'application/pdf',
          s3Key,
          sizeBytes: pdfBuffer.byteLength,
        },
      });

      // Notify user
      await this.notifications.create({
        schoolId,
        userId,
        type: 'SYSTEM',
        title: `${type.replace('-', ' ').toUpperCase()} Ready`,
        message: `Your ${type.replace('-', ' ')} report has been generated and is ready for download.`,
        entityName: 'Report',
        entityId: s3Key,
      });

      this.logger.log(`PDF job ${job.id} completed: ${fileName}`);
    } catch (error) {
      this.logger.error(
        `PDF job ${job.id} failed: ${(error as Error).message}`,
      );

      // Notify user of failure on final attempt
      if (job.attemptsMade >= (job.opts.attempts ?? 3) - 1) {
        await this.notifications.create({
          schoolId,
          userId,
          type: 'JOB_FAILED',
          title: 'Report Generation Failed',
          message: `Failed to generate ${type.replace('-', ' ')} report after ${job.attemptsMade + 1} attempts.`,
          entityName: 'Report',
          entityId: job.id,
        });
      }

      throw error;
    }
  }

  private async buildMarksheetHtml(
    schoolId: string,
    studentId: string,
    examId: string,
  ) {
    const [student, exam, results, school] = await Promise.all([
      this.prisma.replica.student.findFirst({
        where: { id: studentId, schoolId },
      }),
      this.prisma.replica.exam.findFirst({
        where: { id: examId, schoolId },
        include: { academicYear: true },
      }),
      this.prisma.replica.examResult.findMany({
        where: { examId, studentId, schoolId },
        include: { gradeSubject: { include: { subject: true, grade: true } } },
      }),
      this.prisma.replica.school.findUnique({ where: { id: schoolId } }),
    ]);

    const fileName = `marksheet_${student?.firstName}_${student?.lastName}_${Date.now()}.pdf`;

    const rows = results
      .map(
        (r: any) => `
        <tr>
          <td>${r.gradeSubject.subject.name}</td>
          <td>${r.theoryMarksObtained ?? '-'}</td>
          <td>${r.practicalMarksObtained ?? '-'}</td>
          <td>${r.totalPercentage ?? '-'}</td>
          <td>${r.finalGrade}</td>
          <td>${r.finalGradePoint}</td>
        </tr>`,
      )
      .join('');

    const gradeInfo = (results[0] as any)?.gradeSubject?.grade;

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Times New Roman', serif; margin: 0; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .header h1 { margin: 0; font-size: 24px; }
        .header h2 { margin: 5px 0; font-size: 18px; color: #333; }
        .info { margin-bottom: 20px; }
        .info p { margin: 4px 0; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        th, td { border: 1px solid #333; padding: 8px; text-align: center; }
        th { background-color: #f0f0f0; font-weight: bold; }
        .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${school?.name || 'School'}</h1>
        <h2>Student Marksheet</h2>
        <p>${exam?.academicYear?.name || ''} - ${exam?.name || ''}</p>
      </div>
      <div class="info">
        <p><strong>Student:</strong> ${student?.firstName} ${student?.lastName}</p>
        <p><strong>Grade:</strong> ${gradeInfo?.level ?? ''} ${gradeInfo?.section || ''}</p>
        <p><strong>Exam Type:</strong> ${exam?.examType}</p>
      </div>
      <table>
        <thead>
          <tr>
            <th>Subject</th>
            <th>Theory</th>
            <th>Practical</th>
            <th>Total</th>
            <th>Grade</th>
            <th>GPA</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <div class="footer">
        <p>Generated on ${new Date().toLocaleDateString()}</p>
      </div>
    </body>
    </html>`;

    return { html, fileName };
  }

  private async buildGradeSheetHtml(schoolId: string, examId: string) {
    const [exam, results, school] = await Promise.all([
      this.prisma.replica.exam.findFirst({
        where: { id: examId, schoolId },
        include: { academicYear: true },
      }),
      this.prisma.replica.examResult.findMany({
        where: { examId, schoolId },
        include: {
          student: true,
          gradeSubject: { include: { subject: true, grade: true } },
        },
        orderBy: { student: { lastName: 'asc' } },
      }),
      this.prisma.replica.school.findUnique({ where: { id: schoolId } }),
    ]);

    const fileName = `gradesheet_${exam?.name?.replace(/\s+/g, '_')}_${Date.now()}.pdf`;

    // Group by student
    const studentMap = new Map<string, any[]>();
    for (const r of results) {
      const key = r.studentId;
      if (!studentMap.has(key)) studentMap.set(key, []);
      studentMap.get(key)!.push(r);
    }

    let rows = '';
    for (const [, studentResults] of studentMap) {
      const first = studentResults[0];
      const gpa =
        studentResults.reduce(
          (sum: number, r: any) =>
            sum + (r.finalGradePoint?.toNumber?.() ?? r.finalGradePoint ?? 0),
          0,
        ) / studentResults.length;

      rows += `
        <tr>
          <td>${first.student.firstName} ${first.student.lastName}</td>
          ${studentResults.map((r: any) => `<td>${r.finalGrade} (${r.totalPercentage})</td>`).join('')}
          <td><strong>${gpa.toFixed(2)}</strong></td>
        </tr>`;
    }

    const subjects =
      results.length > 0
        ? [...new Set(results.map((r: any) => r.gradeSubject.subject.name))]
        : [];

    const gradeSheetGradeInfo = (results[0] as any)?.gradeSubject?.grade;

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; font-size: 11px; }
        .header { text-align: center; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #333; padding: 5px; text-align: center; }
        th { background-color: #f0f0f0; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${school?.name || 'School'}</h1>
        <h2>Grade Sheet - ${exam?.name || ''}</h2>
        <p>${exam?.academicYear?.name || ''} | Grade ${gradeSheetGradeInfo?.level ?? ''} ${gradeSheetGradeInfo?.section || ''}</p>
      </div>
      <table>
        <thead>
          <tr>
            <th>Student</th>
            ${subjects.map((s) => `<th>${s}</th>`).join('')}
            <th>GPA</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </body>
    </html>`;

    return { html, fileName };
  }

  private async buildLedgerHtml(schoolId: string, studentId: string) {
    const [student, invoices, school] = await Promise.all([
      this.prisma.replica.student.findFirst({
        where: { id: studentId, schoolId },
      }),
      this.prisma.replica.invoice.findMany({
        where: { studentId, schoolId },
        include: {
          lineItems: { include: { feeStructure: true } },
          payments: { where: { status: 'COMPLETED' } },
        },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.replica.school.findUnique({ where: { id: schoolId } }),
    ]);

    const fileName = `ledger_${student?.firstName}_${student?.lastName}_${Date.now()}.pdf`;

    const rows = invoices
      .map((inv) => {
        const paid = inv.payments.reduce(
          (s: number, p: any) => s + Number(p.amount),
          0,
        );
        return `
          <tr>
            <td>${inv.invoiceNo}</td>
            <td>${new Date(inv.createdAt).toLocaleDateString()}</td>
            <td>${inv.lineItems.map((li: any) => li.description || li.feeStructure.feeType).join(', ')}</td>
            <td>Rs. ${Number(inv.totalAmount).toLocaleString()}</td>
            <td>Rs. ${paid.toLocaleString()}</td>
            <td>Rs. ${(Number(inv.totalAmount) - paid).toLocaleString()}</td>
            <td>${inv.status}</td>
          </tr>`;
      })
      .join('');

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
        .header { text-align: center; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #333; padding: 8px; text-align: center; }
        th { background-color: #f0f0f0; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${school?.name || 'School'}</h1>
        <h2>Student Ledger</h2>
        <p>${student?.firstName} ${student?.lastName}</p>
      </div>
      <table>
        <thead>
          <tr>
            <th>Invoice #</th>
            <th>Date</th>
            <th>Description</th>
            <th>Total</th>
            <th>Paid</th>
            <th>Balance</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </body>
    </html>`;

    return { html, fileName };
  }

  // ===================================================================
  // NEB CHARACTER CERTIFICATE
  // ===================================================================

  private async buildCharacterCertificateHtml(
    schoolId: string,
    studentId: string,
  ) {
    const [student, school, enrollment] = await Promise.all([
      this.prisma.replica.student.findFirst({
        where: { id: studentId, schoolId },
      }),
      this.prisma.replica.school.findUnique({ where: { id: schoolId } }),
      this.prisma.replica.enrollment.findFirst({
        where: { studentId, student: { schoolId } },
        include: { grade: true, academicYear: true },
        orderBy: { enrolledAt: 'desc' },
      }),
    ]);

    const fileName = `character_certificate_${student?.firstName}_${student?.lastName}_${Date.now()}.pdf`;

    const now = new Date();
    const bsNow = adToBs(now);
    const bsDateStr = formatBsDateEnglish(bsNow.year, bsNow.month, bsNow.day);
    const bsDateNepali = `${toNepaliDigits(bsNow.year)}/${toNepaliDigits(String(bsNow.month).padStart(2, '0'))}/${toNepaliDigits(String(bsNow.day).padStart(2, '0'))}`;

    // BS DOB
    let dobBsStr = '–';
    if (student?.dobBsYear && student.dobBsMonth && student.dobBsDay) {
      dobBsStr = formatBsDateEnglish(student.dobBsYear, student.dobBsMonth, student.dobBsDay);
    } else if (student?.dob) {
      const bs = adToBs(new Date(student.dob));
      dobBsStr = formatBsDateEnglish(bs.year, bs.month, bs.day);
    }

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        @page { size: A4 landscape; margin: 0; }
        body { font-family: 'Times New Roman', serif; margin: 0; padding: 40px 60px; }
        .border { border: 3px double #1a3c6e; padding: 30px 40px; min-height: 500px; position: relative; }
        .header { text-align: center; margin-bottom: 25px; }
        .header h1 { font-size: 28px; margin: 0; color: #1a3c6e; text-transform: uppercase; }
        .header h2 { font-size: 20px; margin: 5px 0; color: #333; }
        .header h3 { font-size: 22px; margin: 10px 0 5px; text-decoration: underline; color: #8b0000; }
        .nepal-flag { font-size: 14px; color: #666; }
        .content { font-size: 16px; line-height: 2; margin: 20px 30px; }
        .content p { margin: 8px 0; }
        .field { font-weight: bold; text-decoration: underline; }
        .footer { display: flex; justify-content: space-between; margin-top: 50px; padding: 0 30px; }
        .footer div { text-align: center; }
        .footer .line { border-top: 1px solid #333; width: 200px; margin-top: 60px; padding-top: 5px; }
        .date-box { text-align: right; margin-top: 15px; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="border">
        <div class="header">
          <p class="nepal-flag">🇳🇵 नेपाल सरकार · शिक्षा, विज्ञान तथा प्रविधि मन्त्रालय</p>
          <h1>${school?.name || 'School Name'}</h1>
          <p>${school?.address || ''} · ${school?.phone || ''}</p>
          <h2>National Examinations Board (NEB)</h2>
          <h3>CHARACTER CERTIFICATE</h3>
        </div>

        <div class="content">
          <p>This is to certify that <span class="field">${student?.firstName} ${student?.lastName}</span>,
          son/daughter of <span class="field">______________________</span>,
          a resident of <span class="field">${student?.address || '______________________'}</span>,</p>

          <p>Date of Birth (BS): <span class="field">${dobBsStr}</span></p>

          <p>was a regular student of this institution in
          <span class="field">Grade ${enrollment?.grade?.level ?? '___'} (${enrollment?.grade?.stream ?? '___'})</span>
          during the academic year <span class="field">${enrollment?.academicYear?.name ?? '______'}</span>.</p>

          <p>Registration No: <span class="field">${student?.registrationNo || '____________'}</span></p>

          <p>During the period of study, the above-mentioned student was found to be of
          <span class="field">GOOD</span> moral character. He/She was regular and punctual in attendance
          and was not involved in any kind of disciplinary misconduct.</p>

          <p>I wish him/her every success in life.</p>
        </div>

        <div class="date-box">
          <p>Date (BS): ${bsDateStr}</p>
          <p>Date (BS Nepali): ${bsDateNepali}</p>
          <p>Date (AD): ${now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>

        <div class="footer">
          <div>
            <div class="line">Class Teacher</div>
          </div>
          <div>
            <div class="line">Exam In-Charge</div>
          </div>
          <div>
            <div class="line">Principal</div>
          </div>
        </div>
      </div>
    </body>
    </html>`;

    return { html, fileName };
  }

  // ===================================================================
  // NEB TRANSFER CERTIFICATE
  // ===================================================================

  private async buildTransferCertificateHtml(
    schoolId: string,
    studentId: string,
  ) {
    const [student, school, enrollment] = await Promise.all([
      this.prisma.replica.student.findFirst({
        where: { id: studentId, schoolId },
      }),
      this.prisma.replica.school.findUnique({ where: { id: schoolId } }),
      this.prisma.replica.enrollment.findFirst({
        where: { studentId, student: { schoolId } },
        include: { grade: true, academicYear: true },
        orderBy: { enrolledAt: 'desc' },
      }),
    ]);

    const fileName = `transfer_certificate_${student?.firstName}_${student?.lastName}_${Date.now()}.pdf`;

    const now = new Date();
    const bsNow = adToBs(now);
    const bsDateStr = formatBsDateEnglish(bsNow.year, bsNow.month, bsNow.day);

    let dobBsStr = '–';
    if (student?.dobBsYear && student.dobBsMonth && student.dobBsDay) {
      dobBsStr = formatBsDateEnglish(student.dobBsYear, student.dobBsMonth, student.dobBsDay);
    } else if (student?.dob) {
      const bs = adToBs(new Date(student.dob));
      dobBsStr = formatBsDateEnglish(bs.year, bs.month, bs.day);
    }

    const enrolledBs = enrollment?.enrolledAt
      ? formatBsDateEnglish(
          adToBs(new Date(enrollment.enrolledAt)).year,
          adToBs(new Date(enrollment.enrolledAt)).month,
          adToBs(new Date(enrollment.enrolledAt)).day,
        )
      : '–';

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        @page { size: A4; margin: 0; }
        body { font-family: 'Times New Roman', serif; margin: 0; padding: 40px 50px; }
        .border { border: 3px double #1a3c6e; padding: 25px 35px; }
        .header { text-align: center; margin-bottom: 20px; }
        .header h1 { font-size: 26px; margin: 0; color: #1a3c6e; }
        .header h3 { font-size: 20px; margin: 10px 0 5px; text-decoration: underline; color: #8b0000; }
        table.info { width: 100%; border-collapse: collapse; margin: 15px 0; }
        table.info td { padding: 6px 10px; font-size: 15px; border-bottom: 1px dotted #999; }
        table.info td.label { width: 40%; font-weight: bold; }
        .content { margin: 15px 20px; font-size: 15px; line-height: 1.8; }
        .footer { display: flex; justify-content: space-between; margin-top: 50px; padding: 0 20px; }
        .footer div { text-align: center; }
        .footer .line { border-top: 1px solid #333; width: 180px; margin-top: 60px; padding-top: 5px; }
        .tc-no { font-size: 13px; color: #666; }
      </style>
    </head>
    <body>
      <div class="border">
        <div class="header">
          <p>🇳🇵 नेपाल सरकार · शिक्षा, विज्ञान तथा प्रविधि मन्त्रालय</p>
          <h1>${school?.name || 'School Name'}</h1>
          <p>${school?.address || ''}</p>
          <h3>TRANSFER CERTIFICATE</h3>
          <p class="tc-no">T.C. No: ________</p>
        </div>

        <table class="info">
          <tr><td class="label">Name of Student</td><td>${student?.firstName} ${student?.lastName}</td></tr>
          <tr><td class="label">Registration No.</td><td>${student?.registrationNo || '–'}</td></tr>
          <tr><td class="label">Date of Birth (BS)</td><td>${dobBsStr}</td></tr>
          <tr><td class="label">Gender</td><td>${student?.gender || '–'}</td></tr>
          <tr><td class="label">Address</td><td>${student?.address || '–'}</td></tr>
          <tr><td class="label">Father's/Guardian's Name</td><td>______________________</td></tr>
          <tr><td class="label">Class/Grade at Admission</td><td>${enrollment?.grade?.level ?? '–'} (${enrollment?.grade?.stream ?? '–'})</td></tr>
          <tr><td class="label">Admitted On (BS)</td><td>${enrolledBs}</td></tr>
          <tr><td class="label">Class/Grade at Leaving</td><td>${enrollment?.grade?.level ?? '–'} (${enrollment?.grade?.stream ?? '–'})</td></tr>
          <tr><td class="label">Reason for Leaving</td><td>${student?.status === 'TRANSFERRED' ? 'Transfer' : student?.status === 'GRADUATED' ? 'Graduated' : '______________________'}</td></tr>
          <tr><td class="label">Character & Conduct</td><td>Good</td></tr>
          <tr><td class="label">Date of Issue (BS)</td><td>${bsDateStr}</td></tr>
        </table>

        <div class="content">
          <p>This is to certify that the above particulars are correct as per our school records.</p>
        </div>

        <div class="footer">
          <div>
            <div class="line">Class Teacher</div>
          </div>
          <div>
            <div class="line">Accountant<br>(No Dues)</div>
          </div>
          <div>
            <div class="line">Principal<br>(Seal)</div>
          </div>
        </div>
      </div>
    </body>
    </html>`;

    return { html, fileName };
  }
}

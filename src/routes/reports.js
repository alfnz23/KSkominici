const express = require('express');
const { Resend } = require('resend');
const fs = require('fs').promises;
const path = require('path');
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');

const router = express.Router();
const resend = new Resend(process.env.RESEND_API_KEY);

// Send report email
router.post('/send-email', [
  body('job_id').isInt({ min: 1 }).withMessage('Valid job_id is required'),
  body('report_id').isInt({ min: 1 }).withMessage('Valid report_id is required'),
  body('to_email').isEmail().withMessage('Valid to_email is required'),
  body('cc_email').optional().isEmail().withMessage('cc_email must be valid email if provided')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { job_id, report_id, to_email, cc_email } = req.body;

    // Verify report is finalized and PDF exists
    const reportQuery = `
      SELECT r.*, d.file_path, j.client_name, j.property_address
      FROM reports r
      LEFT JOIN documents d ON r.id = d.report_id AND d.document_type = 'final_pdf'
      LEFT JOIN jobs j ON r.job_id = j.id
      WHERE r.id = ? AND r.job_id = ? AND r.status = 'finalized'
    `;
    
    const [reportRows] = await pool.execute(reportQuery, [report_id, job_id]);
    
    if (reportRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Report not found or not finalized'
      });
    }

    const report = reportRows[0];
    
    if (!report.file_path) {
      return res.status(400).json({
        success: false,
        message: 'PDF document not found for this report'
      });
    }

    // Check if PDF file exists
    const pdfPath = path.join(process.cwd(), report.file_path);
    try {
      await fs.access(pdfPath);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'PDF file not accessible'
      });
    }

    // Read PDF file
    const pdfBuffer = await fs.readFile(pdfPath);
    const pdfBase64 = pdfBuffer.toString('base64');

    // Prepare email data
    const emailData = {
      from: process.env.FROM_EMAIL || 'reports@kskominici.cz',
      to: [to_email],
      subject: `Zpráva o kontrole komínů - ${report.client_name}`,
      html: `
        <h2>Zpráva o kontrole komínů</h2>
        <p>Dobrý den,</p>
        <p>v příloze zasíláme zprávu o provedené kontrole komínů pro objekt:</p>
        <p><strong>${report.property_address}</strong></p>
        <p>Kontrola byla provedena dne: ${new Date(report.created_at).toLocaleDateString('cs-CZ')}</p>
        <p>S pozdravem,<br>Tým KS Komínici</p>
      `,
      attachments: [
        {
          filename: `zprava_kontrola_${report_id}.pdf`,
          content: pdfBase64,
          type: 'application/pdf'
        }
      ]
    };

    if (cc_email) {
      emailData.cc = [cc_email];
    }

    let emailStatus = 'failed';
    let errorMessage = null;

    try {
      // Send email
      const emailResult = await resend.emails.send(emailData);
      emailStatus = 'sent';
      
      // Update job status to sent
      await pool.execute(
        'UPDATE jobs SET status = ? WHERE id = ?',
        ['sent', job_id]
      );

    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      errorMessage = emailError.message;
    }

    // Record in email_outbox
    await pool.execute(`
      INSERT INTO email_outbox (
        job_id, report_id, to_email, cc_email, subject, 
        status, error_message, sent_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      job_id,
      report_id,
      to_email,
      cc_email || null,
      emailData.subject,
      emailStatus,
      errorMessage,
      emailStatus === 'sent' ? new Date() : null
    ]);

    if (emailStatus === 'sent') {
      res.json({
        success: true,
        message: 'Email sent successfully',
        job_status: 'sent'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send email',
        error: errorMessage
      });
    }

  } catch (error) {
    console.error('Send report email error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
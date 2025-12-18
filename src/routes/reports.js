const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const db = require('../config/database');

/**
 * Save report (draft autosave)
 * POST /api/reports/save
 */
router.post('/save', [
  body('job_id').isInt({ min: 1 }).withMessage('Valid job_id is required'),
  body('report_kind').notEmpty().withMessage('Report kind is required'),
  body('data').isObject().withMessage('Data must be an object'),
  body('report_id').optional().isInt({ min: 1 }),
  body('sequence_no').optional().isInt({ min: 1 })
], async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { job_id, report_id, report_kind, sequence_no, data } = req.body;

    let resultReportId;

    if (!report_id) {
      // Create new report
      const insertQuery = `
        INSERT INTO reports (job_id, report_kind, sequence_no, data, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, 'draft', NOW(), NOW())
      `;
      
      const [result] = await db.execute(insertQuery, [
        job_id,
        report_kind,
        sequence_no || 1,
        JSON.stringify(data)
      ]);
      
      resultReportId = result.insertId;
    } else {
      // Update existing report
      const updateQuery = `
        UPDATE reports 
        SET data = ?, updated_at = NOW()
        WHERE id = ? AND job_id = ?
      `;
      
      const [result] = await db.execute(updateQuery, [
        JSON.stringify(data),
        report_id,
        job_id
      ]);
      
      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'Report not found or access denied'
        });
      }
      
      resultReportId = report_id;
    }

    res.json({
      success: true,
      message: 'Report saved successfully',
      data: {
        report_id: resultReportId
      }
    });

  } catch (error) {
    console.error('Error saving report:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
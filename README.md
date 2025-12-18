# KSkominici Backend API

Backend API for the KSkominici report management system.

## Features

- Report draft autosave functionality
- MySQL database integration
- Input validation
- Error handling
- Rate limiting
- CORS support

## Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env` and configure your database
4. Start the server: `npm run dev`

## API Endpoints

### Save Report
`POST /api/reports/save`

Save or update a report draft.

**Request Body:**
```json
{
  "job_id": 1,
  "report_id": 2, // optional - if not provided, creates new report
  "report_kind": "incident",
  "sequence_no": 1, // optional
  "data": {
    "content": "Report data object"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Report saved successfully",
  "data": {
    "report_id": 2
  }
}
```

## Database Schema

The API expects a `reports` table with the following structure:

```sql
CREATE TABLE reports (
  id INT PRIMARY KEY AUTO_INCREMENT,
  job_id INT NOT NULL,
  report_kind VARCHAR(255) NOT NULL,
  sequence_no INT DEFAULT 1,
  data JSON,
  status ENUM('draft', 'submitted', 'approved') DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## Development

- `npm run dev` - Start development server with nodemon
- `npm test` - Run tests
- `npm start` - Start production server
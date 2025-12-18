'use client';

import { useState, useEffect } from 'react';
import { PassportService } from '@/lib/services/passportService';

export default function SendPassportPackage({ jobId, onSuccess, onError }) {
  const [loading, setLoading] = useState(false);
  const [packageStatus, setPackageStatus] = useState(null);
  const [toEmail, setToEmail] = useState('');
  const [ccEmail, setCcEmail] = useState('');

  useEffect(() => {
    loadPackageStatus();
  }, [jobId]);

  const loadPackageStatus = async () => {
    try {
      const status = await PassportService.getJobPackageStatus(jobId);
      setPackageStatus(status);
      
      // Pre-fill client email if available
      if (status.job?.client_email) {
        setToEmail(status.job.client_email);
      }
    } catch (error) {
      console.error('Error loading package status:', error);
      onError?.(error.message);
    }
  };

  const handleSendPackage = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await PassportService.sendPassportPackage(jobId, toEmail, ccEmail);
      onSuccess?.(result);
      await loadPackageStatus(); // Refresh status
    } catch (error) {
      console.error('Error sending package:', error);
      onError?.(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!packageStatus) {
    return <div className="animate-pulse">Loading package status...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Send Passport Package
      </h3>

      {/* Package Status */}
      <div className="mb-6">
        <h4 className="font-medium text-gray-700 mb-2">Package Contents:</h4>
        <div className="space-y-2">
          {packageStatus.reports.map((report) => (
            <div key={report.id} className="flex items-center justify-between py-1">
              <span className="text-sm text-gray-600">
                {report.report_type} Report
              </span>
              <span className={`px-2 py-1 rounded-full text-xs ${
                report.status === 'completed' && report.pdf_path
                  ? 'bg-green-100 text-green-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {report.status === 'completed' && report.pdf_path ? 'Ready' : 'Pending'}
              </span>
            </div>
          ))}
          
          {packageStatus.invoice ? (
            <div className="flex items-center justify-between py-1">
              <span className="text-sm text-gray-600">Invoice</span>
              <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                Ready
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-between py-1">
              <span className="text-sm text-gray-600">Invoice</span>
              <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
                Not Available
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Send Status */}
      {packageStatus.job.status === 'sent' ? (
        <div className="mb-4 p-3 bg-green-100 border border-green-200 rounded-md">
          <p className="text-green-800 text-sm">
            ✅ Package already sent on {new Date(packageStatus.job.completed_at).toLocaleDateString()}
          </p>
        </div>
      ) : !packageStatus.readyToSend ? (
        <div className="mb-4 p-3 bg-yellow-100 border border-yellow-200 rounded-md">
          <p className="text-yellow-800 text-sm">
            ⚠️ Package not ready to send. Please ensure all reports are completed.
          </p>
        </div>
      ) : null}

      {/* Email Form */}
      {packageStatus.readyToSend && packageStatus.job.status !== 'sent' && (
        <form onSubmit={handleSendPackage} className="space-y-4">
          <div>
            <label htmlFor="toEmail" className="block text-sm font-medium text-gray-700">
              Send to Email *
            </label>
            <input
              type="email"
              id="toEmail"
              value={toEmail}
              onChange={(e) => setToEmail(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label htmlFor="ccEmail" className="block text-sm font-medium text-gray-700">
              CC Email (optional)
            </label>
            <input
              type="email"
              id="ccEmail"
              value={ccEmail}
              onChange={(e) => setCcEmail(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !toEmail}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Sending...
              </>
            ) : (
              'Send Passport Package'
            )}
          </button>
        </form>
      )}

      {/* Email History */}
      {packageStatus.emailHistory.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <h4 className="font-medium text-gray-700 mb-2">Email History:</h4>
          <div className="space-y-2">
            {packageStatus.emailHistory.map((email) => (
              <div key={email.id} className="text-sm text-gray-600">
                <div>To: {email.to_email}</div>
                {email.cc_email && <div>CC: {email.cc_email}</div>}
                <div>Sent: {new Date(email.sent_at).toLocaleString()}</div>
                <div>Attachments: {email.attachments_count}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
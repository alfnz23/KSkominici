<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Report;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ReportController extends Controller
{
    public function finalizeReport(Request $request): JsonResponse
    {
        $request->validate([
            'report_id' => 'required|integer|exists:reports,id'
        ]);

        $report = Report::with('job')->findOrFail($request->report_id);
        
        // Verify access (job assigned user, job creator, or admin)
        $user = auth()->user();
        
        if (!$user->hasRole('admin') && 
            $report->job->user_id !== $user->id && 
            $report->job->assigned_user_id !== $user->id) {
            return response()->json([
                'error' => 'Nemáte oprávnění k finalizaci tohoto reportu'
            ], 403);
        }

        // Set status to finalized
        $report->update(['status' => 'finalized']);

        return response()->json([
            'message' => 'Report byl úspěšně finalizován',
            'report' => $report->fresh(),
            'job_id' => $report->job_id
        ]);
    }
}
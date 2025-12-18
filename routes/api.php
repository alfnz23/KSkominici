<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\JobController;
use App\Http\Controllers\Api\ReportController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

// Auth routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    
    // Job routes
    Route::post('/jobs', [JobController::class, 'store']);
    Route::get('/jobs', [JobController::class, 'index']);
    Route::get('/jobs/{id}', [JobController::class, 'show']);
    Route::put('/jobs/{id}/assign', [JobController::class, 'assignJob']);
    
    // Report routes
    Route::post('/reports', [ReportController::class, 'store']);
    Route::get('/reports', [ReportController::class, 'index']);
    Route::get('/reports/{id}', [ReportController::class, 'show']);
    Route::put('/reports/{id}', [ReportController::class, 'update']);
    Route::post('/finalize-report', [ReportController::class, 'finalizeReport']);
});
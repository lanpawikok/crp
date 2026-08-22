<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\PrivateBalanceController;
use App\Http\Controllers\Api\JupiterController;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// Add the 'auth:sanctum' middleware so it can read the login session
Route::middleware(['auth:sanctum'])->group(function () {
    Route::get('/private-balance', [PrivateBalanceController::class, 'index']);
    Route::post('/private-balance/deposit', [PrivateBalanceController::class, 'deposit']);
    Route::post('/swap/quote', [JupiterController::class, 'quote']);
    Route::post('/swap/transaction', [JupiterController::class, 'swap']);
});
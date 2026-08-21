<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\PrivateBalanceController;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// Tambahkan middleware 'auth:sanctum' agar bisa membaca session login
Route::middleware(['auth:sanctum'])->group(function () {
    Route::get('/private-balance', [PrivateBalanceController::class, 'index']);
    Route::post('/private-balance/deposit', [PrivateBalanceController::class, 'deposit']);
});
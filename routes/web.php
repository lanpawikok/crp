<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\Admin\AdminController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Api\PrivateBalanceController;
use App\Http\Controllers\Api\JupiterController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// 1. LANDING PAGE
Route::get('/', function () {
    return Inertia::render('LandingPage');
})->name('landing');

// 2. DASHBOARD (Bisa diakses langsung via Connect)
Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
})->name('dashboard');

// 3. PROFILE & API ROUTES
Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

Route::get('/api/private-balance', [PrivateBalanceController::class, 'index']);
Route::post('/api/private-balance/deposit', [PrivateBalanceController::class, 'deposit']);
Route::post('/api/private-balance/deposit-solflare', [PrivateBalanceController::class, 'depositSolflare']);

Route::post('/api/swap/quote', [JupiterController::class, 'quote']);
Route::post('/api/swap/transaction', [JupiterController::class, 'swap']);

// ==========================================
// 4. ADMIN & USER MANAGEMENT ROUTES
// ==========================================
Route::prefix('admin')->name('admin.')->group(function () {
    Route::get('/dashboard', [AdminController::class, 'index'])->name('dashboard');
    Route::get('/users', [UserController::class, 'index'])->name('users.index');
    Route::post('/users', [UserController::class, 'store'])->name('users.store');
    Route::put('/users/{user}', [UserController::class, 'update'])->name('users.update');
    Route::delete('/users/{user}', [UserController::class, 'destroy'])->name('users.destroy');
});
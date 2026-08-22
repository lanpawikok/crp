<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\Admin\AdminController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Api\PrivateBalanceController;
use App\Http\Controllers\Api\JupiterController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// 1. MAIN PAGE (Redirect to Login / Register)
Route::redirect('/', '/register');

// 2. REGULAR USER DASHBOARD ROUTE (Requires login & verified)
Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

// 3. PROFILE ROUTES (Requires login)
Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::get('/api/private-balance', [PrivateBalanceController::class, 'index']);
    Route::post('/api/private-balance/deposit', [PrivateBalanceController::class, 'deposit']);
    Route::post('/api/private-balance/deposit-solflare', [PrivateBalanceController::class, 'depositSolflare']);

    // Jupiter swap uses the web auth session for consistency with private-balance.
    // The duplicate route in routes/api.php (auth:sanctum) returns 401 because
    // the SPA session is not recognized as stateful.
    Route::post('/api/swap/quote', [JupiterController::class, 'quote']);
    Route::post('/api/swap/transaction', [JupiterController::class, 'swap']);

});

// 4. AUTH ROUTES (LOGIN, REGISTER, LOGOUT)
Route::get('/login', function () {
    return Inertia::render('Auth/Login');
})->name('login')->middleware('guest');

Route::get('/register', function () {
    return Inertia::render('Auth/Register');
})->name('register')->middleware('guest');

Route::post('/logout', function () {
    auth()->logout();
    request()->session()->invalidate();
    request()->session()->regenerateToken();
    return redirect('/login');
})->name('logout')->middleware('auth');

// ==========================================
// 5. ADMIN & USER MANAGEMENT ROUTES
// ==========================================
Route::middleware(['auth', 'admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/dashboard', [AdminController::class, 'index'])->name('dashboard');
    Route::get('/users', [UserController::class, 'index'])->name('users.index');
    Route::post('/users', [UserController::class, 'store'])->name('users.store');
    Route::put('/users/{user}', [UserController::class, 'update'])->name('users.update');
    Route::delete('/users/{user}', [UserController::class, 'destroy'])->name('users.destroy');
});

// ==========================================

require __DIR__.'/auth.php';
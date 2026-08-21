<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use App\Models\User;

class AdminController extends Controller
{
    public function index()
    {
        // Hitung total user (opsional untuk dashboard)
        $totalUsers = User::count();

        return Inertia::render('Admin/Dashboard', [
            'totalUsers' => $totalUsers,
        ]);
    }
}
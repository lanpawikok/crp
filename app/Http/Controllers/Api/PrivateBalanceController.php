<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PrivateBalance;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class PrivateBalanceController extends Controller
{
    // Ambil saldo privat user yang sedang login
    public function index()
    {
        $user = Auth::user();
        $balance = PrivateBalance::firstOrCreate(
            ['user_id' => $user->id],
            ['balance' => 0]
        );

        return response()->json([
            'balance' => $balance->balance
        ]);
    }

    // Proses Deposit (Top Up)
    public function deposit(Request $request)
    {
        $request->validate([
            'amount' => 'required|numeric|min:0.000001'
        ]);

        $user = Auth::user();
        $balance = PrivateBalance::firstOrCreate(
            ['user_id' => $user->id],
            ['balance' => 0]
        );

        // Tambah saldo
        $balance->balance += $request->amount;
        $balance->save();

        return response()->json([
            'success' => true,
            'new_balance' => $balance->balance,
            'message' => 'Deposit berhasil!'
        ]);
    }
}
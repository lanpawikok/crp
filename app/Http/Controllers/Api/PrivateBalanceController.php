<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PrivateBalance;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class PrivateBalanceController extends Controller
{
    // Get the private balance of the currently logged-in user
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

    // Process Deposit (Top Up)
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

        // Add balance
        $balance->balance += $request->amount;
        $balance->save();

        return response()->json([
            'success' => true,
            'new_balance' => $balance->balance,
            'message' => 'Deposit successful!'
        ]);
    }
}
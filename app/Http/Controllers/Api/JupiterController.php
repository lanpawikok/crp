<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class JupiterController extends Controller
{
    private const BASE_URL = 'https://api.jup.ag/swap/v1';

    private function client()
    {
        return Http::withHeaders([
            'x-api-key' => config('services.jupiter.api_key'),
            'Accept' => 'application/json',
        ]);
    }

    public function quote(Request $request)
    {
        if (!config('services.jupiter.api_key')) {
            return response()->json([
                'error' => 'JUPITER_API_KEY belum dikonfigurasi di file .env server.',
            ], 503);
        }

        $data = $request->validate([
            'inputMint' => ['required', 'string'],
            'outputMint' => ['required', 'string'],
            'amount' => ['required', 'integer', 'min:1'],
            'slippageBps' => ['nullable', 'integer', 'min:1', 'max:5000'],
        ]);

        $response = $this->client()->get(self::BASE_URL . '/quote', [
            ...$data,
            'swapMode' => 'ExactIn',
            'restrictIntermediateTokens' => 'true',
            'maxAccounts' => 64,
            'instructionVersion' => 'V1',
        ]);

        return response()->json($response->json(), $response->status());
    }

    public function swap(Request $request)
    {
        if (!config('services.jupiter.api_key')) {
            return response()->json([
                'error' => 'JUPITER_API_KEY belum dikonfigurasi di file .env server.',
            ], 503);
        }

        $data = $request->validate([
            'quoteResponse' => ['required', 'array'],
            'userPublicKey' => ['required', 'string'],
        ]);

        $response = $this->client()->post(self::BASE_URL . '/swap', [
            'quoteResponse' => $data['quoteResponse'],
            'userPublicKey' => $data['userPublicKey'],
            'dynamicComputeUnitLimit' => true,
            'prioritizationFeeLamports' => [
                'priorityLevelWithMaxLamports' => [
                    'priorityLevel' => 'veryHigh',
                    'maxLamports' => 1000000,
                ],
            ],
        ]);

        $payload = $response->json();
        if (!$response->successful()) {
            return response()->json([
                'error' => $payload['error'] ?? $payload['message'] ?? 'Jupiter swap request gagal.',
                'details' => $payload,
            ], $response->status());
        }

        return response()->json($payload);
    }
}

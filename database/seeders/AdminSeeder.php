<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class AdminSeeder extends Seeder
{
    public function run(): void
    {
        // Cek apakah admin sudah ada, agar tidak duplicate
        $admin = User::where('email', 'admin@notracefi.test')->first();

        if (!$admin) {
            User::create([
                'name' => 'Super Admin',
                'email' => 'admin@notracefi.test',
                'password' => Hash::make('password123'), // Password: password123
                'email_verified_at' => now(),
                // Opsional: Jika kamu punya kolom 'role' atau 'is_admin' di database, tambahkan di sini.
                // Contoh: 'is_admin' => true,
            ]);

            $this->command->info('Akun Admin berhasil dibuat!');
        } else {
            $this->command->info('Akun Admin sudah ada sebelumnya.');
        }
    }
}
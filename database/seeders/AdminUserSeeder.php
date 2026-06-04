<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create admin user
        User::updateOrCreate(
            ['email' => 'admin@tlgc.edu.ph'],
            [
                'name' => 'Admin User',
                'password' => Hash::make('password123'),
                'role' => 'admin',
                'email_verified_at' => now(),
            ]
        );
        
        // Create cashier user
        User::updateOrCreate(
            ['email' => 'cashier@tlgc.edu.ph'],
            [
                'name' => 'Cashier User',
                'password' => Hash::make('password123'),
                'role' => 'cashier',
                'email_verified_at' => now(),
            ]
        );

        // Default credentials for development:
        // Admin:  admin@tlgc.edu.ph / password123
        // Cashier: cashier@tlgc.edu.ph / password123
        $this->command->info('Admin user created (admin@tlgc.edu.ph).');
        $this->command->info('Cashier user created (cashier@tlgc.edu.ph).');
    }
}

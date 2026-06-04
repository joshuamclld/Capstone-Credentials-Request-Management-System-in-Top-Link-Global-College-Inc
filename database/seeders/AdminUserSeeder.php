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
        User::updateOrCreate(
            ['email' => 'admin@tlgc.edu.ph'],
            [
                'name' => 'Admin User',
                'password' => Hash::make('Registrar@2026'),
                'role' => 'admin',
                'email_verified_at' => now(),
            ]
        );

        User::updateOrCreate(
            ['email' => 'cashier@tlgc.edu.ph'],
            [
                'name' => 'Cashier User',
                'password' => Hash::make('Cashier@2026'),
                'role' => 'cashier',
                'email_verified_at' => now(),
            ]
        );

        User::updateOrCreate(
            ['email' => 'sysadmin@tlgc.edu.ph'],
            [
                'name' => 'System Administrator',
                'password' => Hash::make('SysAdmin@2026'),
                'role' => 'system_admin',
                'email_verified_at' => now(),
            ]
        );

        $this->command->info('Admin user created (admin@tlgc.edu.ph).');
        $this->command->info('Cashier user created (cashier@tlgc.edu.ph).');
        $this->command->info('System Administrator created (sysadmin@tlgc.edu.ph).');
    }
}

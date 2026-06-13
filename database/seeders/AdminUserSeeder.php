<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AdminUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $adminPw = Str::random(16);
        User::updateOrCreate(
            ['email' => 'admin@tlgc.edu.ph'],
            [
                'name' => 'Registrar User',
                'password' => Hash::make($adminPw),
                'role' => 'registrar',
                'email_verified_at' => now(),
            ]
        );

        $cashierPw = Str::random(16);
        User::updateOrCreate(
            ['email' => 'cashier@tlgc.edu.ph'],
            [
                'name' => 'Cashier User',
                'password' => Hash::make($cashierPw),
                'role' => 'cashier',
                'email_verified_at' => now(),
            ]
        );

        $sysAdminPw = Str::random(16);
        User::updateOrCreate(
            ['email' => 'sysadmin@tlgc.edu.ph'],
            [
                'name' => 'System Administrator',
                'password' => Hash::make($sysAdminPw),
                'role' => 'system_admin',
                'email_verified_at' => now(),
            ]
        );

        $this->command->info('Registrar user created (admin@tlgc.edu.ph).');
        $this->command->info("Password: {$adminPw}");
        $this->command->info('Cashier user created (cashier@tlgc.edu.ph).');
        $this->command->info("Password: {$cashierPw}");
        $this->command->info('System Administrator created (sysadmin@tlgc.edu.ph).');
        $this->command->info("Password: {$sysAdminPw}");
    }
}

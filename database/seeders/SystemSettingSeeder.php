<?php

namespace Database\Seeders;

use App\Models\SystemSetting;
use Illuminate\Database\Seeder;

class SystemSettingSeeder extends Seeder
{
    public function run(): void
    {
        $settings = [
            'enable_online_payment' => 'true',
        ];

        foreach ($settings as $key => $value) {
            SystemSetting::setValue($key, $value);
        }

        $this->command->info('System settings seeded successfully.');
    }
}

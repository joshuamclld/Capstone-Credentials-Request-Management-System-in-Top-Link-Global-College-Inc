<?php

namespace Database\Seeders;

use App\Models\SystemSetting;
use Illuminate\Database\Seeder;

class SystemSettingSeeder extends Seeder
{
    public function run(): void
    {
        $settings = [
            'school_name' => 'Tarlac Luminary Global College',
            'school_address' => 'Tarlac City, Philippines',
            'processing_time_days' => '3',
            'enable_online_payment' => 'true',
            'enable_student_registration' => 'true',
            'max_requests_per_student' => '5',
            'notification_email' => '',
        ];

        foreach ($settings as $key => $value) {
            SystemSetting::setValue($key, $value);
        }

        $this->command->info('System settings seeded successfully.');
    }
}

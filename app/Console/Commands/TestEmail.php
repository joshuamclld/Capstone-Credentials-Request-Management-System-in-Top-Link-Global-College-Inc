<?php

namespace App\Console\Commands;

use App\Mail\StudentOtpMail;
use App\Models\Student;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;

class TestEmail extends Command
{
    protected $signature = 'test:email';
    protected $description = 'Send a test OTP email to verify SMTP configuration';

    public function handle()
    {
        $email = $this->ask('Enter your email address');

        $student = new Student([
            'first_name' => 'Test',
            'last_name' => 'Student',
            'email' => $email,
            'student_number' => 'TEST-000001',
        ]);

        $otp = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        $this->info("Sending test OTP ({$otp}) to {$email}...");

        try {
            Mail::to($email)->send(new StudentOtpMail($student, $otp));
            $this->info('Email sent successfully! Check your inbox.');
        } catch (\Exception $e) {
            $this->error('Failed to send email: ' . $e->getMessage());
            return 1;
        }

        return 0;
    }
}

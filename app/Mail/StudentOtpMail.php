<?php

namespace App\Mail;

use App\Models\Student;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class StudentOtpMail extends Mailable
{
    use Queueable, SerializesModels;

    public string $otp;
    public string $studentName;

    public function __construct(Student $student, string $otp)
    {
        $this->otp = $otp;
        $this->studentName = $student->first_name . ' ' . $student->last_name;
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Verify Your Email — CRMS OTP',
        );
    }

    public function content(): Content
    {
        return new Content(
            html: 'emails.student-otp',
        );
    }
}

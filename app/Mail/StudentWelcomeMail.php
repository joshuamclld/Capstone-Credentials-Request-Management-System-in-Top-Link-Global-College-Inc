<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class StudentWelcomeMail extends Mailable
{
    use Queueable, SerializesModels;

    public string $studentName;
    public string $studentNumber;
    public string $password;

    public function __construct(string $studentName, string $studentNumber, string $password)
    {
        $this->studentName = $studentName;
        $this->studentNumber = $studentNumber;
        $this->password = $password;
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Welcome to TLGC CRMS — Your Account Details',
        );
    }

    public function content(): Content
    {
        return new Content(
            html: 'emails.student-welcome',
        );
    }
}

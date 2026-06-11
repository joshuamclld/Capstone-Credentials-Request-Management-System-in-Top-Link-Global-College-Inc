<?php

namespace App\Mail;

use App\Models\StudentRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class DigitalDocumentMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public StudentRequest $request,
        public string $documentName,
        public string $filePath,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Your Requested Document - TLGC CRMS',
        );
    }

    public function content(): Content
    {
        return new Content(
            html: 'emails.digital-document',
            with: [
                'studentName' => $this->request->full_name,
                'documentName' => $this->documentName,
                'trackingNumber' => $this->request->tracking_number,
                'dateRequested' => $this->request->created_at->format('F d, Y'),
            ],
        );
    }

    public function attachments(): array
    {
        return [
            Attachment::fromPath(storage_path('app/private/' . $this->filePath)),
        ];
    }
}

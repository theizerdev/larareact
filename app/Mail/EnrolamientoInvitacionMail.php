<?php

namespace App\Mail;

use App\Models\Empleado;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class EnrolamientoInvitacionMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Empleado $empleado,
        public string $enrolamientoUrl,
        public string $empresaNombre = 'Smurfit Westrock'
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Invitación de Enrolamiento Biométrico - {$this->empresaNombre}",
        );
    }

    public function content(): Content
    {
        return new Content(
            html: 'emails.enrolamiento_invitacion',
        );
    }

    public function attachments(): array
    {
        return [];
    }
}

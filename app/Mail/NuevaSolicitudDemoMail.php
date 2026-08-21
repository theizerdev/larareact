<?php

namespace App\Mail;

use App\Models\SolicitudDemo;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class NuevaSolicitudDemoMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public SolicitudDemo $solicitud) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Nueva solicitud de demo — {$this->solicitud->empresa}",
            replyTo: [
                new Address($this->solicitud->correo, $this->solicitud->nombre),
            ],
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.solicitud-demo',
        );
    }
}

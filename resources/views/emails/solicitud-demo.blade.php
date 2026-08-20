<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="color-scheme" content="light">
    <title>Nueva solicitud de demo</title>
</head>
<body style="margin:0; padding:0; background-color:#eef0f7; font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; color:#12172b;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#eef0f7; padding:40px 16px;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:580px; background-color:#ffffff; border-radius:14px; overflow:hidden; border:1px solid #e3e6ef; box-shadow:0 1px 3px rgba(11,15,34,.06);">

                    {{-- Header --}}
                    <tr>
                        <td style="background-color:#0b0f22; padding:22px 32px;">
                            <img
                                src="{{ asset('image/logo/hosho/lockup-dark.png') }}"
                                alt="Hoshō"
                                height="22"
                                style="display:block; height:22px; width:auto; border:0;"
                            >
                        </td>
                    </tr>

                    {{-- Body --}}
                    <tr>
                        <td style="padding:32px 32px 8px;">
                            <span style="display:inline-block; padding:5px 12px; border-radius:999px; background-color:#edf0fd; color:#3b4fe0; font-family:'IBM Plex Mono',ui-monospace,SFMono-Regular,monospace; font-size:11px; font-weight:600; letter-spacing:.06em; text-transform:uppercase;">
                                Nueva solicitud de demo
                            </span>

                            <h1 style="margin:16px 0 4px; font-family:'Space Grotesk',ui-sans-serif,system-ui,sans-serif; font-size:22px; line-height:1.3; font-weight:700; color:#0b0f22;">
                                {{ $solicitud->empresa }}
                            </h1>
                            <p style="margin:0 0 24px; font-size:14px; color:#5b6478;">
                                Contacto: {{ $solicitud->nombre }}
                            </p>

                            {{-- Info grid --}}
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate; border-spacing:0 1px;">
                                <tr>
                                    <td width="50%" style="padding:14px 16px; background-color:#eef0f7; border-top-left-radius:10px; border-bottom-left-radius:10px; vertical-align:top;">
                                        <p style="margin:0 0 3px; font-family:'IBM Plex Mono',ui-monospace,monospace; font-size:10px; font-weight:600; letter-spacing:.06em; text-transform:uppercase; color:#8890a3;">Correo</p>
                                        <p style="margin:0; font-size:14px; font-weight:600; color:#12172b; word-break:break-word;">
                                            <a href="mailto:{{ $solicitud->correo }}" style="color:#12172b; text-decoration:none;">{{ $solicitud->correo }}</a>
                                        </p>
                                    </td>
                                    <td width="4"></td>
                                    <td width="50%" style="padding:14px 16px; background-color:#eef0f7; border-top-right-radius:10px; border-bottom-right-radius:10px; vertical-align:top;">
                                        <p style="margin:0 0 3px; font-family:'IBM Plex Mono',ui-monospace,monospace; font-size:10px; font-weight:600; letter-spacing:.06em; text-transform:uppercase; color:#8890a3;">Teléfono / WhatsApp</p>
                                        <p style="margin:0; font-size:14px; font-weight:600; color:#12172b;">{{ $solicitud->telefono }}</p>
                                    </td>
                                </tr>
                                <tr><td colspan="3" style="height:6px;"></td></tr>
                                <tr>
                                    <td width="50%" style="padding:14px 16px; background-color:#eef0f7; border-top-left-radius:10px; border-bottom-left-radius:10px; vertical-align:top;">
                                        <p style="margin:0 0 3px; font-family:'IBM Plex Mono',ui-monospace,monospace; font-size:10px; font-weight:600; letter-spacing:.06em; text-transform:uppercase; color:#8890a3;">Puntos de acceso</p>
                                        <p style="margin:0; font-size:14px; font-weight:600; color:#12172b;">{{ $solicitud->sitios_acceso }}</p>
                                    </td>
                                    <td width="4"></td>
                                    <td width="50%" style="padding:14px 16px; background-color:#eef0f7; border-top-right-radius:10px; border-bottom-right-radius:10px; vertical-align:top;">
                                        <p style="margin:0 0 3px; font-family:'IBM Plex Mono',ui-monospace,monospace; font-size:10px; font-weight:600; letter-spacing:.06em; text-transform:uppercase; color:#8890a3;">Área de interés</p>
                                        <p style="margin:0; font-size:14px; font-weight:600; color:#12172b;">{{ $solicitud->area_interes }}</p>
                                    </td>
                                </tr>
                            </table>

                            @if ($solicitud->mensaje)
                                <div style="margin-top:22px; padding:14px 16px; border-radius:8px; background-color:#f7f8fc; border-left:3px solid #3b4fe0;">
                                    <p style="margin:0 0 5px; font-family:'IBM Plex Mono',ui-monospace,monospace; font-size:10px; font-weight:600; letter-spacing:.06em; text-transform:uppercase; color:#3b4fe0;">Descripción del escenario operativo</p>
                                    <p style="margin:0; font-size:14px; line-height:1.6; color:#12172b; white-space:pre-line;">{{ $solicitud->mensaje }}</p>
                                </div>
                            @endif

                            {{-- CTA --}}
                            <table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0 8px;">
                                <tr>
                                    <td style="border-radius:8px; background-color:#3b4fe0;">
                                        <a href="mailto:{{ $solicitud->correo }}?subject={{ rawurlencode('Re: solicitud de demostración Hoshō — '.$solicitud->empresa) }}"
                                           style="display:inline-block; padding:12px 22px; font-size:14px; font-weight:700; color:#ffffff; text-decoration:none;">
                                            Responder a {{ explode(' ', $solicitud->nombre)[0] }} →
                                        </a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    {{-- Footer --}}
                    <tr>
                        <td style="padding:16px 32px 26px; border-top:1px solid #eef0f7;">
                            <p style="margin:0; font-size:12px; line-height:1.6; color:#8890a3;">
                                Recibido el {{ $solicitud->created_at->timezone('America/Mexico_City')->locale('es')->translatedFormat('d \d\e F \d\e Y, H:i') }} (hora de Ciudad de México), desde el formulario de contacto de la landing page de Hoshō.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>

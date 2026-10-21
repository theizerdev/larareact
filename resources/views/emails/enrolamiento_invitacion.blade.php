<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Enrolamiento Biométrico</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background-color: #f8fafc;
            color: #334155;
            margin: 0;
            padding: 24px;
        }
        .container {
            max-width: 580px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            border: 1px solid #e2e8f0;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
        }
        .header {
            background: linear-gradient(135deg, #4f46e5 0%, #3730a3 100%);
            padding: 32px 24px;
            text-align: center;
            color: #ffffff;
        }
        .header h1 {
            margin: 0;
            font-size: 22px;
            font-weight: 700;
        }
        .header p {
            margin: 8px 0 0 0;
            font-size: 14px;
            opacity: 0.9;
        }
        .body {
            padding: 32px 24px;
            line-height: 1.6;
        }
        .info-card {
            background-color: #f1f5f9;
            border-radius: 12px;
            padding: 16px 20px;
            margin: 20px 0;
        }
        .info-item {
            font-size: 14px;
            margin: 6px 0;
        }
        .info-label {
            font-weight: 600;
            color: #64748b;
        }
        .btn-container {
            text-align: center;
            margin: 32px 0;
        }
        .btn {
            display: inline-block;
            background-color: #4f46e5;
            color: #ffffff !important;
            font-weight: 600;
            font-size: 15px;
            text-decoration: none;
            padding: 14px 32px;
            border-radius: 10px;
            box-shadow: 0 2px 4px rgba(79, 70, 229, 0.3);
        }
        .instructions {
            background-color: #fefce8;
            border-left: 4px solid #eab308;
            padding: 12px 16px;
            border-radius: 6px;
            font-size: 13px;
            color: #713f12;
            margin: 20px 0;
        }
        .footer {
            border-top: 1px solid #e2e8f0;
            padding: 20px 24px;
            text-align: center;
            font-size: 12px;
            color: #94a3b8;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Enrolamiento de Colaborador</h1>
            <p>{{ $empresaNombre }}</p>
        </div>
        <div class="body">
            <p>Hola <strong>{{ $empleado->nombres }} {{ $empleado->apellidos }}</strong>,</p>
            <p>Has sido invitado(a) a registrar tus datos biométricos faciales para el sistema de control de asistencia y acceso a instalaciones.</p>
            
            <div class="info-card">
                <div class="info-item"><span class="info-label">Colaborador:</span> {{ $empleado->nombres }} {{ $empleado->apellidos }}</div>
                @if($empleado->documento_identidad)
                    <div class="info-item"><span class="info-label">No. Empleado:</span> {{ $empleado->documento_identidad }}</div>
                @endif
                @if($empleado->departamento)
                    <div class="info-item"><span class="info-label">Área / Depto:</span> {{ $empleado->departamento->nombre }}</div>
                @endif
            </div>

            <div class="instructions">
                <strong>Recomendaciones para tu registro:</strong>
                <ul style="margin: 6px 0 0 0; padding-left: 20px;">
                    <li>Ubícate en un lugar con buena iluminación frontal.</li>
                    <li>No uses lentes oscuros, gorra ni cubrebocas.</li>
                    <li>El proceso toma menos de 2 minutos desde tu celular o computadora.</li>
                </ul>
            </div>

            <div class="btn-container">
                <a href="{{ $enrolamientoUrl }}" class="btn">Iniciar Enrolamiento Facial</a>
            </div>

            <p style="font-size: 13px; color: #64748b;">
                O copia y pega el siguiente enlace en tu navegador:<br>
                <a href="{{ $enrolamientoUrl }}" style="color: #4f46e5; word-break: break-all;">{{ $enrolamientoUrl }}</a>
            </p>
        </div>
        <div class="footer">
            Este es un correo automático generado por el sistema de gestión de {{ $empresaNombre }}. Por favor no responder a este correo.
        </div>
    </div>
</body>
</html>

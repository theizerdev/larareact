<?php

namespace App\Services;

use App\Models\Empleado;
use App\Models\EmpleadoEnrolamientoCedula;
use App\Models\EmpleadoEnrolamientoLog;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class CedulaEnrolamientoService
{
    /**
     * Registra una acción auditable del flujo de enrolamiento (Aviso de Privacidad o Enrolamiento)
     * y la vincula a la cédula en proceso del colaborador.
     *
     * @param  array<string, mixed>  $contexto
     * @return array{cedula: EmpleadoEnrolamientoCedula, log: EmpleadoEnrolamientoLog}
     */
    public function registrarAccion(Empleado $empleado, string $accion, array $contexto = []): array
    {
        $empleado->loadMissing(['departamento', 'cargo', 'empresa']);

        $origen = (string) ($contexto['origen'] ?? 'kiosko');
        $ip = $contexto['ip_address'] ?? null;
        $userAgent = $contexto['user_agent'] ?? null;
        $latitud = isset($contexto['latitud']) && is_numeric($contexto['latitud']) ? (float) $contexto['latitud'] : null;
        $longitud = isset($contexto['longitud']) && is_numeric($contexto['longitud']) ? (float) $contexto['longitud'] : null;
        $userId = $contexto['user_id'] ?? null;
        $cedulaUuid = $contexto['cedula_uuid'] ?? null;

        $cedula = null;
        if (filled($cedulaUuid)) {
            $cedula = EmpleadoEnrolamientoCedula::withoutTenant()
                ->where('uuid', $cedulaUuid)
                ->where('empleado_id', $empleado->id)
                ->first();
        }

        if (! $cedula) {
            $cedula = EmpleadoEnrolamientoCedula::create([
                'uuid' => (string) Str::uuid(),
                'empresa_id' => $empleado->empresa_id,
                'sucursal_id' => $empleado->sucursal_id,
                'empleado_id' => $empleado->id,
                'user_id' => $userId,
                'origen' => $origen,
                'estado' => EmpleadoEnrolamientoCedula::ESTADO_EN_PROCESO,
                'no_empleado' => $empleado->codigo_nuevo ?: $empleado->documento_identidad,
                'codigo_legacy' => $empleado->legacy ?: $empleado->codigo_anterior,
                'nombre_completo' => $empleado->nombre_completo,
                'area_departamento' => $empleado->departamento?->nombre ?? 'General',
                'puesto_cargo' => $empleado->cargo?->nombre ?? 'Operativo',
                'correo' => $empleado->correo,
                'ip_address' => $ip,
                'user_agent' => $userAgent,
                'latitud' => $latitud,
                'longitud' => $longitud,
            ]);
        }

        $ahora = now();
        $etiqueta = match ($accion) {
            EmpleadoEnrolamientoLog::ACCION_AVISO_PRIVACIDAD => 'Aviso de Privacidad',
            EmpleadoEnrolamientoLog::ACCION_ENROLAMIENTO => 'Enrolamiento',
            default => ucfirst(str_replace('_', ' ', $accion)),
        };

        $descripcion = match ($accion) {
            EmpleadoEnrolamientoLog::ACCION_AVISO_PRIVACIDAD => "El colaborador {$empleado->nombre_completo} aceptó el Aviso de Privacidad Biométrico.",
            EmpleadoEnrolamientoLog::ACCION_ENROLAMIENTO => "Se finalizó el enrolamiento biométrico facial de {$empleado->nombre_completo} y su sincronización con BioTime.",
            default => "Acción {$etiqueta} registrada para {$empleado->nombre_completo}.",
        };

        $logUuid = (string) Str::uuid();
        $metadata = $contexto['metadata'] ?? [];

        $hashEvento = hash('sha256', json_encode([
            'log_uuid' => $logUuid,
            'cedula_uuid' => $cedula->uuid,
            'empleado_id' => $empleado->id,
            'no_empleado' => $cedula->no_empleado,
            'codigo_legacy' => $cedula->codigo_legacy,
            'accion' => $accion,
            'origen' => $origen,
            'ip' => $ip,
            'user_agent' => $userAgent,
            'latitud' => $latitud,
            'longitud' => $longitud,
            'ocurrido_en' => $ahora->toIso8601String(),
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));

        $log = EmpleadoEnrolamientoLog::create([
            'uuid' => $logUuid,
            'cedula_id' => $cedula->id,
            'empleado_id' => $empleado->id,
            'empresa_id' => $empleado->empresa_id,
            'user_id' => $userId,
            'accion' => $accion,
            'etiqueta' => $etiqueta,
            'descripcion' => $descripcion,
            'origen' => $origen,
            'ip_address' => $ip,
            'user_agent' => $userAgent,
            'latitud' => $latitud,
            'longitud' => $longitud,
            'metadata' => $metadata,
            'hash_evento' => $hashEvento,
            'ocurrido_en' => $ahora,
        ]);

        if ($accion === EmpleadoEnrolamientoLog::ACCION_AVISO_PRIVACIDAD) {
            $cedula->update([
                'aviso_privacidad_aceptado_en' => $ahora,
                'ip_address' => $ip ?: $cedula->ip_address,
                'user_agent' => $userAgent ?: $cedula->user_agent,
                'latitud' => $latitud ?? $cedula->latitud,
                'longitud' => $longitud ?? $cedula->longitud,
            ]);
        }

        // Registrar también en spatie/laravel-activitylog para el Monitoreo de Actividades
        activity('enrolamiento')
            ->causedBy($userId ? \App\Models\User::find($userId) : null)
            ->performedOn($empleado)
            ->event($accion)
            ->withProperties([
                'accion' => $accion,
                'etiqueta' => $etiqueta,
                'cedula_uuid' => $cedula->uuid,
                'log_uuid' => $log->uuid,
                'hash_evento' => $hashEvento,
                'origen' => $origen,
                'ip_address' => $ip,
                'user_agent' => $userAgent,
                'url' => request()?->fullUrl(),
                'method' => request()?->method(),
                'tabla' => 'empleados',
                'identificador_registro' => "{$empleado->nombre_completo} (No. {$cedula->no_empleado})",
                'latitud' => $latitud,
                'longitud' => $longitud,
            ])
            ->log($descripcion);

        return [
            'cedula' => $cedula->fresh(),
            'log' => $log,
        ];
    }

    /**
     * Finaliza el proceso: registra la acción de Enrolamiento, genera el Sello Digital (HMAC-SHA256)
     * con todos los elementos de los logs y las fotografías, genera la Cédula PDF y la guarda
     * en el expediente del colaborador.
     *
     * @param  array<string, mixed>  $contexto
     */
    public function completarYGenerarCedula(Empleado $empleado, array $contexto = []): EmpleadoEnrolamientoCedula
    {
        $empleado->loadMissing(['departamento', 'cargo', 'empresa', 'sucursal']);

        // Si por alguna razón no existía log previo de Aviso de Privacidad en esta cédula, lo aseguramos
        $cedulaUuid = $contexto['cedula_uuid'] ?? null;
        $cedula = filled($cedulaUuid)
            ? EmpleadoEnrolamientoCedula::withoutTenant()
                ->where('uuid', $cedulaUuid)
                ->where('empleado_id', $empleado->id)
                ->first()
            : null;

        if (! $cedula || ! $cedula->logs()->where('accion', EmpleadoEnrolamientoLog::ACCION_AVISO_PRIVACIDAD)->exists()) {
            $resAviso = $this->registrarAccion($empleado, EmpleadoEnrolamientoLog::ACCION_AVISO_PRIVACIDAD, $contexto + [
                'cedula_uuid' => $cedula?->uuid,
            ]);
            $cedula = $resAviso['cedula'];
        }

        // Registrar la acción de Enrolamiento
        $resEnrol = $this->registrarAccion($empleado, EmpleadoEnrolamientoLog::ACCION_ENROLAMIENTO, $contexto + [
            'cedula_uuid' => $cedula->uuid,
            'metadata' => [
                'biotime_sincronizado' => true,
                'genero' => $empleado->genero,
                'fecha_nacimiento' => $empleado->fecha_nacimiento?->format('Y-m-d'),
            ],
        ]);
        $cedula = $resEnrol['cedula'];

        $foto1Bin = $this->leerBinarioStorage($empleado->foto_empleado);
        $foto2Bin = $this->leerBinarioStorage($empleado->foto_empleado_2);

        $foto1Hash = $foto1Bin !== null ? hash('sha256', $foto1Bin) : null;
        $foto2Hash = $foto2Bin !== null ? hash('sha256', $foto2Bin) : null;

        $logs = $cedula->logs()->get();
        $enroladoEn = $empleado->enrolado_en ?? now();

        // Construir payload determinístico para la Firma Digital / Sello de Integridad
        $selloPayload = [
            'cedula_uuid' => $cedula->uuid,
            'empleado_id' => $empleado->id,
            'no_empleado' => $empleado->codigo_nuevo ?: $empleado->documento_identidad,
            'codigo_legacy' => $empleado->legacy ?: $empleado->codigo_anterior,
            'nombre_completo' => $empleado->nombre_completo,
            'empresa_id' => $empleado->empresa_id,
            'origen' => $cedula->origen,
            'aviso_privacidad_aceptado_en' => $cedula->aviso_privacidad_aceptado_en?->toIso8601String(),
            'enrolado_en' => $enroladoEn->toIso8601String(),
            'foto_1_hash' => $foto1Hash,
            'foto_2_hash' => $foto2Hash,
            'logs' => $logs->map(fn (EmpleadoEnrolamientoLog $l) => [
                'uuid' => $l->uuid,
                'accion' => $l->accion,
                'hash_evento' => $l->hash_evento,
                'ocurrido_en' => $l->ocurrido_en?->toIso8601String(),
                'ip_address' => $l->ip_address,
            ])->values()->all(),
        ];

        $selloDigital = hash_hmac(
            'sha256',
            json_encode($selloPayload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
            (string) config('app.key'),
        );

        $cedula->update([
            'estado' => EmpleadoEnrolamientoCedula::ESTADO_COMPLETADO,
            'no_empleado' => $empleado->codigo_nuevo ?: $empleado->documento_identidad,
            'codigo_legacy' => $empleado->legacy ?: $empleado->codigo_anterior,
            'nombre_completo' => $empleado->nombre_completo,
            'area_departamento' => $empleado->departamento?->nombre ?? 'General',
            'puesto_cargo' => $empleado->cargo?->nombre ?? 'Operativo',
            'correo' => $empleado->correo,
            'enrolado_en' => $enroladoEn,
            'foto_1_path' => $empleado->foto_empleado,
            'foto_2_path' => $empleado->foto_empleado_2,
            'foto_1_hash' => $foto1Hash,
            'foto_2_hash' => $foto2Hash,
            'sello_digital' => $selloDigital,
            'sello_payload' => $selloPayload,
        ]);

        // Generar y guardar el PDF de la Cédula en el expediente del colaborador
        $pdfPath = $this->generarYGuardarPdf($cedula->fresh(), $empleado, $logs, $foto1Bin, $foto2Bin);
        $cedula->update(['pdf_path' => $pdfPath]);

        return $cedula->fresh(['logs']);
    }

    public function regenerarPdf(EmpleadoEnrolamientoCedula $cedula, Empleado $empleado): string
    {
        $empleado->loadMissing(['empresa', 'sucursal']);

        return $this->generarYGuardarPdf(
            $cedula,
            $empleado,
            $cedula->logs()->get(),
            $this->leerBinarioStorage($cedula->foto_1_path),
            $this->leerBinarioStorage($cedula->foto_2_path),
        );
    }

    /**
     * Renderiza la vista Blade de la Cédula a PDF y la almacena en el expediente público.
     */
    private function generarYGuardarPdf(
        EmpleadoEnrolamientoCedula $cedula,
        Empleado $empleado,
        $logs,
        ?string $foto1Bin,
        ?string $foto2Bin,
    ): string {
        $zonaHoraria = $empleado->sucursal?->zona_horaria
            ?? $empleado->empresa?->zona_horaria
            ?? config('app.timezone', 'America/Mexico_City');

        $empresaNombre = $empleado->empresa?->razon_social
            ?? $empleado->empresa?->nombre_comercial
            ?? 'Smurfit Westrock';

        $fechaEmision = ($cedula->created_at ?? now())->timezone($zonaHoraria)->format('d/m/Y H:i:s');
        $fechaValidacion = ($cedula->enrolado_en ?? now())->timezone($zonaHoraria)->format('d/m/Y H:i:s');

        $foto1DataUri = $foto1Bin ? 'data:image/jpeg;base64,' . base64_encode($foto1Bin) : null;
        $foto2DataUri = $foto2Bin ? 'data:image/jpeg;base64,' . base64_encode($foto2Bin) : null;

        $pdf = Pdf::loadView('pdf.cedula-enrolamiento', [
            'cedula' => $cedula,
            'empleado' => $empleado,
            'numeroTarjeta' => $empleado->numeroTarjeta(),
            'logs' => $logs,
            'empresaNombre' => $empresaNombre,
            'zonaHoraria' => $zonaHoraria,
            'fechaEmision' => $fechaEmision,
            'fechaValidacion' => $fechaValidacion,
            'foto1DataUri' => $foto1DataUri,
            'foto2DataUri' => $foto2DataUri,
        ])->setPaper('letter', 'portrait');

        $relativePath = "expedientes/enrolamiento/empleado-{$empleado->id}/cedula-{$cedula->uuid}.pdf";
        Storage::disk('public')->put($relativePath, $pdf->output());

        return '/storage/' . $relativePath;
    }

    private function leerBinarioStorage(?string $ruta): ?string
    {
        if (blank($ruta)) {
            return null;
        }

        $rel = preg_replace('#^/?(storage/)+#', '', ltrim($ruta, '/'));
        if (Storage::disk('public')->exists($rel)) {
            return Storage::disk('public')->get($rel);
        }

        return null;
    }
}

<?php

namespace App\Http\Controllers;

use App\Models\FirmaDocumento;
use App\Models\KycValidacion;
use App\Models\OperacionValidacion;
use App\Services\Validaciones\DiditSincronizador;
use App\Services\Validaciones\FirmaService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;

/**
 * Liga pública de seguimiento de un folio: la persona termina aquí los pasos
 * que no se pueden hacer dentro del alta (verificación DIDIT hospedada y
 * firma ZapSign). La misma liga se abre en la PC o en el teléfono por QR; la
 * página consulta /estado cada pocos segundos y avanza sola.
 */
class ValidacionSeguimientoController extends Controller
{
    /** Segundos mínimos entre consultas directas a DIDIT / ZapSign por elemento. */
    private const INTERVALO_SINCRONIZACION = 20;

    public function show(string $token)
    {
        $operacion = OperacionValidacion::porTokenSeguimiento($token);

        if (! $operacion) {
            return Inertia::render('preregistro/InvalidToken', [
                'error' => __('The validation link is invalid or has expired.'),
            ]);
        }

        return Inertia::render('validacion/Seguimiento', [
            'token' => $token,
            'url' => route('validacion.seguimiento', $token),
            'qr_svg' => OperacionValidacion::qrSvg(route('validacion.seguimiento', $token)),
            'empresa' => $operacion->empresa()->withoutGlobalScopes()->value('nombre'),
            'estado' => $this->estadoDe($operacion),
        ]);
    }

    public function estado(string $token)
    {
        $operacion = OperacionValidacion::porTokenSeguimiento($token);

        if (! $operacion) {
            return response()->json(['message' => __('The validation link is invalid or has expired.')], 404);
        }

        $this->sincronizarPendientes($operacion);

        return response()->json($this->estadoDe($operacion->fresh()));
    }

    /**
     * Respaldo del webhook: si algo sigue pendiente, se pregunta directo al
     * proveedor, como mucho una vez cada INTERVALO_SINCRONIZACION segundos.
     */
    private function sincronizarPendientes(OperacionValidacion $operacion): void
    {
        $operacion->kycValidaciones()->withoutGlobalScopes()
            ->where('proveedor', KycValidacion::PROVEEDOR_DIDIT)
            ->whereNotNull('didit_session_id')
            ->whereIn('estatus', [KycValidacion::ESTATUS_PENDIENTE, KycValidacion::ESTATUS_PROCESANDO])
            ->get()
            ->each(function (KycValidacion $v) {
                if (Cache::add('seguimiento:didit:'.$v->id, 1, self::INTERVALO_SINCRONIZACION)) {
                    DiditSincronizador::sincronizar($v);
                }
            });

        $operacion->firmaDocumentos()->withoutGlobalScopes()
            ->where('estatus', FirmaDocumento::ESTATUS_PENDIENTE)
            ->whereNotNull('zapsign_doc_token')
            ->get()
            ->each(function (FirmaDocumento $f) {
                if (Cache::add('seguimiento:firma:'.$f->id, 1, self::INTERVALO_SINCRONIZACION)) {
                    FirmaService::sincronizar($f);
                }
            });
    }

    private function estadoDe(OperacionValidacion $operacion): array
    {
        $identidad = $operacion->kycValidaciones()->withoutGlobalScopes()
            ->with('validable')
            ->orderBy('id')
            ->get()
            ->map(fn (KycValidacion $v) => [
                'id' => $v->id,
                'persona' => trim(($v->validable->nombres ?? '').' '.($v->validable->apellidos ?? '')) ?: null,
                'proveedor' => $v->proveedor ?: KycValidacion::PROVEEDOR_JAAK,
                'tipo_documento' => $v->tipo_documento,
                'estatus' => $v->estatus,
                // La liga de DIDIT sólo se entrega mientras falte que la persona la haga.
                'accion_url' => $v->esDidit() && ! $v->estaFinalizada() && in_array($v->didit_estatus, [null, 'Not Started', 'In Progress', 'Resubmitted', 'Awaiting User'], true)
                    ? $v->didit_url
                    : null,
            ])
            ->values();

        $firmas = $operacion->firmaDocumentos()->withoutGlobalScopes()
            ->orderBy('id')
            ->get()
            ->map(fn (FirmaDocumento $f) => [
                'id' => $f->id,
                'nombre_documento' => $f->nombre_documento,
                'firmante' => $f->firmante_nombre,
                'estatus' => $f->estatus,
                'accion_url' => $f->estatus === FirmaDocumento::ESTATUS_PENDIENTE ? $f->sign_url : null,
            ])
            ->values();

        return [
            'folio' => $operacion->folio,
            'estatus' => $operacion->estatus,
            'identidad' => $identidad,
            'firmas' => $firmas,
            'expira_en' => optional($operacion->token_expira_en)->toIso8601String(),
        ];
    }
}

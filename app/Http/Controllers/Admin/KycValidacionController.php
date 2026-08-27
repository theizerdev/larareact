<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Jobs\ProcesarKycValidacion;
use App\Models\KycValidacion;
use Illuminate\Http\Request;

class KycValidacionController extends Controller
{
    /**
     * Listado de validaciones de identidad (KYC) de las personas de la empresa.
     * El scope multitenant lo aplica el trait Multitenantable del modelo.
     */
    public function index(Request $request)
    {
        $filtros = $request->validate([
            'estatus' => 'nullable|string|in:pendiente,procesando,aprobado,revision,rechazado,error',
            'q' => 'nullable|string|max:100',
        ]);

        $validaciones = KycValidacion::query()
            ->with('validable')
            ->when($filtros['estatus'] ?? null, fn ($q, $e) => $q->where('estatus', $e))
            ->when($filtros['q'] ?? null, function ($q, $term) {
                $q->where(function ($sub) use ($term) {
                    $sub->where('curp_capturada', 'like', "%{$term}%")
                        ->orWhere('jaak_session_id', 'like', "%{$term}%");
                });
            })
            ->latest('id')
            ->paginate(20)
            ->withQueryString()
            ->through(fn (KycValidacion $v) => $this->transformar($v));

        return inertia('admin/integrations/kyc-validaciones', [
            'validaciones' => $validaciones,
            'filtros' => $filtros,
            'puede_revalidar' => $request->user()->can('kyc.manage'),
        ]);
    }

    /**
     * Vuelve a lanzar el flujo KYC creando una validación nueva para la misma persona.
     */
    public function reprocesar(Request $request, KycValidacion $kycValidacion)
    {
        $persona = $kycValidacion->validable;

        if (! $persona) {
            return back()->with('notification', [
                'type' => 'error',
                'message' => __('The associated person no longer exists.'),
            ]);
        }

        $nueva = KycValidacion::create([
            'validable_type' => $kycValidacion->validable_type,
            'validable_id' => $kycValidacion->validable_id,
            'empresa_id' => $kycValidacion->empresa_id,
            'sucursal_id' => $kycValidacion->sucursal_id,
            'curp_capturada' => $kycValidacion->curp_capturada,
            'jaak_environment' => $kycValidacion->jaak_environment,
            'estatus' => KycValidacion::ESTATUS_PENDIENTE,
        ]);

        $persona->forceFill(['kyc_estatus' => KycValidacion::ESTATUS_PENDIENTE])->saveQuietly();

        ProcesarKycValidacion::dispatch($nueva)->afterResponse();

        return back()->with('notification', [
            'type' => 'success',
            'message' => __('KYC re-validation queued.'),
        ]);
    }

    private function transformar(KycValidacion $v): array
    {
        $persona = $v->validable;

        return [
            'id' => $v->id,
            'persona_nombre' => $persona
                ? trim(($persona->nombres ?? '').' '.($persona->apellidos ?? '')) ?: ('#'.$v->validable_id)
                : __('(deleted)'),
            'persona_tipo' => class_basename($v->validable_type),
            'curp_capturada' => $v->curp_capturada,
            'estatus' => $v->estatus,
            'curp_valida' => $v->curp_valida,
            'ine_valida' => $v->ine_valida,
            'rostro_coincide' => $v->rostro_coincide,
            'en_listas' => $v->en_listas,
            'score_global' => $v->score_global !== null ? (float) $v->score_global : null,
            'observaciones' => $v->observaciones,
            'error_detalle' => $v->error_detalle,
            'jaak_environment' => $v->jaak_environment,
            'jaak_session_id' => $v->jaak_session_id,
            'procesado_en' => optional($v->procesado_en)->toDateTimeString(),
            'created_at' => optional($v->created_at)->toDateTimeString(),
            'resultado_documento' => $v->resultado_documento,
            'resultado_ocr' => $v->resultado_ocr,
            'resultado_listas' => $v->resultado_listas,
            'resultado_biometrico' => $v->resultado_biometrico,
        ];
    }
}

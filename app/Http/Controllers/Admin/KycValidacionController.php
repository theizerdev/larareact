<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Jobs\ProcesarKycValidacion;
use App\Jobs\IniciarTruoraCheck;
use App\Services\Validaciones\DiditSincronizador;
use App\Services\Validaciones\TruoraSincronizador;
use App\Models\KycValidacion;
use App\Models\OperacionValidacion;
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
            'proveedor' => 'nullable|string|in:jaak,didit,truora',
            'q' => 'nullable|string|max:100',
        ]);

        // Sin worker ni scheduler: los antecedentes abiertos se consultan al abrir la pantalla.
        TruoraSincronizador::sincronizarPendientes(
            KycValidacion::query()->where('proveedor', KycValidacion::PROVEEDOR_TRUORA)
                ->whereIn('estatus', [KycValidacion::ESTATUS_PENDIENTE, KycValidacion::ESTATUS_PROCESANDO])
                ->latest('id')->limit(20)->get()
        );

        $validaciones = KycValidacion::query()
            ->with(['validable', 'operacion'])
            ->when($filtros['estatus'] ?? null, fn ($q, $e) => $q->where('estatus', $e))
            ->when($filtros['proveedor'] ?? null, fn ($q, $p) => $q->where('proveedor', $p))
            ->when($filtros['q'] ?? null, function ($q, $term) {
                $q->where(function ($sub) use ($term) {
                    $sub->where('curp_capturada', 'like', "%{$term}%")
                        ->orWhere('jaak_session_id', 'like', "%{$term}%")
                        ->orWhere('didit_session_id', 'like', "%{$term}%")
                        ->orWhere('truora_check_id', 'like', "%{$term}%")
                        ->orWhereHas('operacion', fn ($o) => $o->where('folio', 'like', "%{$term}%"));
                });
            })
            ->latest('id')
            ->paginate(20)
            ->withQueryString()
            ->through(fn (KycValidacion $v) => $this->transformar($v));

        return inertia('admin/validaciones/index', [
            'validaciones' => $validaciones,
            'filtros' => $filtros,
            'puede_revalidar' => $request->user()->can('validaciones.manage'),
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

        // DIDIT: si la persona aún no termina, sólo se consulta el estatus; si
        // ya terminó, se abre una sesión nueva que se le ofrece en la liga de
        // seguimiento del folio.
        if ($kycValidacion->esDidit() && ! $kycValidacion->estaFinalizada()) {
            $cambio = DiditSincronizador::sincronizar($kycValidacion);

            return back()->with('notification', [
                'type' => 'success',
                'message' => $cambio ? __('DIDIT status updated.') : __('DIDIT has no new result yet.'),
            ]);
        }

        // TRUORA: si el check sigue abierto sólo se consulta; si ya terminó se abre otro.
        if ($kycValidacion->esTruora() && ! $kycValidacion->estaFinalizada()) {
            $cambio = TruoraSincronizador::sincronizar($kycValidacion);

            return back()->with('notification', [
                'type' => 'success',
                'message' => $cambio ? __('Background check updated.') : __('TRUORA has no new result yet.'),
            ]);
        }

        // La revalidación se queda en el mismo folio; las validaciones anteriores
        // al folio abren uno nuevo de tipo revalidación.
        $operacion = $kycValidacion->operacion
            ?? OperacionValidacion::abrir(
                $persona,
                OperacionValidacion::TIPO_REVALIDACION,
                OperacionValidacion::ORIGEN_PANEL,
                $request->user()->id,
            );

        $nueva = KycValidacion::create([
            'validable_type' => $kycValidacion->validable_type,
            'validable_id' => $kycValidacion->validable_id,
            'empresa_id' => $kycValidacion->empresa_id,
            'sucursal_id' => $kycValidacion->sucursal_id,
            'operacion_id' => $operacion->id,
            'curp_capturada' => $kycValidacion->curp_capturada,
            'proveedor' => $kycValidacion->proveedor ?: KycValidacion::PROVEEDOR_JAAK,
            'tipo_documento' => $kycValidacion->tipo_documento,
            'pais_documento' => $kycValidacion->pais_documento,
            'jaak_environment' => $kycValidacion->jaak_environment,
            'estatus' => KycValidacion::ESTATUS_PENDIENTE,
        ]);

        $persona->forceFill(['kyc_estatus' => KycValidacion::ESTATUS_PENDIENTE])->saveQuietly();
        $operacion->recalcularEstatus();

        if ($nueva->esTruora()) {
            IniciarTruoraCheck::dispatch($nueva)->afterResponse();

            return back()->with('notification', [
                'type' => 'success',
                'message' => __('New background check queued.'),
            ]);
        }

        if ($nueva->esDidit()) {
            DiditSincronizador::iniciar($nueva, $operacion->urlSeguimiento());
            $operacion->recalcularEstatus();

            return back()->with('notification', [
                'type' => 'success',
                'message' => __('New DIDIT verification created. Share the folio link with the person: :url', ['url' => $operacion->urlSeguimiento()]),
            ]);
        }

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
            'folio' => $v->operacion?->folio,
            'operacion_id' => $v->operacion_id,
            'persona_nombre' => $persona
                ? trim(($persona->nombres ?? '').' '.($persona->apellidos ?? '')) ?: ('#'.$v->validable_id)
                : __('(deleted)'),
            'persona_tipo' => class_basename($v->validable_type),
            'curp_capturada' => $v->curp_capturada,
            'proveedor' => $v->proveedor ?: KycValidacion::PROVEEDOR_JAAK,
            'tipo_documento' => $v->tipo_documento,
            'pais_documento' => $v->pais_documento,
            'didit_estatus' => $v->didit_estatus,
            'didit_session_id' => $v->didit_session_id,
            'truora_check_id' => $v->truora_check_id,
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

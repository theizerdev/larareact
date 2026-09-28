<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\FirmaDocumento;
use App\Models\KycValidacion;
use App\Models\OperacionValidacion;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

/**
 * Resultados de validaciones: submenú Documentos (firmas ZapSign) y detalle
 * por folio de operación. El submenú Identidad vive en KycValidacionController.
 * El scope multitenant lo aplica el trait Multitenantable de los modelos.
 */
class OperacionValidacionController extends Controller
{
    public function documentos(Request $request)
    {
        $filtros = $request->validate([
            'estatus' => 'nullable|string|in:pendiente,firmado,rechazado,cancelado,error',
            'q' => 'nullable|string|max:100',
        ]);

        $documentos = FirmaDocumento::query()
            ->with('operacion')
            ->when($filtros['estatus'] ?? null, fn ($q, $e) => $q->where('estatus', $e))
            ->when($filtros['q'] ?? null, function ($q, $term) {
                $q->where(function ($sub) use ($term) {
                    $sub->where('nombre_documento', 'like', "%{$term}%")
                        ->orWhere('firmante_nombre', 'like', "%{$term}%")
                        ->orWhereHas('operacion', fn ($o) => $o->where('folio', 'like', "%{$term}%"));
                });
            })
            ->latest('id')
            ->paginate(20)
            ->withQueryString()
            ->through(fn (FirmaDocumento $d) => [
                'id' => $d->id,
                'folio' => $d->operacion?->folio,
                'operacion_id' => $d->operacion_id,
                'entidad_tipo' => $d->firmable_type ? class_basename($d->firmable_type) : null,
                'nombre_documento' => $d->nombre_documento,
                'firmante_nombre' => $d->firmante_nombre,
                'estatus' => $d->estatus,
                'enviado_en' => optional($d->enviado_en)->toDateTimeString(),
                'firmado_en' => optional($d->firmado_en)->toDateTimeString(),
            ]);

        return inertia('admin/validaciones/documentos', [
            'documentos' => $documentos,
            'filtros' => $filtros,
        ]);
    }

    public function show(OperacionValidacion $operacion)
    {
        $operacion->load(['entidad', 'sucursal', 'iniciador']);

        $kycs = $operacion->kycValidaciones()
            ->with('validable')
            ->orderBy('id')
            ->get()
            ->map(fn (KycValidacion $v) => [
                'id' => $v->id,
                'persona_nombre' => $this->nombre($v->validable) ?? ('#'.$v->validable_id),
                'persona_tipo' => class_basename($v->validable_type),
                'estatus' => $v->estatus,
                'score_global' => $v->score_global !== null ? (float) $v->score_global : null,
                'created_at' => optional($v->created_at)->toDateTimeString(),
                'procesado_en' => optional($v->procesado_en)->toDateTimeString(),
            ]);

        $documentos = $operacion->firmaDocumentos()
            ->orderBy('id')
            ->get()
            ->map(fn (FirmaDocumento $d) => [
                'id' => $d->id,
                'nombre_documento' => $d->nombre_documento,
                'firmante_nombre' => $d->firmante_nombre,
                'estatus' => $d->estatus,
                'enviado_en' => optional($d->enviado_en)->toDateTimeString(),
                'firmado_en' => optional($d->firmado_en)->toDateTimeString(),
                'rechazado_en' => optional($d->rechazado_en)->toDateTimeString(),
            ]);

        return inertia('admin/validaciones/operacion', [
            'operacion' => [
                'id' => $operacion->id,
                'folio' => $operacion->folio,
                'tipo_operacion' => $operacion->tipo_operacion,
                'origen' => $operacion->origen,
                'estatus' => $operacion->estatus,
                'entidad_tipo' => $operacion->entidad_type ? class_basename($operacion->entidad_type) : null,
                'entidad_nombre' => $this->nombre($operacion->entidad),
                'sucursal' => $operacion->sucursal?->nombre,
                'iniciado_por' => $operacion->iniciador?->name,
                'created_at' => optional($operacion->created_at)->toDateTimeString(),
                'updated_at' => optional($operacion->updated_at)->toDateTimeString(),
            ],
            'kycs' => $kycs,
            'documentos' => $documentos,
        ]);
    }

    private function nombre(?Model $entidad): ?string
    {
        if (! $entidad) {
            return null;
        }

        $persona = trim(($entidad->nombres ?? '').' '.($entidad->apellidos ?? ''));

        return $persona !== ''
            ? $persona
            : ($entidad->nombre_comercial ?? $entidad->razon_social ?? $entidad->nombre ?? null);
    }
}

<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Empresa;
use App\Models\KycValidacion;
use App\Models\Prevalidacion;
use App\Services\Validaciones\ValidacionRapida;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Botón "Validar" dentro del formulario de alta, antes de guardar:
 *  - RFC de la empresa → antecedentes de la empresa con TRUORA.
 *  - Nombre + CURP de la persona → RENAPO con DIDIT.
 * Al guardar el registro, la validación se le asigna (vincularPrevalidaciones).
 */
class PrevalidacionController extends Controller
{
    private const ENTIDADES = 'proveedor,socio-comercial,responsable,colaborador';

    public function rfc(Request $request): JsonResponse
    {
        $datos = $request->validate([
            'rfc' => 'required|string|max:20',
            'razon_social' => 'nullable|string|max:255',
            'entidad' => 'nullable|string|in:'.self::ENTIDADES,
            'empresa_id' => 'nullable|integer',
        ]);

        $rfc = ValidacionRapida::normalizarRfc($datos['rfc']);

        if (! ValidacionRapida::rfcValido($rfc)) {
            return $this->rechazo(__('El RFC no tiene un formato válido (12 caracteres para persona moral, 13 para persona física).'));
        }

        $empresa = $this->empresa($request);

        if (! $empresa) {
            return $this->rechazo(__('Selecciona primero la empresa del registro.'));
        }

        if (! ValidacionRapida::truoraDisponible($empresa)) {
            return $this->rechazo(__('TRUORA no está activo para esta empresa. Actívalo en Integraciones → Validaciones.'));
        }

        // Doble clic o reintento inmediato: se devuelve la misma consulta, sin cobrar otra.
        $reciente = $this->reciente($empresa, Prevalidacion::TIPO_RFC, $rfc);

        if ($reciente) {
            ValidacionRapida::sincronizarPrevalidacion($reciente);

            return response()->json(ValidacionRapida::aRespuesta($reciente->fresh()));
        }

        $pre = ValidacionRapida::prevalidarRfc($empresa, $rfc, $datos['razon_social'] ?? null, $datos['entidad'] ?? null, $request->user()->id, $this->sucursal($request, $empresa));

        return response()->json(ValidacionRapida::aRespuesta($pre));
    }

    public function curp(Request $request): JsonResponse
    {
        $datos = $request->validate([
            'curp' => 'required|string|max:18',
            'nombre' => 'required|string|max:255',
            'entidad' => 'nullable|string|in:'.self::ENTIDADES,
            'empresa_id' => 'nullable|integer',
        ]);

        $curp = strtoupper(trim($datos['curp']));
        $nombre = trim($datos['nombre']);

        if (! ValidacionRapida::curpValida($curp)) {
            return $this->rechazo(__('La CURP no tiene un formato válido.'));
        }

        if ($nombre === '') {
            return $this->rechazo(__('Captura el nombre completo para validarlo junto con la CURP.'));
        }

        $empresa = $this->empresa($request);

        if (! $empresa) {
            return $this->rechazo(__('Selecciona primero la empresa del registro.'));
        }

        if (! ValidacionRapida::diditDisponible($empresa)) {
            return $this->rechazo(__('DIDIT no está activo para esta empresa. Actívalo en Integraciones → Validaciones.'));
        }

        // Misma CURP con el mismo nombre en los últimos minutos: se reutiliza (no se cobra otra).
        $reciente = $this->recientes($empresa, Prevalidacion::TIPO_CURP, $curp)
            ->first(fn (Prevalidacion $p) => ValidacionRapida::compararNombres((string) $p->nombre, $nombre) === 'igual');

        if ($reciente) {
            return response()->json(ValidacionRapida::aRespuesta($reciente));
        }

        $pre = ValidacionRapida::prevalidarCurp($empresa, $curp, $nombre, $datos['entidad'] ?? null, $request->user()->id, $this->sucursal($request, $empresa));

        return response()->json(ValidacionRapida::aRespuesta($pre));
    }

    /** Estado de una prevalidación (el formulario la consulta mientras TRUORA trabaja). */
    public function show(Prevalidacion $prevalidacion): JsonResponse
    {
        ValidacionRapida::sincronizarPrevalidacion($prevalidacion);

        return response()->json(ValidacionRapida::aRespuesta($prevalidacion->fresh()));
    }

    /** Empresa elegida en el formulario (el scope impide usar una ajena) o la del usuario. */
    private function empresa(Request $request): ?Empresa
    {
        $id = $request->integer('empresa_id') ?: ($request->user()->empresaActiva?->id ?? $request->user()->empresa_id);

        return $id ? Empresa::query()->find($id) : null;
    }

    private function sucursal(Request $request, Empresa $empresa): ?int
    {
        $sucursal = $request->user()->sucursal;

        return $sucursal && (int) $sucursal->empresa_id === (int) $empresa->id ? $sucursal->id : null;
    }

    private function reciente(Empresa $empresa, string $tipo, string $dato): ?Prevalidacion
    {
        return $this->recientes($empresa, $tipo, $dato)->first();
    }

    /** Consultas de los últimos 10 minutos con el mismo dato, la más nueva primero. */
    private function recientes(Empresa $empresa, string $tipo, string $dato)
    {
        return Prevalidacion::withoutGlobalScopes()
            ->where('empresa_id', $empresa->id)
            ->where('tipo', $tipo)
            ->where('dato', $dato)
            ->whereNull('kyc_validacion_id')
            ->where('estatus', '!=', KycValidacion::ESTATUS_ERROR)
            ->where('created_at', '>=', now()->subMinutes(10))
            ->latest('id')
            ->limit(20)
            ->get();
    }

    private function rechazo(string $mensaje): JsonResponse
    {
        return response()->json(['message' => $mensaje], 422);
    }
}

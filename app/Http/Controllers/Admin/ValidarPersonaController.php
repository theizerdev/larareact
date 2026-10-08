<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Concerns\DispatchesKycValidacion;
use App\Http\Controllers\Controller;
use App\Jobs\ProcesarKycValidacion;
use App\Models\Empleado;
use App\Models\KycValidacion;
use App\Models\OperacionValidacion;
use App\Models\Productor;
use App\Models\ProductorEmpleado;
use App\Models\Proveedor;
use App\Models\ProveedorEmpleado;
use App\Models\Responsable;
use App\Models\VisitaTemporal;
use App\Services\Validaciones\RutaValidacion;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

/**
 * Botón "Validar" de los listados: lanza (o relanza) las validaciones de una
 * persona ya dada de alta con los datos y evidencias que ya tiene guardados
 * (foto, documento, CURP). Respeta las reglas de la empresa; con
 * `prueba_vida` además abre la verificación hospedada de Didit (prueba de vida).
 * Con `rapida=rfc|curp` hace sólo la validación sin foto (ver validacionRapida()).
 */
class ValidarPersonaController extends Controller
{
    use DispatchesKycValidacion;

    private const TIPOS = [
        'colaborador' => Empleado::class,
        'proveedor-colaborador' => ProveedorEmpleado::class,
        'socio-colaborador' => ProductorEmpleado::class,
        'socio-comercial' => Productor::class,
        'visita-temporal' => VisitaTemporal::class,
        'responsable' => Responsable::class,
        'proveedor' => Proveedor::class,
    ];

    public function __invoke(Request $request, string $tipo, int $id): RedirectResponse
    {
        $clase = self::TIPOS[$tipo] ?? abort(404);
        $persona = $clase::query()->findOrFail($id); // el scope de empresa devuelve 404 si es de otra

        // Validaciones sin foto: RFC de la empresa (TRUORA) o nombre + CURP en RENAPO (DIDIT).
        if (in_array($request->input('rapida'), ['rfc', 'curp'], true)) {
            $resultado = $this->validacionRapida($persona, $request->input('rapida'));

            return $this->aviso($resultado['type'], $resultado['message']);
        }

        // Ruta automática: según los datos y documentos del registro (ver RutaValidacion).
        if ($request->input('ruta') === 'auto') {
            return $this->rutaAutomatica($request, $persona, $clase);
        }

        return $this->lanzarKyc($request, $persona, $clase, [
            'antecedentes' => $request->boolean('antecedentes'),
            'prueba_vida' => $request->boolean('prueba_vida'),
        ]);
    }

    /** Camino que seguiría la validación automática del registro (sólo lectura, sin costo). */
    public function ruta(string $tipo, int $id): JsonResponse
    {
        $clase = self::TIPOS[$tipo] ?? abort(404);
        $persona = $clase::query()->findOrFail($id);

        return response()->json(RutaValidacion::para($persona));
    }

    /** Ejecuta, en orden, los pasos que la ruta automática elige para el registro. */
    private function rutaAutomatica(Request $request, Model $persona, string $clase): RedirectResponse
    {
        $plan = RutaValidacion::para($persona);
        $claves = array_column($plan['pasos'], 'clave');

        if (! $plan['pasos']) {
            return $this->aviso('error', trim(implode(' ', $plan['avisos'])) ?: __('No hay validaciones disponibles para este registro.'));
        }

        $tipo = 'success';
        $mensajes = [__('Ruta :ruta (:titulo).', ['ruta' => $plan['ruta'], 'titulo' => $plan['titulo']])];

        foreach ([RutaValidacion::PASO_RFC => 'rfc', RutaValidacion::PASO_CURP => 'curp'] as $clave => $alcance) {
            if (in_array($clave, $claves, true)) {
                $res = $this->validacionRapida($persona, $alcance);
                $mensajes[] = $res['message'];
                $tipo = $res['type'] === 'error' ? 'error' : $tipo;
            }
        }

        $mensajes = array_merge($mensajes, $plan['avisos']);

        if ($plan['faltantes']) {
            $mensajes[] = __('Pendiente: cargar :faltantes para completar la validación de identidad.', ['faltantes' => implode(' '.__('y').' ', $plan['faltantes'])]);
        }

        $solicitar = in_array(RutaValidacion::PASO_SOLICITAR, $claves, true);

        if ($solicitar || in_array(RutaValidacion::PASO_KYC, $claves, true)) {
            return $this->lanzarKyc($request, $persona, $clase, ['solicitar' => $solicitar], implode(' ', $mensajes), $tipo);
        }

        return $this->aviso($tipo, implode(' ', $mensajes));
    }

    /**
     * Validación de identidad con lo ya guardado (foto, documento, CURP).
     *
     * @param  array{antecedentes?: bool, prueba_vida?: bool, solicitar?: bool}  $modo  solicitar = sin documentos: sólo la liga de DIDIT para pedirlos
     * @param  string  $prefijo  texto de pasos previos de la ruta automática, que se antepone al aviso
     */
    private function lanzarKyc(Request $request, Model $persona, string $clase, array $modo, string $prefijo = '', string $tipoPrevio = 'success'): RedirectResponse
    {
        $soloAntecedentes = ! empty($modo['antecedentes']);
        $solicitar = ! empty($modo['solicitar']);
        $evidencia = ProcesarKycValidacion::evidencias($persona, class_basename($clase));
        $faltantes = [];

        if (empty($evidencia['selfie'])) {
            $faltantes[] = __('la foto');
        }

        if (empty($evidencia['front'])) {
            $faltantes[] = __('el documento de identidad (frente)');
        }

        // Los antecedentes sólo necesitan la CURP; identidad y prueba de vida, la foto y el documento.
        if ($soloAntecedentes) {
            $faltantes = [];

            if (empty($persona->curp)) {
                return $this->aviso('error', $prefijo.' '.__('To check background we need the CURP. Edit the record and add it.'));
            }
        }

        if ($solicitar) {
            $faltantes = [];
        }

        if ($faltantes) {
            return $this->aviso('error', $prefijo.' '.__('Para validar falta cargar :faltantes. Edita el registro y súbelos.', ['faltantes' => implode(' '.__('y').' ', $faltantes)]));
        }

        $enCurso = $persona->kycValidaciones()->withoutGlobalScopes()
            ->whereNull('alcance') // las validaciones rápidas (RFC, CURP) no bloquean la de identidad
            ->where('estatus', KycValidacion::ESTATUS_PENDIENTE)
            ->where('created_at', '>=', now()->subMinutes(10))->exists();

        if ($enCurso) {
            return $this->aviso('error', $prefijo.' '.__('Ya hay una validación en curso para esta persona. Espera unos minutos.'));
        }

        $previa = $persona->kycValidaciones()->withoutGlobalScopes()->whereNull('alcance')->first();
        $antes = $persona->kycValidaciones()->withoutGlobalScopes()->count();
        $firmasAntes = OperacionValidacion::withoutGlobalScopes()->count();

        $this->dispatchKycValidacion($persona, $persona->curp ?? null, null, [
            'tipo_documento' => $persona->tipo_documento ?? $previa?->tipo_documento,
            'pais_documento' => $previa?->pais_documento,
            'forzar_didit' => ! empty($modo['prueba_vida']) || $solicitar,
            'solo_antecedentes' => $soloAntecedentes,
            'solo_didit' => $solicitar,
        ]);

        $despues = $persona->kycValidaciones()->withoutGlobalScopes()->count();

        if ($despues === $antes && OperacionValidacion::withoutGlobalScopes()->count() === $firmasAntes) {
            return $this->aviso('error', $prefijo.' '.__('Esta empresa no tiene validaciones activas para este tipo de registro. Actívalas en Integraciones → Validaciones.'));
        }

        $seguimiento = $this->seguimientoValidacion($persona);

        if (! empty($seguimiento['url']) && $request->user()?->can('validaciones.view')) {
            $operacionId = OperacionValidacion::withoutGlobalScopes()
                ->where('folio', $seguimiento['folio'])
                ->where('empresa_id', $persona->empresa_id)
                ->value('id');

            if ($operacionId) {
                return redirect()->route('admin.validaciones.operaciones.show', $operacionId)->with('notification', [
                    'type' => $tipoPrevio,
                    'message' => trim($prefijo.' '.__('Validación iniciada. Folio :folio: faltan pasos de la persona (prueba de vida o firma).', ['folio' => $seguimiento['folio']])),
                ]);
            }
        }

        return $this->aviso($tipoPrevio, $prefijo.' '.__('Validación iniciada.').(empty($seguimiento['folio']) ? '' : ' '.__('Folio: :folio', ['folio' => $seguimiento['folio']])));
    }

    private function aviso(string $tipo, string $mensaje): RedirectResponse
    {
        return redirect()->back()->with('notification', ['type' => $tipo, 'message' => trim($mensaje)]);
    }
}

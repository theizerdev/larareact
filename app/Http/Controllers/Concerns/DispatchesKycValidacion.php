<?php

namespace App\Http\Controllers\Concerns;

use App\Jobs\ProcesarKycValidacion;
use App\Models\KycValidacion;
use App\Models\OperacionValidacion;
use App\Models\ValidacionRegla;
use App\Services\DiditService;
use App\Services\Validaciones\DiditSincronizador;
use App\Services\Validaciones\FirmaService;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Log;

/**
 * Helper compartido para lanzar las validaciones de una persona al registrarla
 * (wizards públicos de pre-registro y altas del panel), según la regla de la
 * empresa para su entidad (ValidacionRegla):
 *
 *  - Identidad: JAAK valida siempre, sea INE o pasaporte (detecta solo el
 *    tipo y país del documento; job tras la respuesta, como siempre).
 *    Con pasaporte o documento extranjero DIDIT valida además (página
 *    hospedada, cobertura internacional).
 *  - Antifraude: si la regla lo pide, DIDIT corre también con INE.
 *  - Firma: si la regla tiene plantilla, se envía el documento ZapSign; si la
 *    regla lo pide, ZapSign valida además la INE o el pasaporte del firmante.
 *
 * Todo cae en el folio de operación del titular. Lo que la persona tiene que
 * hacer en otra página (DIDIT, firma) se le ofrece en la liga de seguimiento
 * (seguimientoValidacion()). Diseño defensivo: nada aquí rompe el registro.
 */
trait DispatchesKycValidacion
{
    /** Folios abiertos en esta petición, por entidad titular. */
    private array $operacionesKyc = [];

    /**
     * @param  Model  $persona  Empleado | ProveedorEmpleado | ProductorEmpleado | Productor | VisitaTemporal
     *                          (debe tener empresa_id, sucursal_id y la relación empresa())
     * @param  Model|null  $titular  Entidad dueña del folio de operación (p. ej. el Proveedor
     *                               de un pre-registro con varios empleados). Por defecto, la persona.
     * @param  array{tipo_documento?: ?string, pais_documento?: ?string}  $opciones
     */
    protected function dispatchKycValidacion(Model $persona, ?string $curp = null, ?Model $titular = null, array $opciones = []): void
    {
        try {
            $empresa = $persona->empresa ?? null;

            if (! $empresa) {
                return;
            }

            $regla = ValidacionRegla::para(
                $persona->empresa_id,
                ValidacionRegla::entidadDe($persona) ?? ValidacionRegla::entidadDe($titular ?? $persona),
            );

            $tipoDocumento = in_array($opciones['tipo_documento'] ?? null, [KycValidacion::DOCUMENTO_INE, KycValidacion::DOCUMENTO_PASAPORTE], true)
                ? $opciones['tipo_documento']
                : KycValidacion::DOCUMENTO_INE;
            $pais = strtoupper(trim((string) ($opciones['pais_documento'] ?? '')));
            $pais = preg_match('/^[A-Z]{3}$/', $pais) ? $pais : null;
            $extranjero = $tipoDocumento !== KycValidacion::DOCUMENTO_INE || ($pais !== null && $pais !== 'MEX');

            $jaakDisponible = $empresa->jaak_active && ! empty($empresa->jaak_api_key) && config('jaak.kyc_enabled', true);
            $diditDisponible = $empresa->didit_active && DiditService::tokenDe($empresa) && config('didit.enabled', true);

            $usarJaak = $regla->kyc_activo && $jaakDisponible;
            // 'forzar_didit' = botón "Validar con prueba de vida": Didit corre aunque la regla no lo pida.
            $usarDidit = $diditDisponible && (
                ! empty($opciones['forzar_didit'])
                || ($regla->kyc_activo && $regla->seguimientoPara($persona) && ($extranjero || $regla->didit_antifraude))
            );
            $usarFirma = $empresa->zapsign_active && $regla->enviaFirma() && $regla->seguimientoPara($persona) && ($titular === null || $titular === $persona);

            if (! $usarJaak && ! $usarDidit && ! $usarFirma) {
                return; // empresa sin validaciones configuradas: flujo idéntico al de siempre
            }

            $curp = $curp ?: ($persona->curp ?? null);
            $operacion = $this->operacionKyc($titular ?? $persona);
            $comunes = [
                'validable_type' => $persona->getMorphClass(),
                'validable_id' => $persona->getKey(),
                'empresa_id' => $persona->empresa_id,
                'sucursal_id' => $persona->sucursal_id,
                'operacion_id' => $operacion?->id,
                'curp_capturada' => $curp ? strtoupper(trim($curp)) : null,
                'tipo_documento' => $tipoDocumento,
                'pais_documento' => $pais ?? ($tipoDocumento === KycValidacion::DOCUMENTO_INE ? 'MEX' : null),
                'estatus' => KycValidacion::ESTATUS_PENDIENTE,
            ];

            if ($usarJaak || $usarDidit) {
                $persona->forceFill(['kyc_estatus' => KycValidacion::ESTATUS_PENDIENTE])->saveQuietly();
            }

            if ($usarJaak) {
                $validacion = KycValidacion::create($comunes + [
                    'proveedor' => KycValidacion::PROVEEDOR_JAAK,
                    'jaak_environment' => $empresa->jaak_environment ?? 'sandbox',
                ]);

                ProcesarKycValidacion::dispatch($validacion)->afterResponse();
            }

            if ($usarDidit) {
                $validacion = KycValidacion::create($comunes + [
                    'proveedor' => KycValidacion::PROVEEDOR_DIDIT,
                    'jaak_environment' => 'n/a',
                ]);

                DiditSincronizador::iniciar($validacion, $operacion?->urlSeguimiento());
            }

            if ($usarFirma && $operacion) {
                $operacion->urlSeguimiento(); // el redirect de ZapSign regresa a la liga de seguimiento
                FirmaService::iniciar($operacion, $persona, $regla, $tipoDocumento, $pais);
            }
        } catch (\Throwable $e) {
            Log::error('No se pudieron iniciar las validaciones: '.$e->getMessage(), [
                'persona' => $persona->getMorphClass().'#'.$persona->getKey(),
            ]);
        }
    }

    /**
     * Folio y liga de seguimiento del titular si quedan pasos que la persona
     * debe hacer (DIDIT o firma); null si no hay nada pendiente para ella.
     *
     * @return array{folio: string, url: string}|null
     */
    protected function seguimientoValidacion(Model $titular): ?array
    {
        try {
            $operacion = $this->operacionesKyc[$titular->getMorphClass().'#'.$titular->getKey()] ?? null;

            if (! $operacion) {
                return null;
            }

            $pendientes = $operacion->kycValidaciones()->withoutGlobalScopes()
                ->where('proveedor', KycValidacion::PROVEEDOR_DIDIT)->whereNotNull('didit_url')->exists()
                || $operacion->firmaDocumentos()->withoutGlobalScopes()->whereNotNull('sign_url')->exists();

            return $pendientes
                ? ['folio' => $operacion->folio, 'url' => $operacion->urlSeguimiento()]
                : ['folio' => $operacion->folio, 'url' => null];
        } catch (\Throwable $e) {
            Log::warning('No se pudo armar la liga de seguimiento: '.$e->getMessage());

            return null;
        }
    }

    /**
     * Folio de operación del titular: se abre uno por petición y se reutiliza
     * para todas las personas del mismo titular. Si no se puede abrir, la
     * validación sigue sin folio (nunca bloquea el registro).
     */
    private function operacionKyc(Model $titular): ?OperacionValidacion
    {
        $clave = $titular->getMorphClass().'#'.$titular->getKey();

        if (isset($this->operacionesKyc[$clave])) {
            return $this->operacionesKyc[$clave];
        }

        try {
            $panel = str_contains(static::class, '\\Admin\\');

            return $this->operacionesKyc[$clave] = OperacionValidacion::abrir(
                $titular,
                $panel ? OperacionValidacion::TIPO_ALTA : OperacionValidacion::TIPO_PRERREGISTRO,
                $panel ? OperacionValidacion::ORIGEN_PANEL : OperacionValidacion::ORIGEN_PRERREGISTRO,
                auth()->id(),
            );
        } catch (\Throwable $e) {
            Log::error('No se pudo abrir el folio de operación: '.$e->getMessage(), [
                'titular' => $clave,
            ]);

            return null;
        }
    }
}

<?php

namespace App\Http\Controllers\Concerns;

use App\Jobs\IniciarTruoraCheck;
use App\Jobs\ProcesarKycValidacion;
use App\Models\KycValidacion;
use App\Models\OperacionValidacion;
use App\Models\Prevalidacion;
use App\Models\ValidacionRegla;
use App\Services\DiditService;
use App\Services\TruoraService;
use App\Services\Validaciones\DiditSincronizador;
use App\Services\Validaciones\FirmaService;
use App\Services\Validaciones\TruoraSincronizador;
use App\Services\Validaciones\ValidacionRapida;
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

            // Antecedentes (TRUORA): corre si la regla lo pide o con el botón "Verificar antecedentes"
            // ('solo_antecedentes' = únicamente esto, sin identidad ni firma). Sólo necesita la CURP.
            $truoraDisponible = $empresa->truora_active && TruoraService::tokenDe($empresa) && config('truora.enabled', true);
            $soloAntecedentes = ! empty($opciones['solo_antecedentes']);
            $usarTruora = $truoraDisponible && ($soloAntecedentes || $regla->antecedentes_activo);

            if ($soloAntecedentes) {
                $usarJaak = $usarDidit = $usarFirma = false;
            }

            if (! $usarJaak && ! $usarDidit && ! $usarFirma && ! $usarTruora) {
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

            if ($usarJaak || $usarDidit || $usarTruora) {
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

            if ($usarTruora) {
                $validacion = KycValidacion::create($comunes + [
                    'proveedor' => KycValidacion::PROVEEDOR_TRUORA,
                    'jaak_environment' => 'n/a',
                ]);

                IniciarTruoraCheck::dispatch($validacion)->afterResponse();
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
     * Validación sin foto de un registro ya guardado (submenú Validar):
     *  - 'rfc':  antecedentes de la empresa con su RFC (TRUORA, tarda unos minutos).
     *  - 'curp': nombre + CURP contra RENAPO (DIDIT, resultado inmediato).
     *
     * @param  OperacionValidacion|null  $operacion  folio donde se registra (por defecto uno nuevo)
     * @return array{type: string, message: string}
     */
    protected function validacionRapida(Model $registro, string $alcance, ?OperacionValidacion $operacion = null): array
    {
        try {
            $empresa = $registro->empresa ?? null;

            if (! $empresa) {
                return ['type' => 'error', 'message' => __('El registro no tiene empresa asignada.')];
            }

            $comunes = [
                'validable_type' => $registro->getMorphClass(),
                'validable_id' => $registro->getKey(),
                'empresa_id' => $registro->empresa_id,
                'sucursal_id' => $registro->sucursal_id,
                'pais_documento' => 'MEX',
                'jaak_environment' => 'n/a',
                'estatus' => KycValidacion::ESTATUS_PENDIENTE,
            ];

            if ($alcance === 'rfc') {
                if (! ValidacionRapida::esEmpresa($registro)) {
                    return ['type' => 'error', 'message' => __('Sólo proveedores y socios comerciales se validan por RFC.')];
                }

                $rfc = ValidacionRapida::normalizarRfc($registro->rfc);

                if (! ValidacionRapida::rfcValido($rfc)) {
                    return ['type' => 'error', 'message' => __('Para validar la empresa falta un RFC válido. Edita el registro y captúralo.')];
                }

                if (! ValidacionRapida::truoraDisponible($empresa)) {
                    return ['type' => 'error', 'message' => __('TRUORA no está activo para esta empresa. Actívalo en Integraciones → Validaciones.')];
                }

                $operacion ??= $this->operacionKyc($registro);
                $validacion = KycValidacion::create($comunes + [
                    'operacion_id' => $operacion?->id,
                    'proveedor' => KycValidacion::PROVEEDOR_TRUORA,
                    'alcance' => KycValidacion::ALCANCE_EMPRESA,
                    'dato_consultado' => $rfc,
                ]);

                $registro->forceFill(['kyc_estatus' => KycValidacion::ESTATUS_PENDIENTE])->saveQuietly();
                $operacion?->recalcularEstatus();
                IniciarTruoraCheck::dispatch($validacion)->afterResponse();

                return ['type' => 'success', 'message' => __('Antecedentes de la empresa (RFC :rfc) enviados a TRUORA. El resultado llega en unos minutos a Resultados de validaciones.', ['rfc' => $rfc])
                    .($operacion ? ' '.__('Folio: :folio', ['folio' => $operacion->folio]) : '')];
            }

            $curp = strtoupper(trim((string) ($registro->curp ?? '')));
            $nombre = ValidacionRapida::nombreDe($registro);

            if (! ValidacionRapida::curpValida($curp) || $nombre === '') {
                return ['type' => 'error', 'message' => ValidacionRapida::esEmpresa($registro)
                    ? __('Para validar al responsable faltan su nombre y una CURP válida. Edita el registro y captúralos.')
                    : __('Para validar a la persona faltan su nombre y una CURP válida. Edita el registro y captúralos.')];
            }

            if (! ValidacionRapida::diditDisponible($empresa)) {
                return ['type' => 'error', 'message' => __('DIDIT no está activo para esta empresa. Actívalo en Integraciones → Validaciones.')];
            }

            $operacion ??= $this->operacionKyc($registro);
            $validacion = KycValidacion::create($comunes + [
                'operacion_id' => $operacion?->id,
                'proveedor' => KycValidacion::PROVEEDOR_DIDIT,
                'alcance' => KycValidacion::ALCANCE_CURP,
                'dato_consultado' => $curp,
                'curp_capturada' => $curp,
                'estatus' => KycValidacion::ESTATUS_PROCESANDO,
            ]);

            $r = ValidacionRapida::consultarCurp($empresa, $curp, $nombre, 'hosho:kyc:'.$validacion->id);

            $validacion->forceFill([
                'estatus' => $r['estatus'],
                'curp_valida' => $r['curp_valida'],
                'resultado_documento' => $r['resultado'],
                'observaciones' => $r['observaciones'],
                'error_detalle' => $r['error_detalle'],
                'procesado_en' => now(),
            ])->save();
            TruoraSincronizador::propagar($validacion);

            $texto = $r['observaciones'] ?? $r['error_detalle'] ?? '';

            return match ($r['estatus']) {
                KycValidacion::ESTATUS_APROBADO => ['type' => 'success', 'message' => __('Nombre y CURP verificados en RENAPO.').' '.$texto],
                KycValidacion::ESTATUS_ERROR => ['type' => 'error', 'message' => __('No se pudo validar en RENAPO.').' '.$texto],
                default => ['type' => 'error', 'message' => $texto], // revisión o rechazo: que se note
            };
        } catch (\Throwable $e) {
            Log::error('Validación rápida fallida: '.$e->getMessage(), [
                'registro' => $registro->getMorphClass().'#'.$registro->getKey(),
                'alcance' => $alcance,
            ]);

            return ['type' => 'error', 'message' => __('No se pudo iniciar la validación. Intenta de nuevo.')];
        }
    }

    /**
     * Al guardar un alta o edición, pasa al registro las validaciones rápidas
     * hechas desde el formulario (RFC y nombre + CURP) para que queden en su
     * folio y en Resultados de validaciones. Sólo las de la misma empresa, de
     * las últimas 24 h, con el mismo RFC/CURP (y el mismo nombre) que se guardó.
     * Nunca rompe el guardado.
     */
    protected function vincularPrevalidaciones(Model $registro): void
    {
        try {
            $rfc = ValidacionRapida::esEmpresa($registro) ? ValidacionRapida::normalizarRfc($registro->rfc) : '';
            $curp = strtoupper(trim((string) ($registro->curp ?? '')));

            if ($rfc === '' && $curp === '') {
                return;
            }

            $previas = Prevalidacion::withoutGlobalScopes()
                ->where('empresa_id', $registro->empresa_id)
                ->whereNull('kyc_validacion_id')
                ->where('estatus', '!=', KycValidacion::ESTATUS_ERROR)
                ->where('created_at', '>=', now()->subDay())
                ->where(function ($q) use ($rfc, $curp) {
                    $q->where(fn ($w) => $w->where('tipo', Prevalidacion::TIPO_RFC)->where('dato', $rfc ?: '-'))
                        ->orWhere(fn ($w) => $w->where('tipo', Prevalidacion::TIPO_CURP)->where('dato', $curp ?: '-'));
                })
                ->latest('id')
                ->get()
                ->unique('tipo'); // la más reciente de cada tipo

            foreach ($previas as $pre) {
                if ($pre->tipo === Prevalidacion::TIPO_CURP
                    && ValidacionRapida::compararNombres((string) $pre->nombre, ValidacionRapida::nombreDe($registro)) !== 'igual') {
                    continue; // se validó con otro nombre: no aplica a lo que se guardó
                }

                ValidacionRapida::sincronizarPrevalidacion($pre, true);
                $operacion = $this->operacionKyc($registro);
                $esRfc = $pre->tipo === Prevalidacion::TIPO_RFC;

                $validacion = KycValidacion::create([
                    'validable_type' => $registro->getMorphClass(),
                    'validable_id' => $registro->getKey(),
                    'empresa_id' => $registro->empresa_id,
                    'sucursal_id' => $registro->sucursal_id,
                    'operacion_id' => $operacion?->id,
                    'proveedor' => $pre->proveedor,
                    'alcance' => $esRfc ? KycValidacion::ALCANCE_EMPRESA : KycValidacion::ALCANCE_CURP,
                    'dato_consultado' => $pre->dato,
                    'curp_capturada' => $esRfc ? null : $pre->dato,
                    'truora_check_id' => $esRfc ? $pre->referencia : null,
                    'pais_documento' => 'MEX',
                    'jaak_environment' => 'n/a',
                    'estatus' => $pre->estatus,
                    'curp_valida' => $esRfc ? null : ($pre->resultado['curp_valida'] ?? null),
                    'score_global' => $pre->score,
                    'en_listas' => $esRfc && $pre->score !== null && $pre->estaFinalizada()
                        ? $pre->estatus !== KycValidacion::ESTATUS_APROBADO : null,
                    'resultado_documento' => $esRfc ? null : $pre->resultado,
                    'resultado_listas' => $esRfc ? $pre->resultado : null,
                    'observaciones' => trim(($pre->observaciones ?? '').' '.__('(Validado desde el formulario de alta.)')),
                    'procesado_en' => $pre->procesado_en,
                ]);

                $pre->forceFill(['kyc_validacion_id' => $validacion->id])->save();
                TruoraSincronizador::propagar($validacion);
            }
        } catch (\Throwable $e) {
            Log::error('No se pudieron vincular las prevalidaciones: '.$e->getMessage(), [
                'registro' => $registro->getMorphClass().'#'.$registro->getKey(),
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

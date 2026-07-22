<?php

namespace App\Services;

use App\Models\Empresa;
use App\Models\Pais;
use Illuminate\Support\Facades\Cache;
use Carbon\Carbon;

class RegionalConfigurationService
{
    private static $currentConfig = null;

    /**
     * Establecer la configuración regional basada en la empresa del usuario
     */
    public static function setRegionalConfiguration(Empresa $empresa = null): void
    {
        if (!$empresa) {
            $empresa = self::getCurrentUserEmpresa();
        }

        if (!$empresa || !$empresa->pais) {
            return;
        }

        $pais = $empresa->pais;
        //dd( $pais);
        // Configurar zona horaria
        config(['app.timezone' => $pais->zona_horaria ?? 'UTC']);
        date_default_timezone_set($pais->zona_horaria ?? 'UTC');

        // Configurar locale
        app()->setLocale($pais->idioma_principal ?? 'es');

        // Configurar moneda
        config([
            'app.currency' => $pais->moneda_principal ?? 'USD',
            'app.currency_symbol' => $pais->simbolo_moneda ?? '$',
            'app.currency_format' => $pais->formato_moneda ?? '#,##0.00',
            'app.decimal_separator' => $pais->separador_decimales ?? '.',
            'app.thousand_separator' => $pais->separador_miles ?? ',',
            'app.decimals' => $pais->decimales_moneda ?? 2,
        ]);

        // Configurar formato de fecha
        config(['app.date_format' => $pais->formato_fecha ?? 'd/m/Y']);

        // Configurar impuesto predeterminado
        config(['app.default_tax' => $pais->impuesto_predeterminado ?? 0]);

        // Guardar en caché para uso futuro
        self::$currentConfig = [
            'pais' => $pais,
            'timezone' => $pais->zona_horaria ?? 'UTC',
            'currency' => $pais->moneda_principal ?? 'USD',
            'currency_symbol' => $pais->simbolo_moneda ?? '$',
            'date_format' => $pais->formato_fecha ?? 'd/m/Y',
            'currency_format' => $pais->formato_moneda ?? '#,##0.00',
            'decimal_separator' => $pais->separador_decimales ?? '.',
            'thousand_separator' => $pais->separador_miles ?? ',',
            'decimals' => $pais->decimales_moneda ?? 2,
            'default_tax' => $pais->impuesto_predeterminado ?? 0,
            'dual_currency' => ($pais->moneda_principal === 'VES'),
            'secondary_currency' => ($pais->moneda_principal === 'VES') ? 'USD' : null,
        ];

        // Guardar en sesión
        session([
            'current_empresa_id' => $empresa->id,
            'current_pais_id' => $pais->id,
            'regional_configuration' => self::$currentConfig
        ]);
    }

    /**
     * Obtener la configuración actual
     */
    public static function getCurrentConfiguration(): array
    {
        $sessionConfig = session('regional_configuration', []);

        return [
            'currency' => $sessionConfig['currency'] ?? config('app.currency', 'USD'),
            'currency_symbol' => $sessionConfig['currency_symbol'] ?? config('app.currency_symbol', '$'),
            'timezone' => $sessionConfig['timezone'] ?? config('app.timezone', 'UTC'),
            'date_format' => $sessionConfig['date_format'] ?? config('app.date_format', 'd/m/Y'),
            'currency_format' => $sessionConfig['currency_format'] ?? config('app.currency_format', '#,##0.00'),
            'locale' => $sessionConfig['locale'] ?? config('app.locale', 'es'),
            'decimals' => $sessionConfig['decimals'] ?? config('app.decimals', 2),
            'decimal_separator' => $sessionConfig['decimal_separator'] ?? config('app.decimal_separator', '.'),
            'thousand_separator' => $sessionConfig['thousand_separator'] ?? config('app.thousand_separator', ','),
            'dual_currency' => $sessionConfig['dual_currency'] ?? false,
            'secondary_currency' => $sessionConfig['secondary_currency'] ?? null,
        ];
    }

    /**
     * Formatear una cantidad de dinero según la configuración regional
     */
    public static function formatMoney($amount, $includeSymbol = true): string
    {
        if (!self::$currentConfig) {
            return number_format($amount, 2, '.', ',');
        }

        $formatted = number_format(
            $amount,
            self::$currentConfig['decimals'],
            self::$currentConfig['decimal_separator'],
            self::$currentConfig['thousand_separator']
        );

        return $includeSymbol ? self::$currentConfig['currency_symbol'] . ' ' . $formatted : $formatted;
    }

    /**
     * Formatear una fecha según la configuración regional
     */
    public static function formatDate($date, $format = null): string
    {
        if (!self::$currentConfig) {
            return Carbon::parse($date)->format('d/m/Y');
        }

        $dateFormat = $format ?? self::$currentConfig['date_format'];
        return Carbon::parse($date)->format(self::convertToCarbonFormat($dateFormat));
    }

    /**
     * Convertir formato de fecha del país a formato Carbon
     */
    private static function convertToCarbonFormat($format): string
    {
        return match($format) {
            'dd/mm/yyyy' => 'd/m/Y',
            'mm/dd/yyyy' => 'm/d/Y',
            'yyyy-mm-dd' => 'Y-m-d',
            'dd-mm-yyyy' => 'd-m-Y',
            'yyyy/mm/dd' => 'Y/m/d',
            default => 'd/m/Y'
        };
    }

    /**
     * Obtener la empresa actual del usuario
     */
    private static function getCurrentUserEmpresa(): ?Empresa
    {
        if (auth()->check()) {
            $user = auth()->user();
            if (!empty($user->empresa_id)) {
                $empresa = Empresa::with('pais')->find($user->empresa_id);
                if ($empresa) {
                    return $empresa;
                }
            }
        }

        // Si el usuario no está autenticado o no tiene empresa, utilizar la primera empresa registrada como valor por defecto
        return Empresa::with('pais')->first();
    }

    /**
     * Obtener configuración para un país específico
     */
    public static function getConfigurationForPais(Pais $pais): array
    {
        return [
            'timezone' => $pais->zona_horaria,
            'currency' => $pais->moneda_principal,
            'currency_symbol' => $pais->simbolo_moneda,
            'date_format' => $pais->formato_fecha,
            'currency_format' => $pais->formato_moneda,
            'decimal_separator' => $pais->separador_decimales,
            'thousand_separator' => $pais->separador_miles,
            'decimals' => $pais->decimales_moneda,
            'default_tax' => $pais->impuesto_predeterminado,
        ];
    }

    /**
     * Limpiar la configuración actual
     */
    public static function clearConfiguration(): void
    {
        self::$currentConfig = null;
    }
}

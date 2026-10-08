<?php

namespace App\Services\Validaciones;

use App\Jobs\ProcesarKycValidacion;
use App\Models\Empresa;
use App\Models\KycValidacion;
use Illuminate\Database\Eloquent\Model;

/**
 * Decide qué camino de validación sigue un registro según los datos y
 * documentos que ya tiene. No llama a ningún proveedor ni escribe nada: sólo
 * lee el registro y devuelve el plan (lo ejecuta ValidarPersonaController).
 *
 *  A  datos (nombre + CURP) + INE y foto → nombre/CURP en RENAPO y validación completa de identidad.
 *  B  datos pero sin INE o sin foto      → sólo nombre/CURP en RENAPO; queda pendiente cargar el INE y la foto.
 *  C  internacional (pasaporte)          → validación completa de identidad con el pasaporte (sin CURP).
 *  D  sin datos                          → con INE y foto, validación completa (de ahí salen los datos);
 *                                          sin nada, se pide el INE y la foto con la liga de DIDIT.
 *
 * En proveedores y socios comerciales (empresas) se suma el RFC de la empresa
 * (TRUORA) y lo demás se aplica a su responsable.
 */
class RutaValidacion
{
    public const PASO_RFC = 'rfc';

    public const PASO_CURP = 'curp';

    /** Validación completa con los documentos ya cargados. */
    public const PASO_KYC = 'kyc';

    /** Pedir el INE/pasaporte y la foto a la persona (liga hospedada de DIDIT). */
    public const PASO_SOLICITAR = 'solicitar';

    /**
     * @return array{ruta: string, titulo: string, pasos: array<int, array{clave: string, etiqueta: string, proveedor: string}>, avisos: array<int, string>, faltantes: array<int, string>}
     */
    public static function para(Model $registro, ?Empresa $empresa = null): array
    {
        $empresa ??= $registro->empresa ?? null;

        $pasos = [];
        $avisos = [];
        $faltantes = [];

        $esEmpresa = ValidacionRapida::esEmpresa($registro);
        $curp = strtoupper(trim((string) ($registro->curp ?? '')));
        $tieneDatos = ValidacionRapida::curpValida($curp) && count(preg_split('/\s+/u', ValidacionRapida::nombreDe($registro), -1, PREG_SPLIT_NO_EMPTY)) >= 2;

        $evidencia = ProcesarKycValidacion::evidencias($registro, class_basename($registro));
        $tieneIne = ! empty($evidencia['front']);
        $tieneFoto = ! empty($evidencia['selfie']);
        $internacional = self::esInternacional($registro);

        $rfc = $esEmpresa ? ValidacionRapida::normalizarRfc($registro->rfc ?? '') : '';

        if ($esEmpresa) {
            if (ValidacionRapida::rfcValido($rfc)) {
                $pasos[] = self::paso(self::PASO_RFC, __('Antecedentes de la empresa por RFC'), 'TRUORA');
            } else {
                $avisos[] = __('Falta un RFC válido para validar la empresa.');
            }
        }

        $quien = $esEmpresa ? __('responsable') : __('persona');

        if ($internacional) {
            $ruta = 'C';
            $titulo = __('Internacional: pasaporte');

            if ($tieneIne && $tieneFoto) {
                $pasos[] = self::paso(self::PASO_KYC, __('Validación completa con el pasaporte'), 'JAAK · DIDIT');
            } else {
                $pasos[] = self::paso(self::PASO_SOLICITAR, __('Pedir el pasaporte y la foto (liga de verificación)'), 'DIDIT');
                $faltantes[] = __('el pasaporte y la foto');
            }
        } elseif ($tieneDatos && $tieneIne && $tieneFoto) {
            $ruta = 'A';
            $titulo = __('Datos + INE');
            $pasos[] = self::paso(self::PASO_CURP, __('Nombre y CURP del :quien en RENAPO', ['quien' => $quien]), 'DIDIT');
            $pasos[] = self::paso(self::PASO_KYC, __('Validación completa de identidad'), 'JAAK');
        } elseif ($tieneDatos) {
            $ruta = 'B';
            $titulo = __('Datos sin INE');
            $pasos[] = self::paso(self::PASO_CURP, __('Nombre y CURP del :quien en RENAPO', ['quien' => $quien]), 'DIDIT');
            $faltantes[] = ! $tieneIne && ! $tieneFoto ? __('el INE y la foto') : (! $tieneIne ? __('el INE') : __('la foto'));
        } elseif ($tieneIne && $tieneFoto) {
            $ruta = 'D';
            $titulo = __('Sin datos, con INE');
            $pasos[] = self::paso(self::PASO_KYC, __('Validación completa de identidad (de ahí salen los datos)'), 'JAAK');
        } else {
            $ruta = 'D';
            $titulo = __('Sin datos: pedir INE y foto');
            $pasos[] = self::paso(self::PASO_SOLICITAR, __('Pedir el INE y la foto (liga de verificación)'), 'DIDIT');
            $faltantes[] = __('el INE y la foto');
        }

        if ($empresa) {
            $pasos = self::filtrarDisponibles($pasos, $empresa, $avisos);
        }

        return compact('ruta', 'titulo', 'pasos', 'avisos', 'faltantes');
    }

    /** Pasaporte o documento de otro país: no hay CURP que validar. */
    private static function esInternacional(Model $registro): bool
    {
        $tipo = $registro->tipo_documento ?? null;

        if ($tipo === KycValidacion::DOCUMENTO_PASAPORTE) {
            return true;
        }

        if ($tipo === KycValidacion::DOCUMENTO_INE) {
            return false;
        }

        $previa = KycValidacion::withoutGlobalScopes()
            ->where('validable_type', $registro->getMorphClass())
            ->where('validable_id', $registro->getKey())
            ->whereNull('alcance')
            ->latest('id')
            ->first();

        return $previa
            && ($previa->tipo_documento === KycValidacion::DOCUMENTO_PASAPORTE
                || ($previa->pais_documento && strtoupper($previa->pais_documento) !== 'MEX'));
    }

    /**
     * Quita los pasos cuyo proveedor no está activo en la empresa y deja el aviso.
     * La identidad completa no se filtra aquí: depende de las reglas de la empresa
     * y el controlador ya avisa si no hay validaciones activas.
     */
    private static function filtrarDisponibles(array $pasos, Empresa $empresa, array &$avisos): array
    {
        return array_values(array_filter($pasos, function (array $paso) use ($empresa, &$avisos) {
            if ($paso['clave'] === self::PASO_RFC && ! ValidacionRapida::truoraDisponible($empresa)) {
                $avisos[] = __('TRUORA no está activo para esta empresa: se omite la validación del RFC.');

                return false;
            }

            if (in_array($paso['clave'], [self::PASO_CURP, self::PASO_SOLICITAR], true) && ! ValidacionRapida::diditDisponible($empresa)) {
                $avisos[] = __('DIDIT no está activo para esta empresa: se omite ":paso".', ['paso' => $paso['etiqueta']]);

                return false;
            }

            return true;
        }));
    }

    private static function paso(string $clave, string $etiqueta, string $proveedor): array
    {
        return compact('clave', 'etiqueta', 'proveedor');
    }
}

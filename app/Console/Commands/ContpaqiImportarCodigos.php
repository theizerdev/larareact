<?php

namespace App\Console\Commands;

use App\Models\ContpaqiEmpleadoMapeo;
use App\Models\Empleado;
use App\Models\Empresa;
use App\Services\Contpaqi\EmparejadorDeNombres;
use Illuminate\Console\Command;
use Illuminate\Support\Collection;

/**
 * Carga el padrón de códigos de empleado de CONTPAQi en
 * `contpaqi_empleado_mapeos`, emparejando por nombre.
 *
 * POR DEFECTO NO ESCRIBE NADA. Sin --aplicar sólo enseña qué emparejaría, que
 * es como conviene correrlo la primera vez: el emparejamiento por nombre acierta
 * casi siempre, pero "casi siempre" no alcanza cuando equivocarse significa
 * pagarle las horas de una persona a otra.
 *
 * La fuente por default es el padrón transcrito de la captura de pantalla del
 * cliente, con los nombres cortados tal como venían. Con --csv se puede usar la
 * lista completa exportada de CONTPAQi, que es lo recomendable en cuanto exista.
 */
class ContpaqiImportarCodigos extends Command
{
    protected $signature = 'contpaqi:importar-codigos
        {--empresa= : ID de la empresa. Obligatorio si hay más de una}
        {--csv= : Ruta a un CSV con columnas codigo,nombre. Por defecto usa el padrón del cliente}
        {--aplicar : Guarda los mapeos. Sin esta bandera todo queda en pantalla}';

    protected $description = 'Carga los códigos de empleado de CONTPAQi emparejándolos por nombre con los empleados de Shigoto';

    public function handle(EmparejadorDeNombres $emparejador): int
    {
        $empresa = $this->resolverEmpresa();

        if ($empresa === null) {
            return self::FAILURE;
        }

        $padron = $this->leerPadron();

        if ($padron === []) {
            $this->error('El padrón está vacío.');

            return self::FAILURE;
        }

        $empleados = Empleado::withoutTenant()
            ->where('empresa_id', $empresa->id)
            ->where('status', true)
            ->get();

        $yaMapeados = ContpaqiEmpleadoMapeo::query()->paraEmpresa($empresa->id)->get();
        $codigosTomados = $yaMapeados->pluck('codigo_empleado')->all();
        $empleadosTomados = $yaMapeados->pluck('empleado_id')->all();

        $aplicar = (bool) $this->option('aplicar');

        $this->line("Empresa: {$empresa->razon_social}");
        $this->line(sprintf('Padrón: %d códigos · Empleados activos: %d', count($padron), $empleados->count()));
        $this->line($aplicar ? 'Modo: escritura real' : 'Modo: ensayo (no se guarda nada)');
        $this->newLine();

        $filas = [];
        $creados = 0;
        $problemas = 0;

        foreach ($padron as $entrada) {
            $codigo = (string) $entrada['codigo'];
            $nombre = (string) $entrada['nombre'];
            $truncado = (bool) ($entrada['truncado'] ?? false);

            if (in_array($codigo, $codigosTomados, true)) {
                $filas[] = [$codigo, $nombre, 'ya existe', '—'];

                continue;
            }

            $resultado = $emparejador->emparejar($nombre, $truncado, $empleados);
            $empleado = $resultado['empleado'];

            if ($empleado === null) {
                $problemas++;
                $detalle = $resultado['estado'] === EmparejadorDeNombres::AMBIGUA
                    ? 'coincide con: '.implode(' / ', $resultado['candidatos'])
                    : 'ningún empleado con ese nombre';

                $filas[] = [$codigo, $nombre, $resultado['estado'], $detalle];

                continue;
            }

            // Un empleado ya mapeado no se toca: cambiarle el código en una
            // corrida masiva es la forma más silenciosa de romper una nómina.
            if (in_array($empleado->id, $empleadosTomados, true)) {
                $filas[] = [$codigo, $nombre, 'empleado ya mapeado', $empleado->nombre_completo];

                continue;
            }

            $filas[] = [$codigo, $nombre, $resultado['estado'], $empleado->nombre_completo];

            if ($aplicar) {
                ContpaqiEmpleadoMapeo::create([
                    'empresa_id' => $empresa->id,
                    'empleado_id' => $empleado->id,
                    'codigo_empleado' => $codigo,
                    'nombre_contpaqi' => $nombre,
                    'activo' => true,
                    'notas' => $resultado['estado'] === EmparejadorDeNombres::PREFIJO
                        ? 'Emparejado por prefijo: el nombre venía cortado en el padrón original. Conviene verificarlo.'
                        : null,
                ]);
            }

            $empleadosTomados[] = $empleado->id;
            $codigosTomados[] = $codigo;
            $creados++;
        }

        $this->table(['Código', 'Nombre en CONTPAQi', 'Resultado', 'Empleado en Shigoto'], $filas);
        $this->newLine();

        $this->info(sprintf('%d emparejados, %d sin resolver.', $creados, $problemas));

        if ($problemas > 0) {
            $this->warn('Los que quedaron sin resolver se asignan a mano en Nómina → Mapeo de códigos.');
        }

        if (! $aplicar) {
            $this->newLine();
            $this->comment('Ensayo terminado. Con --aplicar se guardan los mapeos.');
        }

        return self::SUCCESS;
    }

    /**
     * Padrón a cargar: el CSV que se indique, o el transcrito del cliente.
     *
     * @return list<array{codigo: string, nombre: string, truncado: bool}>
     */
    private function leerPadron(): array
    {
        $csv = $this->option('csv');

        if (blank($csv)) {
            $ruta = database_path('data/contpaqi-codigos-frigorifico.php');

            return is_file($ruta) ? require $ruta : [];
        }

        if (! is_file((string) $csv)) {
            $this->error("No existe el archivo {$csv}.");

            return [];
        }

        $manejador = fopen((string) $csv, 'rb');

        if ($manejador === false) {
            $this->error("No se pudo leer {$csv}.");

            return [];
        }

        $padron = [];

        try {
            while (($fila = fgetcsv($manejador, 0, ',', '"', '\\')) !== false) {
                $codigo = trim((string) ($fila[0] ?? ''));
                $nombre = trim((string) ($fila[1] ?? ''));

                // Se salta el encabezado y los renglones incompletos.
                if ($codigo === '' || $nombre === '' || mb_strtolower($codigo) === 'codigo') {
                    continue;
                }

                // Una lista exportada de CONTPAQi trae los nombres completos,
                // así que no se admite el emparejamiento por prefijo.
                $padron[] = ['codigo' => $codigo, 'nombre' => $nombre, 'truncado' => false];
            }
        } finally {
            fclose($manejador);
        }

        return $padron;
    }

    private function resolverEmpresa(): ?Empresa
    {
        if ($id = $this->option('empresa')) {
            $empresa = Empresa::withoutGlobalScopes()->find($id);

            if ($empresa === null) {
                $this->error("No existe la empresa con id {$id}.");
            }

            return $empresa;
        }

        /** @var Collection<int, Empresa> $empresas */
        $empresas = Empresa::withoutGlobalScopes()->get();

        if ($empresas->count() === 1) {
            return $empresas->first();
        }

        if ($empresas->isEmpty()) {
            $this->error('No hay empresas registradas.');

            return null;
        }

        $this->error('Hay más de una empresa; especifica cuál con --empresa=ID:');

        foreach ($empresas as $empresa) {
            $this->line("  {$empresa->id}  {$empresa->razon_social}");
        }

        return null;
    }
}

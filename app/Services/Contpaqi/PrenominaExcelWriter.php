<?php

namespace App\Services\Contpaqi;

use App\Models\ContpaqiTipoIncidencia;
use Illuminate\Support\Collection;
use PhpOffice\PhpSpreadsheet\Cell\DataType;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

/**
 * Escribe el .xlsx que CONTPAQi importa desde "Capturar movimientos desde
 * Excel".
 *
 * La hoja es deliberadamente austera: un renglón de encabezados y debajo los
 * datos, sin títulos, sin logotipo, sin totales y sin celdas combinadas. Un
 * importador que espera una tabla se atraganta con cualquier adorno arriba, y
 * el reporte bonito para leer con ojos humanos es la pantalla de la
 * exportación, no este archivo.
 */
class PrenominaExcelWriter
{
    /**
     * @param  list<array{clave: string, titulo: string}>  $columnasFijas
     * @param  Collection<int, ContpaqiTipoIncidencia>  $tipos  Columnas de incidencia, en orden
     * @param  list<array{codigo_empleado: string, nombre_empleado: string, valores: array<string, float>}>  $renglones
     */
    public function escribir(string $rutaDestino, array $columnasFijas, Collection $tipos, array $renglones): void
    {
        $layout = config('contpaqi.layout', []);
        $porMnemonico = (bool) ($layout['encabezado_por_mnemonico'] ?? true);
        $filaEncabezado = (int) ($layout['fila_encabezado'] ?? 1);
        $primeraFilaDatos = (int) ($layout['primera_fila_datos'] ?? 2);
        $decimalesHoras = (int) ($layout['decimales_horas'] ?? 2);
        $decimalesDias = (int) ($layout['decimales_dias'] ?? 2);

        $spreadsheet = new Spreadsheet;
        $hoja = $spreadsheet->getActiveSheet();
        $hoja->setTitle($this->tituloHoja((string) ($layout['nombre_hoja'] ?? 'Movimientos')));

        // --- Encabezados -----------------------------------------------
        $columna = 1;

        foreach ($columnasFijas as $fija) {
            $hoja->setCellValue([$columna, $filaEncabezado], $fija['titulo']);
            $columna++;
        }

        /** @var array<int, ContpaqiTipoIncidencia> $tipoPorColumna */
        $tipoPorColumna = [];

        foreach ($tipos as $tipo) {
            // Cuál de los dos espera la importación —el mnemónico o el número
            // de concepto— es justo lo que hay que confirmar contra la "Hoja
            // de trabajo" del CONTPAQi del cliente. Por eso es configurable.
            $encabezado = $porMnemonico
                ? $tipo->mnemonico
                : ($tipo->concepto_nomipaq ?? $tipo->mnemonico);

            // Siempre como texto: un encabezado numérico como 132 se
            // interpretaría como número y perdería su identidad de clave.
            $hoja->setCellValueExplicit([$columna, $filaEncabezado], (string) $encabezado, DataType::TYPE_STRING);
            $tipoPorColumna[$columna] = $tipo;
            $columna++;
        }

        $ultimaColumna = $columna - 1;

        $hoja->getStyle([1, $filaEncabezado, $ultimaColumna, $filaEncabezado])->applyFromArray([
            'font' => ['bold' => true],
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['rgb' => 'E8EDF3'],
            ],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
        ]);

        // --- Datos ------------------------------------------------------
        $fila = $primeraFilaDatos;

        foreach ($renglones as $renglon) {
            $columna = 1;

            foreach ($columnasFijas as $fija) {
                $valor = (string) ($renglon[$fija['clave']] ?? '');

                // El código de empleado va forzado a texto. Códigos como
                // "0180" son reales y Excel les comería el cero inicial, con
                // lo que el renglón acabaría en otra persona o en ninguna.
                $hoja->setCellValueExplicit([$columna, $fila], $valor, DataType::TYPE_STRING);
                $columna++;
            }

            foreach ($tipoPorColumna as $indiceColumna => $tipo) {
                $cantidad = $renglon['valores'][$tipo->mnemonico] ?? null;

                // Celda vacía en vez de cero cuando no hubo movimiento: un
                // cero es una afirmación ("cero horas extra") y una celda
                // vacía es la ausencia de dato, que es lo que corresponde.
                if ($cantidad === null || abs((float) $cantidad) < 0.0001) {
                    continue;
                }

                $decimales = $tipo->esEnHoras() ? $decimalesHoras : $decimalesDias;
                $hoja->setCellValue([$indiceColumna, $fila], round((float) $cantidad, $decimales));
            }

            $fila++;
        }

        foreach (range(1, $ultimaColumna) as $indice) {
            $hoja->getColumnDimensionByColumn($indice)->setAutoSize(true);
        }

        $hoja->freezePane([1, $primeraFilaDatos]);

        (new Xlsx($spreadsheet))->save($rutaDestino);

        // PhpSpreadsheet mantiene toda la hoja en memoria; sin esto, exportar
        // varias empresas seguidas en un mismo proceso la agota.
        $spreadsheet->disconnectWorksheets();
        unset($spreadsheet);
    }

    /**
     * Excel rechaza nombres de hoja de más de 31 caracteres y con ciertos
     * signos. Se sanea aquí para que un valor mal puesto en configuración no
     * tumbe la exportación entera.
     */
    private function tituloHoja(string $nombre): string
    {
        $limpio = str_replace(['\\', '/', '*', '?', ':', '[', ']'], '', $nombre);
        $limpio = trim($limpio);

        if ($limpio === '') {
            $limpio = 'Movimientos';
        }

        return mb_substr($limpio, 0, 31);
    }
}

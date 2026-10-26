<?php

namespace App\Services;

use App\Models\Empresa;
use App\Models\Sucursal;
use App\Models\User;

class StockAlertPdfService
{
    private const PAGE_W = 595.28; // A4 Portrait width in pt
    private const PAGE_H = 841.89; // A4 Portrait height in pt
    private const MARGIN_L = 30.0;
    private const MARGIN_R = 30.0;
    private const MARGIN_T = 28.0;
    private const MARGIN_B = 42.0;

    /** @var array<int, string> Content streams per page (1-indexed) */
    private array $pages = [];

    private int $currentPage = 0;
    private float $cursorY = 0.0;

    /** @var array<string, array{w: int, h: int, data: string, id?: int}> */
    private array $images = [];

    /**
     * Standard Helvetica character widths (per 1000 units) for WinAnsi (32..255)
     * Used for accurate right/center alignment and clean word-wrapping.
     *
     * @var array<int, int>
     */
    private const HELVETICA_WIDTHS = [
        32 => 278, 33 => 278, 34 => 355, 35 => 556, 36 => 556, 37 => 889, 38 => 667, 39 => 191,
        40 => 333, 41 => 333, 42 => 389, 43 => 584, 44 => 278, 45 => 333, 46 => 278, 47 => 278,
        48 => 556, 49 => 556, 50 => 556, 51 => 556, 52 => 556, 53 => 556, 54 => 556, 55 => 556,
        56 => 556, 57 => 556, 58 => 278, 59 => 278, 60 => 584, 61 => 584, 62 => 584, 63 => 556,
        64 => 1015, 65 => 667, 66 => 667, 67 => 722, 68 => 722, 69 => 667, 70 => 611, 71 => 778,
        72 => 722, 73 => 278, 74 => 500, 75 => 667, 76 => 556, 77 => 833, 78 => 722, 79 => 778,
        80 => 667, 81 => 778, 82 => 722, 83 => 667, 84 => 611, 85 => 722, 86 => 667, 87 => 944,
        88 => 667, 89 => 667, 90 => 611, 91 => 278, 92 => 278, 93 => 278, 94 => 469, 95 => 556,
        96 => 333, 97 => 556, 98 => 556, 99 => 500, 100 => 556, 101 => 556, 102 => 278, 103 => 556,
        104 => 556, 105 => 222, 106 => 222, 107 => 500, 108 => 222, 109 => 833, 110 => 556, 111 => 556,
        112 => 556, 113 => 556, 114 => 333, 115 => 500, 116 => 278, 117 => 556, 118 => 500, 119 => 722,
        120 => 500, 121 => 500, 122 => 500, 123 => 334, 124 => 260, 125 => 334, 126 => 584,
        128 => 556, 130 => 222, 131 => 556, 132 => 333, 133 => 1000, 134 => 556, 135 => 556, 136 => 333,
        137 => 1000, 138 => 667, 139 => 333, 140 => 1000, 142 => 611, 145 => 222, 146 => 222, 147 => 333,
        148 => 333, 149 => 350, 150 => 556, 151 => 1000, 152 => 333, 153 => 1000, 154 => 500, 155 => 333,
        156 => 944, 158 => 500, 159 => 667, 160 => 278, 161 => 333, 162 => 556, 163 => 556, 164 => 556,
        165 => 556, 166 => 260, 167 => 556, 168 => 333, 169 => 737, 170 => 370, 171 => 556, 172 => 584,
        173 => 333, 174 => 737, 175 => 552, 176 => 400, 177 => 584, 178 => 333, 179 => 333, 180 => 333,
        181 => 576, 182 => 537, 183 => 278, 184 => 333, 185 => 333, 186 => 365, 187 => 556, 188 => 834,
        189 => 834, 190 => 834, 191 => 611, 192 => 667, 193 => 667, 194 => 667, 195 => 667, 196 => 667,
        197 => 667, 198 => 1000, 199 => 722, 200 => 667, 201 => 667, 202 => 667, 203 => 667, 204 => 278,
        205 => 278, 206 => 278, 207 => 278, 208 => 722, 209 => 722, 210 => 778, 211 => 778, 212 => 778,
        213 => 778, 214 => 778, 215 => 584, 216 => 778, 217 => 722, 218 => 722, 219 => 722, 220 => 722,
        221 => 667, 222 => 667, 223 => 611, 224 => 556, 225 => 556, 226 => 556, 227 => 556, 228 => 556,
        229 => 556, 230 => 889, 231 => 500, 232 => 556, 233 => 556, 234 => 556, 235 => 556, 236 => 278,
        237 => 278, 238 => 278, 239 => 278, 240 => 556, 241 => 556, 242 => 556, 243 => 556, 244 => 556,
        245 => 556, 246 => 556, 247 => 584, 248 => 611, 249 => 556, 250 => 556, 251 => 556, 252 => 556,
        253 => 500, 254 => 556, 255 => 500,
    ];

    /**
     * Generate binary PDF content for Low Stock Alerts grouped by Brand.
     *
     * @param  array<int, array<string, mixed>>  $brandGroups
     * @param  array<string, mixed>  $resumen
     * @param  array<string, mixed>  $meta
     */
    public function generate(
        array $brandGroups,
        array $resumen,
        ?Empresa $empresa = null,
        ?Sucursal $sucursal = null,
        ?User $user = null,
        array $meta = []
    ): string {
        $this->pages = [];
        $this->currentPage = 0;
        $this->images = [];

        $currency = (string) ($meta['currencySymbol'] ?? '$');
        $generatedAt = (string) ($meta['generatedAt'] ?? now()->format('d/m/Y H:i'));
        $folio = (string) ($meta['folio'] ?? ('ALT-' . now()->format('Ymd-Hi')));
        $filterLabel = (string) ($meta['filterLabel'] ?? 'Catálogo Completo en Alerta');
        $hasCostData = ((float) ($resumen['costo_estimado_reposicion'] ?? 0)) > 0;

        // Preload company logo if present on disk
        $logoKey = $this->tryLoadCompanyLogo($empresa);

        // Start Page 1 with full corporate header + KPI cards
        $this->addNewPage();
        $this->drawFullHeader($empresa, $sucursal, $user, $folio, $generatedAt, $filterLabel, $logoKey);
        $this->drawExecutiveKpiStrip($resumen, $currency, $hasCostData);

        if (empty($brandGroups)) {
            $this->drawEmptyStateBox();
        } else {
            foreach ($brandGroups as $groupIndex => $group) {
                $this->drawBrandSection($group, $groupIndex + 1, count($brandGroups), $currency, $hasCostData, $empresa, $folio, $generatedAt);
            }

            // Consolidated Brand Summary Table + Signatures at the end
            $this->drawConsolidatedBrandSummary($brandGroups, $resumen, $currency, $hasCostData, $empresa, $folio, $generatedAt);
            $this->drawSignaturesBlock($empresa, $user, $folio, $generatedAt);
        }

        // Stamp footers with exact "Página X de Y" on every page
        $totalPages = count($this->pages);
        $companyFooterName = $empresa?->nombre_comercial ?: ($empresa?->razon_social ?: config('app.name', 'FixSale POS'));
        for ($p = 1; $p <= $totalPages; $p++) {
            $this->currentPage = $p;
            $this->drawPageFooter($p, $totalPages, $companyFooterName, $generatedAt, $folio);
        }

        return $this->compilePdfDocument();
    }

    // =========================================================================
    // HIGH-LEVEL REPORT SECTIONS
    // =========================================================================

    private function drawFullHeader(
        ?Empresa $empresa,
        ?Sucursal $sucursal,
        ?User $user,
        string $folio,
        string $generatedAt,
        string $filterLabel,
        ?string $logoKey
    ): void {
        $contentW = self::PAGE_W - self::MARGIN_L - self::MARGIN_R;
        $x = self::MARGIN_L;
        $y = $this->cursorY;

        // Top Corporate Dual-Tone Accent Bar
        $this->fillRoundedRect($x, $y, $contentW, 4.5, 2.0, [15, 23, 42]);
        $this->fillRoundedRect($x, $y, 145.0, 4.5, 2.0, [225, 29, 72]); // Rose-600 alert accent
        $y += 12.0;

        $companyTitle = $empresa?->nombre_comercial ?: ($empresa?->razon_social ?: config('app.name', 'FixSale POS'));
        $legalName = ($empresa?->razon_social && $empresa->razon_social !== $companyTitle)
            ? $empresa->razon_social
            : 'Control de Inventario y Abastecimiento';

        $leftX = $x;
        $leftMaxW = $contentW - 205.0;

        // Optional Logo or Corporate Monogram Badge
        $textStartX = $leftX;
        if ($logoKey !== null && isset($this->images[$logoKey])) {
            $img = $this->images[$logoKey];
            $maxLogoW = 90.0;
            $maxLogoH = 44.0;
            $scale = min($maxLogoW / max(1, $img['w']), $maxLogoH / max(1, $img['h']));
            $drawW = $img['w'] * $scale;
            $drawH = $img['h'] * $scale;
            $this->drawImage($logoKey, $leftX, $y + 2.0, $drawW, $drawH);
            $textStartX = $leftX + $drawW + 10.0;
        } else {
            // Sleek Corporate Monogram Box
            $this->fillRoundedRect($leftX, $y + 1.0, 38.0, 38.0, 7.0, [15, 23, 42]);
            $this->fillRoundedRect($leftX + 5.0, $y + 32.5, 28.0, 2.8, 1.4, [225, 29, 72]);
            $initials = $this->extractInitials($companyTitle);
            $this->drawTextCentered($initials, $leftX, $y + 22.5, 38.0, 13.5, true, [255, 255, 255]);
            $textStartX = $leftX + 47.0;
        }

        $availTitleW = max(120.0, ($x + $leftMaxW) - $textStartX);
        $titleLine = $this->truncateToWidth(mb_strtoupper($companyTitle, 'UTF-8'), $availTitleW, 14.0, true);
        $this->drawText($titleLine, $textStartX, $y + 12.0, 14.0, true, [15, 23, 42]);

        $subLine = $this->truncateToWidth($legalName, $availTitleW, 8.5, true);
        $this->drawText($subLine, $textStartX, $y + 23.5, 8.5, true, [225, 29, 72]);

        // Metadata lines below company name
        $infoY = $y + 34.5;
        $metaParts = [];
        if (! empty($empresa?->documento)) {
            $metaParts[] = 'ID Fiscal: ' . $empresa->documento;
        }
        $branchName = $sucursal?->nombre ?: 'Todas las Sucursales';
        $metaParts[] = 'Sucursal: ' . $branchName;

        $this->drawText(
            $this->truncateToWidth(implode('   |   ', $metaParts), $availTitleW, 8.0, false),
            $textStartX,
            $infoY,
            8.0,
            false,
            [51, 65, 85]
        );
        $infoY += 10.5;

        $direccion = $sucursal?->direccion ?: ($empresa?->direccion ?: '');
        $telefono = $sucursal?->telefono ?: ($empresa?->telefono ?: '');
        $email = $empresa?->email ?: '';

        $contactParts = array_values(array_filter([
            $direccion ? $direccion : null,
            $telefono ? ('Tel: ' . $telefono) : null,
            $email ? $email : null,
        ]));

        if (! empty($contactParts)) {
            $this->drawText(
                $this->truncateToWidth(implode('  •  ', $contactParts), $leftMaxW, 7.5, false),
                $leftX,
                max($infoY + 4.0, $y + 50.0),
                7.5,
                false,
                [100, 116, 139]
            );
        }

        // Right-aligned Document Control Box
        $boxW = 195.0;
        $boxH = 62.0;
        $boxX = $x + $contentW - $boxW;
        $boxY = $y;

        $this->fillAndStrokeRoundedRect($boxX, $boxY, $boxW, $boxH, 6.0, [248, 250, 252], [203, 213, 225], 0.9);
        // Header strip inside Document Box
        $this->fillRoundedRect($boxX, $boxY, $boxW, 17.5, 6.0, [15, 23, 42]);
        $this->fillRect($boxX, $boxY + 11.5, $boxW, 6.0, [15, 23, 42]); // square bottom corners of top strip

        $this->drawTextCentered('REPORTE DE STOCK BAJO', $boxX, $boxY + 11.8, $boxW, 8.2, true, [255, 255, 255]);

        // Folio + Details inside box
        $this->drawText('Folio:', $boxX + 9.0, $boxY + 28.5, 7.5, false, [100, 116, 139]);
        $this->drawTextRight($folio, $boxX + $boxW - 9.0, $boxY + 28.5, 8.2, true, [225, 29, 72]);

        $this->drawText('Emisión:', $boxX + 9.0, $boxY + 39.0, 7.5, false, [100, 116, 139]);
        $this->drawTextRight($generatedAt, $boxX + $boxW - 9.0, $boxY + 39.0, 7.8, true, [30, 41, 59]);

        $emitter = $user?->name ?: 'Sistema';
        $this->drawText('Emitido por:', $boxX + 9.0, $boxY + 49.5, 7.5, false, [100, 116, 139]);
        $this->drawTextRight(
            $this->truncateToWidth($emitter, 115.0, 7.5, false),
            $boxX + $boxW - 9.0,
            $boxY + 49.5,
            7.5,
            false,
            [51, 65, 85]
        );

        $headerBottom = $boxY + $boxH + 7.0;

        // Report Title Banner + Filter Scope Pill
        $this->drawLine($x, $headerBottom, $x + $contentW, $headerBottom, [226, 232, 240], 1.0);
        $bannerY = $headerBottom + 6.0;

        $this->drawText(
            'INFORME EJECUTIVO DE REPOSICIÓN AGRUPADO POR MARCAS',
            $x,
            $bannerY + 9.5,
            9.5,
            true,
            [15, 23, 42]
        );

        $scopeText = 'Alcance: ' . $filterLabel;
        $scopeW = min(220.0, $this->measureTextWidth($scopeText, 7.5, true) + 14.0);
        $scopeX = $x + $contentW - $scopeW;
        $this->fillAndStrokeRoundedRect($scopeX, $bannerY, $scopeW, 14.0, 7.0, [241, 245, 249], [203, 213, 225], 0.6);
        $this->drawTextCentered(
            $this->truncateToWidth($scopeText, $scopeW - 10.0, 7.5, true),
            $scopeX,
            $bannerY + 9.5,
            $scopeW,
            7.5,
            true,
            [51, 65, 85]
        );

        $this->cursorY = $bannerY + 20.0;
    }

    private function drawCompactContinuationHeader(?Empresa $empresa, string $folio, string $generatedAt): void
    {
        $contentW = self::PAGE_W - self::MARGIN_L - self::MARGIN_R;
        $x = self::MARGIN_L;
        $y = $this->cursorY;

        $this->fillRoundedRect($x, $y, $contentW, 3.0, 1.5, [15, 23, 42]);
        $this->fillRoundedRect($x, $y, 95.0, 3.0, 1.5, [225, 29, 72]);
        $y += 7.0;

        $companyTitle = $empresa?->nombre_comercial ?: ($empresa?->razon_social ?: config('app.name', 'FixSale POS'));
        $this->drawText(
            $this->truncateToWidth(mb_strtoupper($companyTitle, 'UTF-8') . ' — REPORTE DE STOCK BAJO POR MARCAS', 350.0, 8.5, true),
            $x,
            $y + 8.0,
            8.5,
            true,
            [15, 23, 42]
        );

        $this->drawTextRight(
            "Folio: {$folio}   |   {$generatedAt}",
            $x + $contentW,
            $y + 8.0,
            7.5,
            false,
            [100, 116, 139]
        );

        $this->drawLine($x, $y + 13.0, $x + $contentW, $y + 13.0, [203, 213, 225], 0.8);
        $this->cursorY = $y + 20.0;
    }

    /**
     * @param  array<string, mixed>  $resumen
     */
    private function drawExecutiveKpiStrip(array $resumen, string $currency, bool $hasCostData): void
    {
        $contentW = self::PAGE_W - self::MARGIN_L - self::MARGIN_R;
        $x = self::MARGIN_L;
        $y = $this->cursorY;

        $total = (int) ($resumen['total'] ?? 0);
        $totalMarcas = (int) ($resumen['total_marcas'] ?? 0);
        $agotado = (int) ($resumen['agotado'] ?? 0);
        $critico = (int) ($resumen['critico'] ?? 0);
        $bajoAlerta = (int) ($resumen['bajo'] ?? 0) + (int) ($resumen['alerta'] ?? 0);
        $faltantes = (float) ($resumen['unidades_faltantes'] ?? 0);
        $costoEst = (float) ($resumen['costo_estimado_reposicion'] ?? 0);

        $cards = [
            [
                'label' => 'TOTAL EN ALERTA',
                'value' => (string) $total,
                'sub' => $total === 1 ? 'producto detectado' : 'productos detectados',
                'bg' => [248, 250, 252],
                'border' => [203, 213, 225],
                'accent' => [15, 23, 42],
                'text' => [15, 23, 42],
            ],
            [
                'label' => 'MARCAS AFECTADAS',
                'value' => (string) $totalMarcas,
                'sub' => $totalMarcas === 1 ? 'marca agrupada' : 'marcas agrupadas',
                'bg' => [238, 242, 255],
                'border' => [199, 210, 254],
                'accent' => [67, 56, 202],
                'text' => [49, 46, 129],
            ],
            [
                'label' => 'AGOTADOS (0)',
                'value' => (string) $agotado,
                'sub' => 'sin existencia',
                'bg' => [255, 241, 242],
                'border' => [254, 205, 211],
                'accent' => [225, 29, 72],
                'text' => [190, 18, 60],
            ],
            [
                'label' => 'CRÍTICOS (<=25%)',
                'value' => (string) $critico,
                'sub' => 'urgencia máxima',
                'bg' => [255, 247, 237],
                'border' => [254, 215, 170],
                'accent' => [234, 88, 12],
                'text' => [194, 65, 12],
            ],
            [
                'label' => 'BAJO / ALERTA',
                'value' => (string) $bajoAlerta,
                'sub' => 'reposición preventiva',
                'bg' => [255, 251, 235],
                'border' => [253, 230, 138],
                'accent' => [217, 119, 6],
                'text' => [180, 83, 9],
            ],
            [
                'label' => 'UDS. A REPONER',
                'value' => '+' . $this->formatQty($faltantes),
                'sub' => $hasCostData
                    ? ('Est: ' . $currency . number_format($costoEst, 2))
                    : 'para stock mínimo',
                'bg' => [236, 253, 245],
                'border' => [167, 243, 208],
                'accent' => [5, 150, 105],
                'text' => [6, 95, 70],
            ],
        ];

        $gap = 5.5;
        $count = count($cards);
        $cardW = ($contentW - ($gap * ($count - 1))) / $count;
        $cardH = 47.5;

        foreach ($cards as $idx => $c) {
            $cx = $x + $idx * ($cardW + $gap);
            $this->fillAndStrokeRoundedRect($cx, $y, $cardW, $cardH, 5.0, $c['bg'], $c['border'], 0.8);
            // Top color indicator pill inside KPI card
            $this->fillRoundedRect($cx + 6.0, $y + 3.5, $cardW - 12.0, 2.2, 1.1, $c['accent']);

            $this->drawTextCentered($c['label'], $cx, $y + 15.8, $cardW, 6.2, true, [71, 85, 105]);
            $valFontSize = strlen($c['value']) > 7 ? 11.5 : 13.8;
            $this->drawTextCentered($c['value'], $cx, $y + 30.8, $cardW, $valFontSize, true, $c['text']);
            $this->drawTextCentered(
                $this->truncateToWidth($c['sub'], $cardW - 6.0, 6.2, false),
                $cx,
                $y + 41.5,
                $cardW,
                6.2,
                false,
                [100, 116, 139]
            );
        }

        $this->cursorY = $y + $cardH + 12.0;
    }

    private function drawEmptyStateBox(): void
    {
        $contentW = self::PAGE_W - self::MARGIN_L - self::MARGIN_R;
        $x = self::MARGIN_L;
        $y = $this->cursorY + 12.0;

        $this->fillAndStrokeRoundedRect($x, $y, $contentW, 72.0, 8.0, [240, 253, 244], [187, 247, 208], 1.0);
        $this->drawTextCentered('INVENTARIO EN NIVELES ÓPTIMOS', $x, $y + 30.0, $contentW, 12.0, true, [22, 101, 52]);
        $this->drawTextCentered(
            'No se encontraron productos por debajo del stock mínimo con los criterios seleccionados.',
            $x,
            $y + 47.0,
            $contentW,
            9.0,
            false,
            [21, 128, 61]
        );
        $this->cursorY = $y + 88.0;
    }

    /**
     * Draw a Brand Group Banner + Table + Brand Subtotal Row with smart pagination.
     *
     * @param  array<string, mixed>  $group
     */
    private function drawBrandSection(
        array $group,
        int $brandOrder,
        int $totalBrands,
        string $currency,
        bool $hasCostData,
        ?Empresa $empresa,
        string $folio,
        string $generatedAt
    ): void {
        $products = $group['products'] ?? [];
        if (empty($products)) {
            return;
        }

        // Ensure room for Brand Banner (22pt) + Table Header (17pt) + at least 1 row (24pt) = ~68pt
        $this->ensureSpace(72.0, $empresa, $folio, $generatedAt);

        $marcaName = (string) ($group['marca'] ?? 'Sin Marca');
        $this->drawBrandHeaderBanner($group, $brandOrder, $totalBrands, $currency, $hasCostData, false);
        $this->drawBrandTableColumnsHeader();

        foreach ($products as $idx => $product) {
            $rowLines = $this->wrapText((string) ($product['nombre'] ?? ''), 164.0, 8.0, true, 2);
            $hasExtraCode = ! empty($product['codigo_barras']) && $product['codigo_barras'] !== ($product['sku'] ?? null);
            $rowH = max(21.0, (count($rowLines) > 1 || $hasExtraCode) ? 26.5 : 21.0);

            if ($this->cursorY + $rowH > $this->maxBodyY()) {
                $this->addNewPage();
                $this->drawCompactContinuationHeader($empresa, $folio, $generatedAt);
                $this->drawBrandHeaderBanner($group, $brandOrder, $totalBrands, $currency, $hasCostData, true);
                $this->drawBrandTableColumnsHeader();
            }

            $this->drawProductRow($product, $idx + 1, $rowLines, $rowH, $idx % 2 === 1);
        }

        // Brand Subtotal Row
        if ($this->cursorY + 20.0 > $this->maxBodyY()) {
            $this->addNewPage();
            $this->drawCompactContinuationHeader($empresa, $folio, $generatedAt);
        }
        $this->drawBrandSubtotalRow($group, $marcaName, $currency, $hasCostData);

        $this->cursorY += 11.0;
    }

    /**
     * @param  array<string, mixed>  $group
     */
    private function drawBrandHeaderBanner(
        array $group,
        int $brandOrder,
        int $totalBrands,
        string $currency,
        bool $hasCostData,
        bool $isContinuation
    ): void {
        $contentW = self::PAGE_W - self::MARGIN_L - self::MARGIN_R;
        $x = self::MARGIN_L;
        $y = $this->cursorY;
        $h = 22.0;

        $marcaName = (string) ($group['marca'] ?? 'Sin Marca');
        $isSinMarca = ($group['marca_id'] ?? null) === null && mb_strtolower($marcaName, 'UTF-8') === 'sin marca';

        // Banner background
        $bg = $isSinMarca ? [51, 65, 85] : [15, 23, 42];
        $accent = ((int) ($group['agotados'] ?? 0)) > 0
            ? [225, 29, 72]
            : (((int) ($group['criticos'] ?? 0)) > 0 ? [234, 88, 12] : [79, 70, 229]);

        $this->fillRoundedRect($x, $y, $contentW, $h, 4.5, $bg);
        // Square bottom corners so it joins seamlessly with table header below
        $this->fillRect($x, $y + $h - 5.0, $contentW, 5.0, $bg);
        // Left vertical accent bar
        $this->fillRect($x, $y + 2.0, 4.0, $h - 2.0, $accent);

        // Brand index pill
        $pillText = "{$brandOrder}/{$totalBrands}";
        $pillW = max(24.0, $this->measureTextWidth($pillText, 6.8, true) + 8.0);
        $this->fillRoundedRect($x + 9.0, $y + 4.5, $pillW, 13.0, 3.0, [30, 41, 59]);
        $this->drawTextCentered($pillText, $x + 9.0, $y + 13.3, $pillW, 6.8, true, [203, 213, 225]);

        $titleLabel = 'MARCA: ' . mb_strtoupper($marcaName, 'UTF-8') . ($isContinuation ? ' (CONT.)' : '');
        $titleTrunc = $this->truncateToWidth($titleLabel, 210.0, 9.2, true);
        $titleX = $x + 14.0 + $pillW;
        $this->drawText(
            $titleTrunc,
            $titleX,
            $y + 14.3,
            9.2,
            true,
            [255, 255, 255]
        );

        // Right-aligned brand KPIs
        $totalProd = (int) ($group['total_productos'] ?? count($group['products'] ?? []));
        $agotados = (int) ($group['agotados'] ?? 0);
        $criticos = (int) ($group['criticos'] ?? 0);
        $faltantes = (float) ($group['unidades_faltantes'] ?? 0);

        $statsParts = [
            $totalProd . ($totalProd === 1 ? ' producto' : ' productos'),
        ];
        if ($agotados > 0) {
            $statsParts[] = "Agotados: {$agotados}";
        }
        if ($criticos > 0) {
            $statsParts[] = "Críticos: {$criticos}";
        }
        $statsParts[] = 'A pedir: +' . $this->formatQty($faltantes) . ' uds.';

        $statsStr = implode('  |  ', $statsParts);
        $availStatsW = max(160.0, ($x + $contentW - 8.0) - ($titleX + $this->measureTextWidth($titleTrunc, 9.2, true) + 12.0));
        $this->drawTextRight(
            $this->truncateToWidth($statsStr, $availStatsW, 7.4, true),
            $x + $contentW - 8.0,
            $y + 14.0,
            7.4,
            true,
            [226, 232, 240]
        );

        $this->cursorY = $y + $h;
    }

    /**
     * Column geometry for Brand Product Table (total width = 535.28pt):
     * [24, 78, 170, 74, 42, 40, 43, 64.28] = 535.28
     *
     * @return array<int, array{key: string, label: string, w: float, align: string}>
     */
    private function getProductColumns(): array
    {
        return [
            ['key' => 'num',       'label' => '#',                  'w' => 22.0,  'align' => 'center'],
            ['key' => 'sku',       'label' => 'SKU / CÓDIGO',       'w' => 80.0,  'align' => 'left'],
            ['key' => 'nombre',    'label' => 'PRODUCTO / MODELO',  'w' => 172.0, 'align' => 'left'],
            ['key' => 'categoria', 'label' => 'CATEGORÍA',          'w' => 74.0,  'align' => 'left'],
            ['key' => 'stock',     'label' => 'STOCK',              'w' => 41.0,  'align' => 'center'],
            ['key' => 'minimo',    'label' => 'MÍNIMO',             'w' => 40.0,  'align' => 'center'],
            ['key' => 'faltante',  'label' => 'A PEDIR',            'w' => 42.0,  'align' => 'center'],
            ['key' => 'estado',    'label' => 'ESTADO',             'w' => 64.28, 'align' => 'center'],
        ];
    }

    private function drawBrandTableColumnsHeader(): void
    {
        $contentW = self::PAGE_W - self::MARGIN_L - self::MARGIN_R;
        $x = self::MARGIN_L;
        $y = $this->cursorY;
        $h = 16.5;

        $this->fillAndStrokeRect($x, $y, $contentW, $h, [241, 245, 249], [203, 213, 225], 0.6);

        $cols = $this->getProductColumns();
        $colX = $x;
        foreach ($cols as $idx => $col) {
            if ($idx > 0) {
                $this->drawLine($colX, $y, $colX, $y + $h, [226, 232, 240], 0.5);
            }
            if ($col['align'] === 'center') {
                $this->drawTextCentered($col['label'], $colX, $y + 11.0, $col['w'], 6.8, true, [51, 65, 85]);
            } elseif ($col['align'] === 'right') {
                $this->drawTextRight($col['label'], $colX + $col['w'] - 5.0, $y + 11.0, 6.8, true, [51, 65, 85]);
            } else {
                $this->drawText($col['label'], $colX + 5.0, $y + 11.0, 6.8, true, [51, 65, 85]);
            }
            $colX += $col['w'];
        }

        $this->cursorY = $y + $h;
    }

    /**
     * @param  array<string, mixed>  $product
     * @param  array<int, string>  $nameLines
     */
    private function drawProductRow(array $product, int $rowNum, array $nameLines, float $rowH, bool $isOdd): void
    {
        $contentW = self::PAGE_W - self::MARGIN_L - self::MARGIN_R;
        $x = self::MARGIN_L;
        $y = $this->cursorY;

        $severidad = (string) ($product['severidad'] ?? 'alerta');
        $sevStyle = $this->getSeverityStyle($severidad);

        // Subtle alternating row fill (or soft rose tint for out-of-stock)
        $rowBg = $severidad === 'agotado'
            ? [255, 249, 250]
            : ($isOdd ? [248, 250, 252] : [255, 255, 255]);

        $this->fillAndStrokeRect($x, $y, $contentW, $rowH, $rowBg, [226, 232, 240], 0.5);
        // Left severity stripe on each row
        $this->fillRect($x, $y, 2.6, $rowH, $sevStyle['badgeBg']);

        $cols = $this->getProductColumns();
        $colX = $x;

        // Vertical column dividers
        foreach ($cols as $idx => $col) {
            if ($idx > 0) {
                $this->drawLine($colX, $y, $colX, $y + $rowH, [235, 240, 246], 0.4);
            }
            $colX += $col['w'];
        }

        // Render cell contents
        $cx = $x;
        $midBaseline = $y + ($rowH / 2.0) + 2.6;

        // 1. #
        $w0 = $cols[0]['w'];
        $this->drawTextCentered((string) $rowNum, $cx, $midBaseline, $w0, 7.5, false, [100, 116, 139]);
        $cx += $w0;

        // 2. SKU / Código
        $w1 = $cols[1]['w'];
        $sku = trim((string) ($product['sku'] ?? '')) ?: '—';
        $barcode = trim((string) ($product['codigo_barras'] ?? ''));
        $hasBarcode = $barcode !== '' && $barcode !== $sku;

        if ($hasBarcode) {
            $this->drawText(
                $this->truncateToWidth($sku, $w1 - 9.0, 7.5, true),
                $cx + 5.0,
                $y + 10.5,
                7.5,
                true,
                [30, 41, 59]
            );
            $this->drawText(
                $this->truncateToWidth($barcode, $w1 - 9.0, 6.6, false),
                $cx + 5.0,
                $y + 19.5,
                6.6,
                false,
                [100, 116, 139]
            );
        } else {
            $this->drawText(
                $this->truncateToWidth($sku, $w1 - 9.0, 7.5, true),
                $cx + 5.0,
                $midBaseline,
                7.5,
                true,
                [30, 41, 59]
            );
        }
        $cx += $w1;

        // 3. Producto / Modelo
        $w2 = $cols[2]['w'];
        if (count($nameLines) > 1) {
            $this->drawText($nameLines[0], $cx + 5.0, $y + 10.5, 8.0, true, [15, 23, 42]);
            $this->drawText($nameLines[1], $cx + 5.0, $y + 19.8, 7.6, false, [51, 65, 85]);
        } else {
            $this->drawText($nameLines[0] ?? '—', $cx + 5.0, $midBaseline, 8.0, true, [15, 23, 42]);
        }
        $cx += $w2;

        // 4. Categoría
        $w3 = $cols[3]['w'];
        $cat = trim((string) ($product['categoria'] ?? '')) ?: 'General';
        $this->drawText(
            $this->truncateToWidth($cat, $w3 - 9.0, 7.5, false),
            $cx + 5.0,
            $midBaseline,
            7.5,
            false,
            [71, 85, 105]
        );
        $cx += $w3;

        // 5. Stock Actual + mini ratio bar
        $w4 = $cols[4]['w'];
        $stock = (float) ($product['stock'] ?? 0);
        $stockColor = $stock <= 0 ? [225, 29, 72] : [15, 23, 42];
        $this->drawTextCentered($this->formatQty($stock), $cx, $y + ($rowH / 2.0) + 0.5, $w4, 8.8, true, $stockColor);

        // Mini stock bar inside Stock cell
        $ratio = max(0, min(100, (int) ($product['ratio'] ?? 0)));
        $barW = $w4 - 12.0;
        $barX = $cx + 6.0;
        $barY = $y + $rowH - 5.2;
        $this->fillRoundedRect($barX, $barY, $barW, 2.3, 1.0, [226, 232, 240]);
        if ($ratio > 0) {
            $fillW = max(2.2, ($barW * $ratio) / 100.0);
            $this->fillRoundedRect($barX, $barY, $fillW, 2.3, 1.0, $sevStyle['badgeBg']);
        }
        $cx += $w4;

        // 6. Stock Mínimo
        $w5 = $cols[5]['w'];
        $minimo = (float) ($product['stock_minimo'] ?? 0);
        $this->drawTextCentered($this->formatQty($minimo), $cx, $midBaseline, $w5, 8.0, false, [71, 85, 105]);
        $cx += $w5;

        // 7. A Pedir (Faltante)
        $w6 = $cols[6]['w'];
        $faltante = (float) ($product['faltante'] ?? max(0, $minimo - $stock));
        $pedirStr = $faltante > 0 ? ('+' . $this->formatQty($faltante)) : '0';
        $pedirColor = $faltante > 0 ? [5, 150, 105] : [100, 116, 139];
        $this->drawTextCentered($pedirStr, $cx, $midBaseline, $w6, 8.2, true, $pedirColor);
        $cx += $w6;

        // 8. Estado Pill Badge
        $w7 = $cols[7]['w'];
        $pillW = $w7 - 10.0;
        $pillH = 12.5;
        $pillX = $cx + 5.0;
        $pillY = $y + ($rowH - $pillH) / 2.0;

        $this->fillRoundedRect($pillX, $pillY, $pillW, $pillH, 6.0, $sevStyle['badgeBg']);
        $this->drawTextCentered($sevStyle['label'], $pillX, $pillY + 8.7, $pillW, 6.5, true, $sevStyle['badgeText']);

        $this->cursorY = $y + $rowH;
    }

    /**
     * @param  array<string, mixed>  $group
     */
    private function drawBrandSubtotalRow(array $group, string $marcaName, string $currency, bool $hasCostData): void
    {
        $contentW = self::PAGE_W - self::MARGIN_L - self::MARGIN_R;
        $x = self::MARGIN_L;
        $y = $this->cursorY;
        $h = 17.5;

        $this->fillAndStrokeRect($x, $y, $contentW, $h, [241, 245, 249], [203, 213, 225], 0.7);

        $cols = $this->getProductColumns();
        $leftSpanW = $cols[0]['w'] + $cols[1]['w'] + $cols[2]['w'] + $cols[3]['w'];

        $totalProd = (int) ($group['total_productos'] ?? count($group['products'] ?? []));
        $costo = (float) ($group['costo_reposicion'] ?? 0);
        $subLabel = "Subtotal {$marcaName} ({$totalProd} " . ($totalProd === 1 ? 'ítem' : 'ítems') . ')';
        if ($hasCostData && $costo > 0) {
            $subLabel .= '  •  Reposición est.: ' . $currency . number_format($costo, 2);
        }

        $this->drawText(
            $this->truncateToWidth($subLabel, $leftSpanW - 14.0, 7.5, true),
            $x + 7.0,
            $y + 11.5,
            7.5,
            true,
            [30, 41, 59]
        );

        // Sum stock, minimo, faltante aligned under columns 5, 6, 7
        $sumStock = 0.0;
        $sumMin = 0.0;
        foreach (($group['products'] ?? []) as $p) {
            $sumStock += (float) ($p['stock'] ?? 0);
            $sumMin += (float) ($p['stock_minimo'] ?? 0);
        }
        $sumFaltante = (float) ($group['unidades_faltantes'] ?? 0);

        $cx = $x + $leftSpanW;
        $this->drawLine($cx, $y, $cx, $y + $h, [203, 213, 225], 0.5);
        $this->drawTextCentered($this->formatQty($sumStock), $cx, $y + 11.5, $cols[4]['w'], 7.8, true, [15, 23, 42]);
        $cx += $cols[4]['w'];

        $this->drawLine($cx, $y, $cx, $y + $h, [203, 213, 225], 0.5);
        $this->drawTextCentered($this->formatQty($sumMin), $cx, $y + 11.5, $cols[5]['w'], 7.8, true, [71, 85, 105]);
        $cx += $cols[5]['w'];

        $this->drawLine($cx, $y, $cx, $y + $h, [203, 213, 225], 0.5);
        $this->drawTextCentered('+' . $this->formatQty($sumFaltante), $cx, $y + 11.5, $cols[6]['w'], 8.0, true, [5, 150, 105]);

        $this->cursorY = $y + $h;
    }

    /**
     * Consolidated executive summary table by Brand at the end of the PDF.
     *
     * @param  array<int, array<string, mixed>>  $brandGroups
     * @param  array<string, mixed>  $resumen
     */
    private function drawConsolidatedBrandSummary(
        array $brandGroups,
        array $resumen,
        string $currency,
        bool $hasCostData,
        ?Empresa $empresa,
        string $folio,
        string $generatedAt
    ): void {
        if (count($brandGroups) < 1) {
            return;
        }

        $this->ensureSpace(85.0, $empresa, $folio, $generatedAt);

        $contentW = self::PAGE_W - self::MARGIN_L - self::MARGIN_R;
        $x = self::MARGIN_L;
        $y = $this->cursorY + 4.0;

        // Section Title with Indigo Accent Bar
        $this->fillRect($x, $y, 3.5, 12.0, [67, 56, 202]);
        $this->drawText(
            'RESUMEN CONSOLIDADO POR MARCA (PLANIFICACIÓN DE COMPRAS)',
            $x + 8.5,
            $y + 9.5,
            9.0,
            true,
            [15, 23, 42]
        );
        $y += 17.0;

        $cols = $hasCostData
            ? [
                ['label' => 'MARCA',            'w' => 175.28, 'align' => 'left'],
                ['label' => 'PRODUCTOS',        'w' => 58.0,   'align' => 'center'],
                ['label' => 'AGOTADOS',         'w' => 56.0,   'align' => 'center'],
                ['label' => 'CRÍTICOS',         'w' => 56.0,   'align' => 'center'],
                ['label' => 'BAJO / ALERTA',    'w' => 64.0,   'align' => 'center'],
                ['label' => 'UDS. A PEDIR',     'w' => 60.0,   'align' => 'center'],
                ['label' => 'EST. REPOSICIÓN',  'w' => 66.0,   'align' => 'right'],
            ]
            : [
                ['label' => 'MARCA',            'w' => 215.28, 'align' => 'left'],
                ['label' => 'PRODUCTOS',        'w' => 64.0,   'align' => 'center'],
                ['label' => 'AGOTADOS',         'w' => 62.0,   'align' => 'center'],
                ['label' => 'CRÍTICOS',         'w' => 62.0,   'align' => 'center'],
                ['label' => 'BAJO / ALERTA',    'w' => 66.0,   'align' => 'center'],
                ['label' => 'UDS. A PEDIR',     'w' => 66.0,   'align' => 'center'],
            ];

        $drawSummaryHeader = function (float $hy) use ($x, $contentW, $cols): float {
            $hh = 16.5;
            $this->fillAndStrokeRect($x, $hy, $contentW, $hh, [15, 23, 42], [15, 23, 42], 0.6);
            $cx = $x;
            foreach ($cols as $c) {
                if ($c['align'] === 'center') {
                    $this->drawTextCentered($c['label'], $cx, $hy + 11.0, $c['w'], 6.8, true, [255, 255, 255]);
                } elseif ($c['align'] === 'right') {
                    $this->drawTextRight($c['label'], $cx + $c['w'] - 6.0, $hy + 11.0, 6.8, true, [255, 255, 255]);
                } else {
                    $this->drawText($c['label'], $cx + 7.0, $hy + 11.0, 6.8, true, [255, 255, 255]);
                }
                $cx += $c['w'];
            }

            return $hy + $hh;
        };

        $y = $drawSummaryHeader($y);

        foreach ($brandGroups as $idx => $g) {
            $rh = 16.5;
            if ($y + $rh > $this->maxBodyY()) {
                $this->cursorY = $y;
                $this->addNewPage();
                $this->drawCompactContinuationHeader($empresa, $folio, $generatedAt);
                $y = $drawSummaryHeader($this->cursorY);
            }

            $bg = $idx % 2 === 1 ? [248, 250, 252] : [255, 255, 255];
            $this->fillAndStrokeRect($x, $y, $contentW, $rh, $bg, [226, 232, 240], 0.5);

            $marca = (string) ($g['marca'] ?? 'Sin Marca');
            $tot = (int) ($g['total_productos'] ?? 0);
            $ago = (int) ($g['agotados'] ?? 0);
            $cri = (int) ($g['criticos'] ?? 0);
            $baj = (int) ($g['bajos'] ?? 0) + (int) ($g['alertas'] ?? 0);
            $fal = (float) ($g['unidades_faltantes'] ?? 0);
            $cos = (float) ($g['costo_reposicion'] ?? 0);

            $cx = $x;
            $this->drawText($this->truncateToWidth($marca, $cols[0]['w'] - 12.0, 7.8, true), $cx + 7.0, $y + 11.2, 7.8, true, [15, 23, 42]);
            $cx += $cols[0]['w'];

            $this->drawTextCentered((string) $tot, $cx, $y + 11.2, $cols[1]['w'], 7.8, true, [30, 41, 59]);
            $cx += $cols[1]['w'];

            $this->drawTextCentered((string) $ago, $cx, $y + 11.2, $cols[2]['w'], 7.8, $ago > 0, $ago > 0 ? [225, 29, 72] : [148, 163, 184]);
            $cx += $cols[2]['w'];

            $this->drawTextCentered((string) $cri, $cx, $y + 11.2, $cols[3]['w'], 7.8, $cri > 0, $cri > 0 ? [234, 88, 12] : [148, 163, 184]);
            $cx += $cols[3]['w'];

            $this->drawTextCentered((string) $baj, $cx, $y + 11.2, $cols[4]['w'], 7.8, false, [71, 85, 105]);
            $cx += $cols[4]['w'];

            $this->drawTextCentered('+' . $this->formatQty($fal), $cx, $y + 11.2, $cols[5]['w'], 8.0, true, [5, 150, 105]);
            $cx += $cols[5]['w'];

            if ($hasCostData) {
                $this->drawTextRight($currency . number_format($cos, 2), $cx + $cols[6]['w'] - 6.0, $y + 11.2, 7.8, true, [15, 23, 42]);
            }

            $y += $rh;
        }

        // Grand Total Row
        $th = 18.5;
        if ($y + $th > $this->maxBodyY()) {
            $this->cursorY = $y;
            $this->addNewPage();
            $this->drawCompactContinuationHeader($empresa, $folio, $generatedAt);
            $y = $this->cursorY;
        }

        $this->fillAndStrokeRect($x, $y, $contentW, $th, [241, 245, 249], [148, 163, 184], 0.8);
        $cx = $x;
        $this->drawText('TOTAL GENERAL (' . count($brandGroups) . ' MARCAS)', $cx + 7.0, $y + 12.2, 8.0, true, [15, 23, 42]);
        $cx += $cols[0]['w'];

        $this->drawTextCentered((string) ($resumen['total'] ?? 0), $cx, $y + 12.2, $cols[1]['w'], 8.2, true, [15, 23, 42]);
        $cx += $cols[1]['w'];

        $this->drawTextCentered((string) ($resumen['agotado'] ?? 0), $cx, $y + 12.2, $cols[2]['w'], 8.2, true, [225, 29, 72]);
        $cx += $cols[2]['w'];

        $this->drawTextCentered((string) ($resumen['critico'] ?? 0), $cx, $y + 12.2, $cols[3]['w'], 8.2, true, [234, 88, 12]);
        $cx += $cols[3]['w'];

        $bajoTotal = (int) ($resumen['bajo'] ?? 0) + (int) ($resumen['alerta'] ?? 0);
        $this->drawTextCentered((string) $bajoTotal, $cx, $y + 12.2, $cols[4]['w'], 8.2, true, [180, 83, 9]);
        $cx += $cols[4]['w'];

        $this->drawTextCentered('+' . $this->formatQty((float) ($resumen['unidades_faltantes'] ?? 0)), $cx, $y + 12.2, $cols[5]['w'], 8.4, true, [5, 150, 105]);
        $cx += $cols[5]['w'];

        if ($hasCostData) {
            $this->drawTextRight(
                $currency . number_format((float) ($resumen['costo_estimado_reposicion'] ?? 0), 2),
                $cx + $cols[6]['w'] - 6.0,
                $y + 12.2,
                8.2,
                true,
                [15, 23, 42]
            );
        }

        $this->cursorY = $y + $th + 10.0;
    }

    private function drawSignaturesBlock(?Empresa $empresa, ?User $user, string $folio, string $generatedAt): void
    {
        $this->ensureSpace(64.0, $empresa, $folio, $generatedAt);

        $contentW = self::PAGE_W - self::MARGIN_L - self::MARGIN_R;
        $x = self::MARGIN_L;
        $y = $this->cursorY + 26.0;

        $sigW = 190.0;
        $leftSigX = $x + 35.0;
        $rightSigX = $x + $contentW - 35.0 - $sigW;

        $this->drawLine($leftSigX, $y, $leftSigX + $sigW, $y, [51, 65, 85], 0.9);
        $this->drawTextCentered('ELABORADO / CONTROL DE INVENTARIO', $leftSigX, $y + 11.0, $sigW, 7.2, true, [15, 23, 42]);
        $this->drawTextCentered($user?->name ?: 'Responsable de Almacén', $leftSigX, $y + 20.5, $sigW, 7.0, false, [100, 116, 139]);

        $this->drawLine($rightSigX, $y, $rightSigX + $sigW, $y, [51, 65, 85], 0.9);
        $this->drawTextCentered('AUTORIZACIÓN DE COMPRAS / GERENCIA', $rightSigX, $y + 11.0, $sigW, 7.2, true, [15, 23, 42]);
        $companyName = $empresa?->nombre_comercial ?: ($empresa?->razon_social ?: 'Administración');
        $this->drawTextCentered($this->truncateToWidth($companyName, $sigW, 7.0, false), $rightSigX, $y + 20.5, $sigW, 7.0, false, [100, 116, 139]);

        $this->cursorY = $y + 28.0;
    }

    private function drawPageFooter(int $pageNum, int $totalPages, string $companyName, string $generatedAt, string $folio): void
    {
        $contentW = self::PAGE_W - self::MARGIN_L - self::MARGIN_R;
        $x = self::MARGIN_L;
        $footerTop = self::PAGE_H - 30.0;

        $this->drawLine($x, $footerTop, $x + $contentW, $footerTop, [203, 213, 225], 0.6);

        $leftFooter = $this->truncateToWidth(
            "{$companyName} - Reporte de Stock Bajo por Marcas ({$folio})",
            365.0,
            7.0,
            false
        );
        $this->drawText($leftFooter, $x, $footerTop + 11.0, 7.0, false, [100, 116, 139]);

        $this->drawTextRight(
            "Emitido: {$generatedAt}   |   Página {$pageNum} de {$totalPages}",
            $x + $contentW,
            $footerTop + 11.0,
            7.2,
            true,
            [71, 85, 105]
        );
    }

    // =========================================================================
    // HELPERS & SEVERITY STYLES
    // =========================================================================

    /**
     * @return array{label: string, badgeBg: array{int, int, int}, badgeText: array{int, int, int}}
     */
    private function getSeverityStyle(string $severidad): array
    {
        return match ($severidad) {
            'agotado' => [
                'label' => 'AGOTADO',
                'badgeBg' => [225, 29, 72],     // Rose-600
                'badgeText' => [255, 255, 255],
            ],
            'critico' => [
                'label' => 'CRÍTICO',
                'badgeBg' => [234, 88, 12],     // Orange-600
                'badgeText' => [255, 255, 255],
            ],
            'bajo' => [
                'label' => 'STOCK BAJO',
                'badgeBg' => [217, 119, 6],     // Amber-600
                'badgeText' => [255, 255, 255],
            ],
            default => [
                'label' => 'ALERTA',
                'badgeBg' => [250, 204, 21],    // Yellow-400
                'badgeText' => [113, 63, 18],   // Yellow-900
            ],
        };
    }

    private function formatQty(float $value): string
    {
        if (abs($value - round($value)) < 0.0001) {
            return number_format((int) round($value), 0, '.', ',');
        }

        return rtrim(rtrim(number_format($value, 2, '.', ','), '0'), '.');
    }

    private function extractInitials(string $name): string
    {
        $words = preg_split('/\s+/u', trim($name)) ?: [];
        $initials = '';
        foreach ($words as $w) {
            $ch = mb_substr($w, 0, 1, 'UTF-8');
            if (preg_match('/[A-Za-zÁÉÍÓÚÑ0-9]/u', $ch)) {
                $initials .= mb_strtoupper($ch, 'UTF-8');
                if (mb_strlen($initials, 'UTF-8') >= 2) {
                    break;
                }
            }
        }

        return $initials !== '' ? $initials : 'FS';
    }

    private function tryLoadCompanyLogo(?Empresa $empresa): ?string
    {
        if (! $empresa || empty($empresa->logo) || ! function_exists('imagecreatefromstring')) {
            return null;
        }

        $logo = trim((string) $empresa->logo);
        if (str_starts_with($logo, 'http://') || str_starts_with($logo, 'https://')) {
            return null;
        }

        $cleanRel = ltrim($logo, '/');
        $candidates = [
            public_path($cleanRel),
            public_path('storage/' . $cleanRel),
            storage_path('app/public/' . $cleanRel),
        ];

        foreach ($candidates as $filePath) {
            if (is_file($filePath) && is_readable($filePath) && filesize($filePath) > 0 && filesize($filePath) < 6 * 1024 * 1024) {
                $raw = @file_get_contents($filePath);
                if ($raw === false) {
                    continue;
                }

                $srcImg = @imagecreatefromstring($raw);
                if ($srcImg === false) {
                    continue;
                }

                $w = imagesx($srcImg);
                $h = imagesy($srcImg);
                if ($w <= 0 || $h <= 0) {
                    imagedestroy($srcImg);
                    continue;
                }

                // Composite onto crisp white background so transparent PNGs render cleanly
                $canvas = imagecreatetruecolor($w, $h);
                $white = imagecolorallocate($canvas, 255, 255, 255);
                imagefilledrectangle($canvas, 0, 0, $w, $h, $white);
                imagealphablending($canvas, true);
                imagecopy($canvas, $srcImg, 0, 0, 0, 0, $w, $h);
                imagedestroy($srcImg);

                ob_start();
                imagejpeg($canvas, null, 92);
                $jpegBytes = (string) ob_get_clean();
                imagedestroy($canvas);

                if ($jpegBytes !== '') {
                    $key = 'ImLogo1';
                    $this->images[$key] = [
                        'w' => $w,
                        'h' => $h,
                        'data' => $jpegBytes,
                    ];

                    return $key;
                }
            }
        }

        return null;
    }

    // =========================================================================
    // LOW-LEVEL PDF 1.4 GRAPHICS & TEXT ENGINE
    // =========================================================================

    private function maxBodyY(): float
    {
        return self::PAGE_H - self::MARGIN_B;
    }

    private function addNewPage(): void
    {
        $this->currentPage = count($this->pages) + 1;
        $this->pages[$this->currentPage] = '';
        $this->cursorY = self::MARGIN_T;
    }

    private function ensureSpace(float $neededHeight, ?Empresa $empresa, string $folio, string $generatedAt): void
    {
        if ($this->cursorY + $neededHeight > $this->maxBodyY()) {
            $this->addNewPage();
            $this->drawCompactContinuationHeader($empresa, $folio, $generatedAt);
        }
    }

    private function appendCmd(string $cmd): void
    {
        $this->pages[$this->currentPage] .= $cmd . "\n";
    }

    private function pdfY(float $topY): float
    {
        return self::PAGE_H - $topY;
    }

    /**
     * @param  array{int, int, int}  $rgb
     */
    private function colorFillCmd(array $rgb): string
    {
        return sprintf('%.3f %.3f %.3f rg', $rgb[0] / 255, $rgb[1] / 255, $rgb[2] / 255);
    }

    /**
     * @param  array{int, int, int}  $rgb
     */
    private function colorStrokeCmd(array $rgb): string
    {
        return sprintf('%.3f %.3f %.3f RG', $rgb[0] / 255, $rgb[1] / 255, $rgb[2] / 255);
    }

    /**
     * @param  array{int, int, int}  $rgb
     */
    private function fillRect(float $x, float $topY, float $w, float $h, array $rgb): void
    {
        $py = $this->pdfY($topY + $h);
        $this->appendCmd(sprintf(
            'q %s %.2f %.2f %.2f %.2f re f Q',
            $this->colorFillCmd($rgb),
            $x,
            $py,
            $w,
            $h
        ));
    }

    /**
     * @param  array{int, int, int}  $fillRgb
     * @param  array{int, int, int}  $strokeRgb
     */
    private function fillAndStrokeRect(float $x, float $topY, float $w, float $h, array $fillRgb, array $strokeRgb, float $lineW = 0.5): void
    {
        $py = $this->pdfY($topY + $h);
        $this->appendCmd(sprintf(
            'q %s %s %.2f w %.2f %.2f %.2f %.2f re B Q',
            $this->colorFillCmd($fillRgb),
            $this->colorStrokeCmd($strokeRgb),
            $lineW,
            $x,
            $py,
            $w,
            $h
        ));
    }

    /**
     * @param  array{int, int, int}  $rgb
     */
    private function fillRoundedRect(float $x, float $topY, float $w, float $h, float $r, array $rgb): void
    {
        $path = $this->roundedRectPath($x, $topY, $w, $h, $r);
        $this->appendCmd(sprintf('q %s %s f Q', $this->colorFillCmd($rgb), $path));
    }

    /**
     * @param  array{int, int, int}  $fillRgb
     * @param  array{int, int, int}  $strokeRgb
     */
    private function fillAndStrokeRoundedRect(float $x, float $topY, float $w, float $h, float $r, array $fillRgb, array $strokeRgb, float $lineW = 0.7): void
    {
        $path = $this->roundedRectPath($x, $topY, $w, $h, $r);
        $this->appendCmd(sprintf(
            'q %s %s %.2f w %s B Q',
            $this->colorFillCmd($fillRgb),
            $this->colorStrokeCmd($strokeRgb),
            $lineW,
            $path
        ));
    }

    private function roundedRectPath(float $x, float $topY, float $w, float $h, float $r): string
    {
        $r = max(0.0, min($r, $w / 2.0, $h / 2.0));
        $y = $this->pdfY($topY + $h); // bottom-left Y in PDF coords
        $k = 0.5522847498 * $r;

        return sprintf(
            '%.2f %.2f m ' .
            '%.2f %.2f l %.2f %.2f %.2f %.2f %.2f %.2f c ' .
            '%.2f %.2f l %.2f %.2f %.2f %.2f %.2f %.2f c ' .
            '%.2f %.2f l %.2f %.2f %.2f %.2f %.2f %.2f c ' .
            '%.2f %.2f l %.2f %.2f %.2f %.2f %.2f %.2f c h',
            $x + $r, $y,
            $x + $w - $r, $y,
            $x + $w - $r + $k, $y, $x + $w, $y + $r - $k, $x + $w, $y + $r,
            $x + $w, $y + $h - $r,
            $x + $w, $y + $h - $r + $k, $x + $w - $r + $k, $y + $h, $x + $w - $r, $y + $h,
            $x + $r, $y + $h,
            $x + $r - $k, $y + $h, $x, $y + $h - $r + $k, $x, $y + $h - $r,
            $x, $y + $r,
            $x, $y + $r - $k, $x + $r - $k, $y, $x + $r, $y
        );
    }

    /**
     * @param  array{int, int, int}  $rgb
     */
    private function drawLine(float $x1, float $topY1, float $x2, float $topY2, array $rgb, float $lineW = 0.5): void
    {
        $this->appendCmd(sprintf(
            'q %s %.2f w %.2f %.2f m %.2f %.2f l S Q',
            $this->colorStrokeCmd($rgb),
            $lineW,
            $x1,
            $this->pdfY($topY1),
            $x2,
            $this->pdfY($topY2)
        ));
    }

    private function drawImage(string $key, float $x, float $topY, float $w, float $h): void
    {
        $py = $this->pdfY($topY + $h);
        $this->appendCmd(sprintf('q %.2f 0 0 %.2f %.2f %.2f cm /%s Do Q', $w, $h, $x, $py, $key));
    }

    /**
     * @param  array{int, int, int}  $rgb
     */
    private function drawText(string $text, float $x, float $baselineTopY, float $fontSize, bool $bold, array $rgb): void
    {
        if ($text === '') {
            return;
        }
        $fontRef = $bold ? '/F2' : '/F1';
        $encoded = $this->encodePdfText($text);
        $py = $this->pdfY($baselineTopY);

        $this->appendCmd(sprintf(
            'BT %s %s %.2f Tf %.2f %.2f Td (%s) Tj ET',
            $this->colorFillCmd($rgb),
            $fontRef,
            $fontSize,
            $x,
            $py,
            $encoded
        ));
    }

    /**
     * @param  array{int, int, int}  $rgb
     */
    private function drawTextCentered(string $text, float $boxX, float $baselineTopY, float $boxW, float $fontSize, bool $bold, array $rgb): void
    {
        $tw = $this->measureTextWidth($text, $fontSize, $bold);
        $tx = $boxX + max(0.0, ($boxW - $tw) / 2.0);
        $this->drawText($text, $tx, $baselineTopY, $fontSize, $bold, $rgb);
    }

    /**
     * @param  array{int, int, int}  $rgb
     */
    private function drawTextRight(string $text, float $rightX, float $baselineTopY, float $fontSize, bool $bold, array $rgb): void
    {
        $tw = $this->measureTextWidth($text, $fontSize, $bold);
        $this->drawText($text, $rightX - $tw, $baselineTopY, $fontSize, $bold, $rgb);
    }

    private function toWinAnsiBytes(string $text): string
    {
        // Normalize common typographic symbols to clean WinAnsi equivalents
        $clean = strtr($text, [
            '—' => '-',
            '–' => '-',
            '•' => '-',
            '…' => '...',
            '“' => '"',
            '”' => '"',
            '‘' => "'",
            '’' => "'",
            '≤' => '<=',
            '≥' => '>=',
        ]);

        // Strip emojis / astral plane symbols cleanly
        $clean = preg_replace('/[\x{10000}-\x{10FFFF}]/u', '', $clean) ?? $clean;

        if (function_exists('iconv')) {
            $converted = @iconv('UTF-8', 'Windows-1252//TRANSLIT//IGNORE', $clean);
            if ($converted !== false) {
                return $converted;
            }
        }

        return mb_convert_encoding($clean, 'ISO-8859-1', 'UTF-8');
    }

    private function encodePdfText(string $text): string
    {
        $bytes = $this->toWinAnsiBytes($text);

        return strtr($bytes, [
            '\\' => '\\\\',
            '(' => '\\(',
            ')' => '\\)',
            "\r" => '',
            "\n" => ' ',
        ]);
    }

    private function measureTextWidth(string $text, float $fontSize, bool $bold): float
    {
        $bytes = $this->toWinAnsiBytes($text);
        $len = strlen($bytes);
        $units = 0;
        $boldFactor = $bold ? 1.045 : 1.0;

        for ($i = 0; $i < $len; $i++) {
            $ord = ord($bytes[$i]);
            $units += self::HELVETICA_WIDTHS[$ord] ?? 556;
        }

        return ($units / 1000.0) * $fontSize * $boldFactor;
    }

    private function truncateToWidth(string $text, float $maxWidth, float $fontSize, bool $bold): string
    {
        if ($this->measureTextWidth($text, $fontSize, $bold) <= $maxWidth) {
            return $text;
        }

        $ellipsis = '...';
        $ellipsisW = $this->measureTextWidth($ellipsis, $fontSize, $bold);
        $targetW = max(0.0, $maxWidth - $ellipsisW);

        $chars = mb_strlen($text, 'UTF-8');
        $low = 0;
        $high = $chars;
        $best = '';

        while ($low <= $high) {
            $mid = intdiv($low + $high, 2);
            $candidate = rtrim(mb_substr($text, 0, $mid, 'UTF-8'));
            if ($this->measureTextWidth($candidate, $fontSize, $bold) <= $targetW) {
                $best = $candidate;
                $low = $mid + 1;
            } else {
                $high = $mid - 1;
            }
        }

        return $best . $ellipsis;
    }

    /**
     * @return array<int, string>
     */
    private function wrapText(string $text, float $maxWidth, float $fontSize, bool $bold, int $maxLines = 2): array
    {
        $text = trim(preg_replace('/\s+/u', ' ', $text) ?? $text);
        if ($text === '') {
            return ['—'];
        }

        if ($this->measureTextWidth($text, $fontSize, $bold) <= $maxWidth) {
            return [$text];
        }

        $words = explode(' ', $text);
        $lines = [];
        $current = '';

        foreach ($words as $idx => $word) {
            $test = $current === '' ? $word : ($current . ' ' . $word);
            if ($this->measureTextWidth($test, $fontSize, $bold) <= $maxWidth) {
                $current = $test;
            } else {
                if ($current === '') {
                    // Single very long token without spaces
                    $lines[] = $this->truncateToWidth($word, $maxWidth, $fontSize, $bold);
                } else {
                    $lines[] = $current;
                    $current = $word;
                }

                if (count($lines) === $maxLines - 1) {
                    $remainingWords = array_slice($words, $current === $word ? $idx : $idx + 1);
                    $rest = implode(' ', $remainingWords);
                    $lines[] = $this->truncateToWidth($rest, $maxWidth, $fontSize, false);

                    return $lines;
                }
            }
        }

        if ($current !== '' && count($lines) < $maxLines) {
            $lines[] = $this->truncateToWidth($current, $maxWidth, $fontSize, count($lines) === 0 ? $bold : false);
        }

        return $lines ?: ['—'];
    }

    // =========================================================================
    // PDF 1.4 BINARY COMPILER (XREF + COMPRESSED STREAMS)
    // =========================================================================

    private function compilePdfDocument(): string
    {
        $objects = [];
        $nextObjId = 1;

        $catalogId = $nextObjId++; // 1
        $pagesId = $nextObjId++;   // 2
        $fontRegId = $nextObjId++; // 3
        $fontBoldId = $nextObjId++; // 4

        $objects[$fontRegId] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>';
        $objects[$fontBoldId] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>';

        // Register embedded JPEG image XObjects
        $xObjectRefs = [];
        foreach ($this->images as $key => &$img) {
            $imgId = $nextObjId++;
            $img['id'] = $imgId;
            $len = strlen($img['data']);
            $objects[$imgId] = sprintf(
                "<< /Type /XObject /Subtype /Image /Width %d /Height %d /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length %d >>\nstream\n%s\nendstream",
                $img['w'],
                $img['h'],
                $len,
                $img['data']
            );
            $xObjectRefs[] = "/{$key} {$imgId} 0 R";
        }
        unset($img);

        $xObjectDict = ! empty($xObjectRefs)
            ? ' /XObject << ' . implode(' ', $xObjectRefs) . ' >>'
            : '';

        $resourcesDict = sprintf(
            '<< /Font << /F1 %d 0 R /F2 %d 0 R >>%s >>',
            $fontRegId,
            $fontBoldId,
            $xObjectDict
        );

        $pageObjIds = [];
        foreach ($this->pages as $streamContent) {
            $contentId = $nextObjId++;
            $pageId = $nextObjId++;
            $pageObjIds[] = $pageId;

            if (function_exists('gzcompress')) {
                $compressed = gzcompress($streamContent, 6);
                if ($compressed !== false) {
                    $objects[$contentId] = sprintf(
                        "<< /Filter /FlateDecode /Length %d >>\nstream\n%s\nendstream",
                        strlen($compressed),
                        $compressed
                    );
                } else {
                    $objects[$contentId] = sprintf(
                        "<< /Length %d >>\nstream\n%s\nendstream",
                        strlen($streamContent),
                        $streamContent
                    );
                }
            } else {
                $objects[$contentId] = sprintf(
                    "<< /Length %d >>\nstream\n%s\nendstream",
                    strlen($streamContent),
                    $streamContent
                );
            }

            $objects[$pageId] = sprintf(
                '<< /Type /Page /Parent %d 0 R /MediaBox [0 0 %.2f %.2f] /Resources %s /Contents %d 0 R >>',
                $pagesId,
                self::PAGE_W,
                self::PAGE_H,
                $resourcesDict,
                $contentId
            );
        }

        $kidsStr = implode(' ', array_map(fn (int $id) => "{$id} 0 R", $pageObjIds));
        $objects[$pagesId] = sprintf('<< /Type /Pages /Kids [ %s ] /Count %d >>', $kidsStr, count($pageObjIds));

        $infoId = $nextObjId++;
        $title = $this->encodePdfText('Reporte de Productos con Stock Bajo por Marcas');
        $creator = $this->encodePdfText('FixSale Inventory Engine');
        $pdfDate = 'D:' . date('YmdHis');
        $objects[$infoId] = "<< /Title ({$title}) /Creator ({$creator}) /Producer ({$creator}) /CreationDate ({$pdfDate}) >>";

        $objects[$catalogId] = sprintf('<< /Type /Catalog /Pages %d 0 R >>', $pagesId);

        ksort($objects);

        $buffer = "%PDF-1.4\n%\xE2\xE3\xCF\xD3\n";
        $offsets = [0 => 0];

        foreach ($objects as $id => $body) {
            $offsets[$id] = strlen($buffer);
            $buffer .= "{$id} 0 obj\n{$body}\nendobj\n";
        }

        $xrefOffset = strlen($buffer);
        $totalObjs = $nextObjId;
        $buffer .= "xref\n0 {$totalObjs}\n";
        $buffer .= "0000000000 65535 f \n";

        for ($i = 1; $i < $totalObjs; $i++) {
            $buffer .= sprintf("%010d 00000 n \n", $offsets[$i] ?? 0);
        }

        $buffer .= sprintf(
            "trailer\n<< /Size %d /Root %d 0 R /Info %d 0 R >>\nstartxref\n%d\n%%%%EOF\n",
            $totalObjs,
            $catalogId,
            $infoId,
            $xrefOffset
        );

        return $buffer;
    }
}

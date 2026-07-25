<?php

namespace Database\Seeders;

use App\Models\Familia;
use App\Models\Modelo;
use Illuminate\Database\Seeder;

class EspecificacionesSeeder extends Seeder
{
    /**
     * Run the database seeds for specifications for ALL families and models.
     */
    public function run(): void
    {
        // ==========================================
        // 1. ESPECIFICACIONES BASE POR FAMILIA
        // ==========================================
        $familiaSpecs = [
            // --- APPLE ---
            'iPhone Serie 14' => [
                'Pantalla' => 'OLED Super Retina XDR',
                'Procesador' => 'Apple A15 / A16 Bionic',
                'Conector' => 'Lightning',
                'Conectividad' => '5G, Wi-Fi 6, Bluetooth 5.3, UWB',
                'Sistema Operativo' => 'iOS',
                'Resistencia' => 'IP68 (6 metros por 30 mins)',
            ],
            'iPhone Serie 15' => [
                'Pantalla' => 'Super Retina XDR OLED Dynamic Island',
                'Procesador' => 'Apple A16 / A17 Pro',
                'Conector' => 'USB-C',
                'Conectividad' => '5G, Wi-Fi 6E, Bluetooth 5.3, U2 Chip',
                'Sistema Operativo' => 'iOS',
                'Resistencia' => 'IP68',
            ],
            'iPhone Serie 13' => [
                'Pantalla' => 'Super Retina XDR OLED',
                'Procesador' => 'Apple A15 Bionic (5nm)',
                'Conector' => 'Lightning',
                'Conectividad' => '5G, Wi-Fi 6, Bluetooth 5.0',
                'Sistema Operativo' => 'iOS',
                'Resistencia' => 'IP68',
            ],
            'iPad Air Series' => [
                'Pantalla' => 'Liquid Retina Multi-Touch (2360x1640) True Tone',
                'Procesador' => 'Apple M1 / M2',
                'Conector' => 'USB-C (10Gbps)',
                'Compatibilidad' => 'Apple Pencil (2da Gen / Pro / USB-C)',
                'Sistema Operativo' => 'iPadOS',
            ],
            'iPad Pro Series' => [
                'Pantalla' => 'Liquid Retina XDR Ultra / ProMotion 120Hz',
                'Procesador' => 'Apple M2 / M4',
                'Conector' => 'Thunderbolt / USB 4 (40Gbps)',
                'Audio' => '4 altavoces estéreo de alta fidelidad',
                'Sistema Operativo' => 'iPadOS',
            ],
            'Apple Watch Series' => [
                'Pantalla' => 'OLED Retina Always-On (Pantalla siempre activa)',
                'Procesador' => 'Chip Apple S8 / S9 SiP',
                'Sensores' => 'ECG, Oxígeno en sangre (SpO2), Ritmo cardíaco, Detección de Caídas',
                'Resistencia' => '50 metros al agua (WR50) + IP6X',
                'Conectividad' => 'Wi-Fi, Bluetooth 5.3, GPS integrado',
                'Sistema Operativo' => 'watchOS',
            ],

            // --- SAMSUNG ---
            'Galaxy Serie S' => [
                'Pantalla' => 'Dynamic AMOLED 2X 120Hz HDR10+',
                'Procesador' => 'Snapdragon 8 Gen 2 / Gen 3 for Galaxy',
                'Conectividad' => '5G, Wi-Fi 6E/7, Bluetooth 5.3, NFC',
                'Resistencia' => 'IP68 (Polvo y Agua)',
                'Sistema Operativo' => 'Android / One UI',
            ],
            'Galaxy Serie A' => [
                'Pantalla' => 'Super AMOLED 120Hz FHD+',
                'Procesador' => 'Exynos / Snapdragon',
                'Batería' => '5000 mAh',
                'Carga Rápida' => '25W Super Fast Charging',
                'Sistema Operativo' => 'Android / One UI',
            ],
            'Galaxy Z Plegables' => [
                'Pantalla Principal' => 'Dynamic AMOLED 2X Plegable 120Hz Flex Display',
                'Procesador' => 'Snapdragon 8 Gen 2 / Gen 3',
                'Resistencia' => 'IPX8 (Resistente al agua)',
                'Bisagra' => 'Flex Hinge de gota de agua',
                'Sistema Operativo' => 'Android / One UI',
            ],
            'Galaxy Tab Serie S' => [
                'Pantalla' => 'Dynamic AMOLED 2X 120Hz',
                'Procesador' => 'Snapdragon 8 Gen 2',
                'Accesorios' => 'S-Pen incluido en caja',
                'Resistencia' => 'IP68',
                'Sistema Operativo' => 'Android / One UI',
            ],
            'Galaxy Watch Series' => [
                'Pantalla' => 'Super AMOLED Cristal de Zafiro',
                'Procesador' => 'Exynos W920 / W930',
                'Sensores' => 'BioActive (Composición corporal BIA, ECG, Presión arterial, SpO2)',
                'Resistencia' => '5ATM + IP68 + MIL-STD-810H',
                'Sistema Operativo' => 'Wear OS Powered by Samsung',
            ],

            // --- XIAOMI ---
            'Redmi Note 13 Series' => [
                'Pantalla' => 'AMOLED 120Hz FHD+ (Protección Gorilla Glass)',
                'Batería' => '5000 mAh',
                'Audio' => 'Altavoces dobles Dolby Atmos',
                'Conectividad' => 'Bluetooth 5.2/5.3, NFC, Infrarrojos',
                'Sistema Operativo' => 'Android / Xiaomi HyperOS',
            ],
            'POCO Serie X / F' => [
                'Pantalla' => 'AMOLED 120Hz Flow 1.5K',
                'Procesador' => 'MediaTek Dimensity / Snapdragon 8s',
                'Refrigeración' => 'LiquidCool Technology 3.0',
                'Batería' => '5000 mAh',
                'Sistema Operativo' => 'Android / Xiaomi HyperOS',
            ],
            'Xiaomi Pad Series' => [
                'Pantalla' => 'LCD / IPS 11" 144Hz WQHD+',
                'Procesador' => 'Snapdragon 870',
                'Batería' => '8840 mAh',
                'Audio' => 'Quad Speakers Dolby Atmos',
                'Sistema Operativo' => 'MIUI for Pad / HyperOS',
            ],
            'Xiaomi Smart Band / Watch' => [
                'Pantalla' => 'AMOLED de alta definición',
                'Sensores' => 'Frecuencia cardíaca 24h, SpO2, Monitoreo de sueño y estrés',
                'Resistencia' => '5 ATM (50 metros)',
                'Batería' => 'Hasta 14-16 días de autonomía',
                'Conectividad' => 'Bluetooth 5.3',
            ],

            // --- MOTOROLA ---
            'Moto G Series' => [
                'Pantalla' => 'Full HD+ 120Hz con sonido estéreo Dolby Atmos',
                'Batería' => '5000 mAh / 6000 mAh',
                'Carga Rápida' => 'TurboPower 30W',
                'Sistema Operativo' => 'Android MyUX',
            ],
            'Motorola Edge Series' => [
                'Pantalla' => 'pOLED 144Hz Curva Endless Edge',
                'Carga Rápida' => 'TurboPower 68W / 125W',
                'Resistencia' => 'IP68',
                'Sistema Operativo' => 'Android Hello UI',
            ],

            // --- HONOR ---
            'Honor X Series' => [
                'Pantalla' => 'AMOLED Pantalla Ultra Resistente 360°',
                'Batería' => '5300 mAh - 5800 mAh Durabilidad 3 días',
                'Carga Rápida' => '35W Honor SuperCharge',
                'Sistema Operativo' => 'MagicOS / Android',
            ],
            'Honor Magic Series' => [
                'Pantalla' => 'LTPO OLED 120Hz HDR10+ 5000 nits',
                'Cámara Principal' => 'Falcon Camera OIS Periscopio',
                'Batería' => '5600 mAh Silicio-Carbono',
                'Resistencia' => 'IP68 / Cristal Nanocristalino',
                'Sistema Operativo' => 'MagicOS',
            ],
            'Honor Pad Series' => [
                'Pantalla' => '11.5" 2K 120Hz Eye Protection',
                'Audio' => '6 Altavoces Sonido Envolvente',
                'Cuerpo' => 'Metal Unibody',
                'Sistema Operativo' => 'MagicOS for Pad',
            ],

            // --- INFINIX & TECNO ---
            'Infinix Note Series' => [
                'Pantalla' => 'AMOLED 120Hz 10-bit color',
                'Carga Rápida' => '45W / 70W All-Round FastCharge + Inalámbrica MagCharge',
                'Audio' => 'Sonido por JBL',
                'Sistema Operativo' => 'XOS / Android',
            ],
            'Infinix Hot Series' => [
                'Pantalla' => 'FHD+ 90Hz / 120Hz Punch-Hole',
                'Batería' => '5000 mAh',
                'Procesador' => 'Helio G88 / G99',
                'Sistema Operativo' => 'XOS',
            ],
            'Tecno Camon Series' => [
                'Pantalla' => 'AMOLED 120Hz Always-On',
                'Cámara Principal' => 'RGBW Ultra Night OIS',
                'Diseño' => 'Bisel Ultra Delgado / Piel Vegana',
                'Sistema Operativo' => 'HiOS / Android',
            ],
            'Tecno Spark Series' => [
                'Pantalla' => 'LCD 90Hz / 120Hz Magic Ring',
                'Batería' => '5000 mAh',
                'Memoria' => 'RAM Dinámica Expandible',
                'Sistema Operativo' => 'HiOS',
            ],
        ];

        foreach ($familiaSpecs as $nombreFamilia => $specs) {
            Familia::where('nombre', $nombreFamilia)->update([
                'specs_json' => $specs,
            ]);
        }

        // ==========================================
        // 2. ESPECIFICACIONES POR MODELO (TODOS LOS MODELOS)
        // ==========================================
        $modeloOverrides = [
            // --- APPLE IPHONE 13 ---
            'iPhone 13 Mini' => [
                'Pantalla' => '5.4" OLED Super Retina XDR (60Hz)',
                'RAM' => '4 GB',
                'Almacenamiento' => '128GB / 256GB / 512GB',
                'Batería' => '2,438 mAh',
                'Cámara Principal' => '12 MP (f/1.6) OIS + 12 MP Ultra Gran Angular',
                'Peso' => '141 gramos',
            ],
            'iPhone 13' => [
                'Pantalla' => '6.1" OLED Super Retina XDR (60Hz)',
                'RAM' => '4 GB',
                'Almacenamiento' => '128GB / 256GB / 512GB',
                'Batería' => '3,240 mAh',
                'Cámara Principal' => '12 MP OIS Sensor-Shift + 12 MP Ultra Gran Angular',
                'Peso' => '174 gramos',
            ],
            'iPhone 13 Pro' => [
                'Pantalla' => '6.1" OLED Super Retina XDR 120Hz ProMotion',
                'RAM' => '6 GB LPDDR4X',
                'Almacenamiento' => '128GB / 256GB / 512GB / 1TB',
                'Cámara Principal' => '12 MP (f/1.5) + 12 MP Telefoto 3x + 12 MP UW + LiDaR Scanner',
                'Batería' => '3,095 mAh',
                'Peso' => '204 gramos',
            ],
            'iPhone 13 Pro Max' => [
                'Pantalla' => '6.7" OLED Super Retina XDR 120Hz ProMotion',
                'RAM' => '6 GB',
                'Almacenamiento' => '128GB / 256GB / 512GB / 1TB',
                'Cámara Principal' => '12 MP OIS + 12 MP Telefoto 3x + 12 MP UW + LiDAR Scanner',
                'Batería' => '4,352 mAh',
                'Peso' => '240 gramos',
            ],

            // --- APPLE IPHONE 14 ---
            'iPhone 14' => [
                'Pantalla' => '6.1" OLED Super Retina XDR (60Hz)',
                'RAM' => '6 GB',
                'Almacenamiento' => '128GB / 256GB / 512GB',
                'Batería' => '3,279 mAh',
                'Cámara Principal' => '12 MP (f/1.5) OIS Sensor-Shift',
                'Cámara Frontal' => '12 MP TrueDepth con Autofoco',
                'Peso' => '172 gramos',
            ],
            'iPhone 14 Plus' => [
                'Pantalla' => '6.7" OLED Super Retina XDR (60Hz)',
                'RAM' => '6 GB',
                'Almacenamiento' => '128GB / 256GB / 512GB',
                'Batería' => '4,325 mAh',
                'Peso' => '203 gramos',
            ],
            'iPhone 14 Pro' => [
                'Pantalla' => '6.1" OLED Super Retina XDR 120Hz ProMotion',
                'Dynamic Island' => 'Sí',
                'Procesador' => 'Apple A16 Bionic (4nm)',
                'RAM' => '6 GB LPDDR5',
                'Almacenamiento' => '128GB / 256GB / 512GB / 1TB',
                'Cámara Principal' => '48 MP Quad Pixel OIS + 12MP Ultra Gran Angular + 12MP Telefoto 3x',
                'Batería' => '3,200 mAh',
                'Peso' => '206 gramos',
            ],
            'iPhone 14 Pro Max' => [
                'Pantalla' => '6.7" OLED Super Retina XDR 120Hz ProMotion',
                'Dynamic Island' => 'Sí',
                'Procesador' => 'Apple A16 Bionic (4nm)',
                'RAM' => '6 GB LPDDR5',
                'Almacenamiento' => '128GB / 256GB / 512GB / 1TB',
                'Cámara Principal' => '48 MP Quad Pixel OIS + 12MP Telefoto 3x',
                'Batería' => '4,323 mAh',
                'Peso' => '240 gramos',
            ],

            // --- APPLE IPHONE 15 ---
            'iPhone 15' => [
                'Pantalla' => '6.1" OLED Super Retina XDR Dynamic Island 2000 nits',
                'Procesador' => 'Apple A16 Bionic',
                'RAM' => '6 GB',
                'Almacenamiento' => '128GB / 256GB / 512GB',
                'Cámara Principal' => '48 MP (f/1.6) con Zoom Óptico 2x',
                'Conector' => 'USB-C (USB 2.0 480Mbps)',
                'Peso' => '171 gramos',
            ],
            'iPhone 15 Plus' => [
                'Pantalla' => '6.7" OLED Super Retina XDR Dynamic Island 2000 nits',
                'Procesador' => 'Apple A16 Bionic',
                'RAM' => '6 GB',
                'Almacenamiento' => '128GB / 256GB / 512GB',
                'Cámara Principal' => '48 MP con Zoom Óptico 2x',
                'Batería' => '4,383 mAh',
                'Conector' => 'USB-C',
                'Peso' => '201 gramos',
            ],
            'iPhone 15 Pro' => [
                'Pantalla' => '6.1" OLED 120Hz ProMotion',
                'Dynamic Island' => 'Sí',
                'Procesador' => 'Apple A17 Pro (3nm)',
                'Material' => 'Titanio Grado 5',
                'RAM' => '8 GB LPDDR5',
                'Almacenamiento' => '128GB / 256GB / 512GB / 1TB',
                'Cámara Principal' => '48 MP (24mm, 28mm, 35mm) + Telefoto 3x',
                'Boton Accion' => 'Configurable',
                'Conector' => 'USB-C 3.0 (10Gbps)',
                'Peso' => '187 gramos',
            ],
            'iPhone 15 Pro Max' => [
                'Pantalla' => '6.7" OLED 120Hz ProMotion',
                'Dynamic Island' => 'Sí',
                'Procesador' => 'Apple A17 Pro (3nm)',
                'Material' => 'Titanio Grado 5',
                'RAM' => '8 GB LPDDR5',
                'Almacenamiento' => '256GB / 512GB / 1TB',
                'Cámara Principal' => '48 MP + Telefoto Periscopio 5x (120mm OIS)',
                'Conector' => 'USB-C 3.0 (10Gbps)',
                'Peso' => '221 gramos',
            ],

            // --- APPLE IPAD & WATCH ---
            'iPad Air 5ta Gen (10.9")' => [
                'Pantalla' => '10.9" Liquid Retina IPS (2360x1640)',
                'Procesador' => 'Apple M1 (8 núcleos CPU, 8 núcleos GPU)',
                'RAM' => '8 GB',
                'Almacenamiento' => '64GB / 256GB',
                'Cámara Principal' => '12 MP Wide 4K',
                'Touch ID' => 'Integrado en botón superior',
            ],
            'iPad Air 6ta Gen (11")' => [
                'Pantalla' => '11" Liquid Retina IPS True Tone',
                'Procesador' => 'Apple M2 (8-core CPU, 10-core GPU)',
                'RAM' => '8 GB',
                'Almacenamiento' => '128GB / 256GB / 512GB / 1TB',
                'Cámara Frontal' => '12 MP Ultra Wide Horizontal Center Stage',
            ],
            'iPad Air 6ta Gen (13")' => [
                'Pantalla' => '13" Liquid Retina IPS (2732x2048)',
                'Procesador' => 'Apple M2',
                'RAM' => '8 GB',
                'Almacenamiento' => '128GB / 256GB / 512GB / 1TB',
            ],
            'iPad Pro 11" 4ta Gen' => [
                'Pantalla' => '11" Liquid Retina 120Hz ProMotion (600 nits)',
                'Procesador' => 'Apple M2',
                'RAM' => '8GB (128/256/512GB) / 16GB (1TB/2TB)',
                'Cámara' => '12 MP Wide + 10 MP Ultra Wide + LiDAR Scanner',
            ],
            'iPad Pro 12.9" 6ta Gen' => [
                'Pantalla' => '12.9" Liquid Retina XDR Mini-LED 120Hz (1600 nits pico)',
                'Procesador' => 'Apple M2',
                'RAM' => '8GB / 16GB',
                'Almacenamiento' => '128GB / 256GB / 512GB / 1TB / 2TB',
            ],
            'Apple Watch Series 8 (41mm/45mm)' => [
                'Caja' => 'Aluminio o Acero Inoxidable (41mm / 45mm)',
                'Pantalla' => 'OLED Retina Always-On 1000 nits',
                'Procesador' => 'Chip Apple S8',
                'Sensores' => 'Sensor de Temperatura, ECG, Oxígeno en Sangre, Detección de Accidentes',
                'Batería' => '18 horas (hasta 36 horas en modo Ahorro)',
            ],
            'Apple Watch Series 9 (41mm/45mm)' => [
                'Caja' => 'Aluminio / Acero Inoxidable (41mm / 45mm)',
                'Pantalla' => 'OLED Retina Always-On 2000 nits',
                'Procesador' => 'Chip Apple S9 SiP (4 núcleos Neural Engine)',
                'Gesto Doble Toque' => 'Sí (Double Tap Gesture)',
                'Chip UWB' => 'Ultra Wideband de 2da Generación (Rastreo preciso de iPhone)',
            ],
            'Apple Watch Ultra 2 (49mm)' => [
                'Caja' => 'Titanio Grado Aeroespacial 49mm',
                'Pantalla' => 'Cristal de Zafiro 3000 nits (La más brillante)',
                'Batería' => '36 horas (Hasta 72 horas en Bajo Consumo)',
                'Resistencia' => '100m Agua / Buceo 40m (Certificado EN13319) / MIL-STD 810H',
                'GPS' => 'GPS de Doble Frecuencia L1 y L5 de Máxima Precisión',
                'Sirena' => '86 decibelios (alcance 180 metros)',
            ],
            'Apple Watch SE 2da Gen' => [
                'Caja' => 'Aluminio (40mm / 44mm)',
                'Pantalla' => 'OLED Retina 1000 nits',
                'Procesador' => 'Chip Apple S8',
                'Sensores' => 'Ritmo Cardíaco, Detección de Caídas, Detección de Accidentes de Auto',
            ],

            // --- SAMSUNG GALAXY S & A ---
            'Galaxy S23 FE' => [
                'Pantalla' => '6.4" Dynamic AMOLED 2X 120Hz HDR10+',
                'Procesador' => 'Exynos 2200 / Snapdragon 8 Gen 1',
                'RAM' => '8 GB',
                'Almacenamiento' => '128GB / 256GB',
                'Cámara Principal' => '50 MP OIS + 8MP Telefoto 3x + 12MP Ultra Gran Angular',
                'Batería' => '4,500 mAh (Carga 25W)',
            ],
            'Galaxy S23 Ultra' => [
                'Pantalla' => '6.8" Quad HD+ Dynamic AMOLED 2X 120Hz',
                'Procesador' => 'Snapdragon 8 Gen 2 for Galaxy',
                'RAM' => '8 GB / 12 GB',
                'Almacenamiento' => '256GB / 512GB / 1TB',
                'Cámara Principal' => '200 MP ISOCELL HP2 OIS + Telefoto 3x + Periscopio 10x (100x Space Zoom)',
                'Batería' => '5,000 mAh (Carga 45W)',
                'S-Pen' => 'Integrado con Bluetooth',
            ],
            'Galaxy S24 5G' => [
                'Pantalla' => '6.2" Full HD+ Dynamic AMOLED 2X 1-120Hz (2600 nits)',
                'Procesador' => 'Exynos 2400 / Snapdragon 8 Gen 3',
                'RAM' => '8 GB',
                'Almacenamiento' => '128GB / 256GB',
                'Galaxy AI' => 'Circle to Search, Live Translate, Note Assist',
                'Batería' => '4,000 mAh (Carga 25W)',
            ],
            'Galaxy S24+ 5G' => [
                'Pantalla' => '6.7" Quad HD+ Dynamic AMOLED 2X 1-120Hz (2600 nits)',
                'Procesador' => 'Exynos 2400 / Snapdragon 8 Gen 3',
                'RAM' => '12 GB LPDDR5X',
                'Almacenamiento' => '256GB / 512GB',
                'Galaxy AI' => 'Circle to Search, Live Translate, Edit Assist',
                'Batería' => '4,900 mAh (Carga 45W)',
            ],
            'Galaxy S24 Ultra 5G' => [
                'Pantalla' => '6.8" Quad HD+ Flat Dynamic AMOLED 2X 2600 nits',
                'Material' => 'Marco de Titanio + Gorilla Glass Armor (Anti-Reflejos)',
                'Procesador' => 'Snapdragon 8 Gen 3 for Galaxy (4nm)',
                'RAM' => '12 GB LPDDR5X',
                'Almacenamiento' => '256GB / 512GB / 1TB UFS 4.0',
                'Cámara Principal' => '200 MP OIS + 50 MP 5x Zoom Periscopio (Video 8K) + 10 MP 3x + 12 MP UW',
                'Batería' => '5,000 mAh (Carga 45W)',
                'S-Pen' => 'Integrado',
                'Galaxy AI' => 'Suite Completa de Inteligencia Artificial',
            ],
            'Galaxy A05s' => [
                'Pantalla' => '6.7" PLS LCD FHD+ 90Hz',
                'Procesador' => 'Snapdragon 680 (6nm)',
                'RAM' => '4 GB / 6 GB',
                'Almacenamiento' => '64GB / 128GB (Expandible MicroSD)',
                'Cámara Principal' => '50 MP (f/1.8) + 2 MP Macro + 2 MP Profundidad',
                'Batería' => '5,000 mAh (Carga 25W)',
            ],
            'Galaxy A15 4G/5G' => [
                'Pantalla' => '6.5" Super AMOLED 90Hz 800 nits',
                'RAM' => '4 GB / 6 GB / 8 GB',
                'Almacenamiento' => '128GB / 256GB (Expandible MicroSD hasta 1TB)',
                'Cámara Principal' => '50 MP + 5 MP Ultra Gran Angular + 2 MP Macro',
                'Batería' => '5,000 mAh (Carga 25W)',
            ],
            'Galaxy A25 5G' => [
                'Pantalla' => '6.5" Super AMOLED 120Hz 1000 nits',
                'Procesador' => 'Exynos 1280 (5nm)',
                'RAM' => '6 GB / 8 GB',
                'Almacenamiento' => '128GB / 256GB',
                'Cámara Principal' => '50 MP OIS + 8 MP UW + 2 MP Macro',
                'Audio' => 'Altavoces Estéreo Dolby Atmos',
                'Batería' => '5,000 mAh (Carga 25W)',
            ],
            'Galaxy A35 5G' => [
                'Pantalla' => '6.6" Super AMOLED 120Hz Vision Booster',
                'Procesador' => 'Exynos 1380 (5nm)',
                'RAM' => '6 GB / 8 GB',
                'Almacenamiento' => '128GB / 256GB',
                'Cámara Principal' => '50 MP OIS + 8 MP UW + 5 MP Macro',
                'Resistencia' => 'IP67 (Agua y Polvo)',
                'Batería' => '5,000 mAh',
            ],
            'Galaxy A55 5G' => [
                'Pantalla' => '6.6" Super AMOLED 120Hz HDR10+ Gorilla Glass Victus+',
                'Procesador' => 'Exynos 1480 (4nm) con GPU Xclipse 530 (AMD RDNA2)',
                'Material' => 'Marco de Aluminio',
                'RAM' => '8 GB / 12 GB',
                'Almacenamiento' => '128GB / 256GB',
                'Cámara Principal' => '50 MP OIS Nightography + 12 MP UW + 5 MP Macro',
                'Resistencia' => 'IP67',
                'Batería' => '5,000 mAh (Carga 25W)',
            ],
            'Galaxy Z Flip5 5G' => [
                'Pantalla Externa' => '3.4" Super AMOLED Flex Window',
                'Pantalla Interna' => '6.7" Dynamic AMOLED 2X Plegable 120Hz',
                'Procesador' => 'Snapdragon 8 Gen 2 for Galaxy',
                'RAM' => '8 GB',
                'Almacenamiento' => '256GB / 512GB',
                'Batería' => '3,700 mAh',
            ],
            'Galaxy Z Fold5 5G' => [
                'Pantalla Externa' => '6.2" Dynamic AMOLED 2X 120Hz',
                'Pantalla Interna' => '7.6" Dynamic AMOLED 2X Plegable 120Hz Under Display Camera',
                'Procesador' => 'Snapdragon 8 Gen 2 for Galaxy',
                'RAM' => '12 GB LPDDR5X',
                'Almacenamiento' => '256GB / 512GB / 1TB',
                'S-Pen' => 'S-Pen Fold Edition Compatible',
                'Batería' => '4,400 mAh',
            ],

            // --- SAMSUNG TAB & WATCH ---
            'Galaxy Tab S9 FE 10.9"' => [
                'Pantalla' => '10.9" IPS LCD 90Hz',
                'Procesador' => 'Exynos 1380',
                'RAM' => '6 GB / 8 GB',
                'Almacenamiento' => '128GB / 256GB (Expandible MicroSD)',
                'Accesorios' => 'S-Pen Resistente al Agua IP68 Incluido',
                'Resistencia' => 'IP68 en Tablet y S-Pen',
            ],
            'Galaxy Tab S9 11"' => [
                'Pantalla' => '11" Dynamic AMOLED 2X 120Hz HDR10+',
                'Procesador' => 'Snapdragon 8 Gen 2 for Galaxy',
                'RAM' => '8 GB / 12 GB',
                'Almacenamiento' => '128GB / 256GB',
                'Resistencia' => 'IP68',
                'Batería' => '8,400 mAh (Carga 45W)',
            ],
            'Galaxy Tab S9 Ultra 14.6"' => [
                'Pantalla' => '14.6" Dynamic AMOLED 2X 120Hz HDR10+ (2960x1848)',
                'Procesador' => 'Snapdragon 8 Gen 2 for Galaxy',
                'RAM' => '12 GB / 16 GB',
                'Almacenamiento' => '256GB / 512GB / 1TB',
                'Batería' => '11,200 mAh (Carga 45W)',
            ],
            'Galaxy Watch5 Pro (45mm)' => [
                'Caja' => 'Titanio 45mm',
                'Pantalla' => '1.4" Super AMOLED Cristal de Zafiro',
                'Batería' => '590 mAh (La mayor autonomía en Galaxy Watch - hasta 80h)',
                'Funciones Outdoor' => 'Rutas GPX, Track Back',
            ],
            'Galaxy Watch6 (40mm/44mm)' => [
                'Caja' => 'Aluminio Armor (40mm / 44mm)',
                'Pantalla' => 'Super AMOLED Cristal de Zafiro 2000 nits (Bisel 20% más delgado)',
                'Procesador' => 'Exynos W930 (1.4GHz Dual Core)',
                'RAM' => '2 GB + 16GB Almacenamiento',
                'Sensores' => 'BioActive, ECG, Composición Corporal BIA, Análisis del Sueño Avanzado',
            ],
            'Galaxy Watch6 Classic (47mm)' => [
                'Caja' => 'Acero Inoxidable 47mm con Bisel Giratorio Físico',
                'Pantalla' => '1.5" Super AMOLED Cristal de Zafiro',
                'Batería' => '425 mAh',
                'Sensores' => 'BioActive 3 en 1, Monitor de ECG y Presión Arterial',
            ],

            // --- XIAOMI SMARTPHONES, TABLETS & WATCHES ---
            'Redmi Note 13 4G' => [
                'Pantalla' => '6.67" AMOLED 120Hz 1800 nits',
                'Procesador' => 'Snapdragon 685 (6nm)',
                'RAM' => '6 GB / 8 GB',
                'Almacenamiento' => '128GB / 256GB',
                'Cámara Principal' => '108 MP (f/1.75) + 8 MP UW + 2 MP Macro',
                'Batería' => '5,000 mAh (Carga 33W)',
            ],
            'Redmi Note 13 5G' => [
                'Pantalla' => '6.67" AMOLED 120Hz 1000 nits Gorilla Glass 5',
                'Procesador' => 'MediaTek Dimensity 6080 (6nm)',
                'RAM' => '6 GB / 8 GB',
                'Almacenamiento' => '128GB / 256GB',
                'Cámara Principal' => '108 MP + 8 MP UW + 2 MP Profundidad',
                'Batería' => '5,000 mAh (Carga 33W)',
            ],
            'Redmi Note 13 Pro 4G' => [
                'Pantalla' => '6.67" AMOLED 120Hz 1300 nits',
                'Procesador' => 'MediaTek Helio G99 Ultra',
                'RAM' => '8 GB / 12 GB',
                'Almacenamiento' => '256GB / 512GB',
                'Cámara Principal' => '200 MP Samsung ISOCELL HP3 OIS + 8 MP UW',
                'Batería' => '5,000 mAh (Carga Turbo 67W)',
            ],
            'Redmi Note 13 Pro 5G' => [
                'Pantalla' => '6.67" 1.5K CrystalRes AMOLED 120Hz Dolby Vision 1800 nits',
                'Procesador' => 'Snapdragon 7s Gen 2 (4nm)',
                'RAM' => '8 GB / 12 GB',
                'Almacenamiento' => '256GB / 512GB',
                'Cámara Principal' => '200 MP Samsung ISOCELL HP3 OIS + 8 MP UW + 2 MP Macro',
                'Batería' => '5,100 mAh (Carga Turbo 67W)',
            ],
            'Redmi Note 13 Pro+ 5G' => [
                'Pantalla' => '6.67" 1.5K AMOLED Curva 120Hz HDR10+ Gorilla Glass Victus',
                'Procesador' => 'MediaTek Dimensity 7200 Ultra (4nm)',
                'RAM' => '8 GB / 12 GB / 16 GB',
                'Almacenamiento' => '256GB / 512GB UFS 3.1',
                'Cámara Principal' => '200 MP OIS Sensor-Size 1/1.4" + 8 MP UW',
                'Batería' => '5,000 mAh (Carga HyperCharge 120W - 100% en 19 min)',
                'Resistencia' => 'IP68 (Sumergible a 1.5m por 30 min)',
            ],
            'POCO X6 Pro 5G' => [
                'Pantalla' => '6.67" 1.5K Flow AMOLED 120Hz 1800 nits',
                'Procesador' => 'MediaTek Dimensity 8300 Ultra (4nm) (Antutu ~1.46M)',
                'RAM' => '8 GB / 12 GB LPDDR5X',
                'Almacenamiento' => '256GB / 512GB UFS 4.0 ultra rápido',
                'Cámara Principal' => '64 MP OIS + 8 MP UW + 2 MP Macro',
                'Batería' => '5,000 mAh (Carga 67W)',
            ],
            'POCO F5 Pro 5G' => [
                'Pantalla' => '6.67" WQHD+ (3200x1440) AMOLED 120Hz 1400 nits',
                'Procesador' => 'Snapdragon 8+ Gen 1 (4nm)',
                'RAM' => '8 GB / 12 GB',
                'Almacenamiento' => '256GB / 512GB',
                'Cámara Principal' => '64 MP OIS 8K + 8 MP UW',
                'Batería' => '5,160 mAh (Carga 67W por cable + 30W Inalámbrica)',
            ],
            'POCO F6 5G' => [
                'Pantalla' => '6.67" 1.5K CrystalRes AMOLED 120Hz 2400 nits',
                'Procesador' => 'Qualcomm Snapdragon 8s Gen 3 (4nm)',
                'RAM' => '8 GB / 12 GB LPDDR5X',
                'Almacenamiento' => '256GB / 512GB UFS 4.0',
                'Cámara Principal' => '50 MP Sony IMX882 OIS + 8 MP UW',
                'Batería' => '5,000 mAh (Carga Turbo 90W)',
            ],
            'Redmi Pad SE 11"' => [
                'Pantalla' => '11" FHD+ LCD 90Hz (TÜV Rheinland Low Blue Light)',
                'Procesador' => 'Snapdragon 680',
                'RAM' => '4 GB / 8 GB',
                'Almacenamiento' => '128GB / 256GB (Expandible MicroSD)',
                'Audio' => 'Quad Speakers Dolby Atmos',
                'Batería' => '8,000 mAh',
            ],
            'Xiaomi Pad 6 (11")' => [
                'Pantalla' => '11" WQHD+ (2880x1800) IPS LCD 144Hz HDR10+ Dolby Vision',
                'Procesador' => 'Snapdragon 870 (7nm)',
                'RAM' => '6 GB / 8 GB LPDDR5',
                'Almacenamiento' => '128GB / 256GB UFS 3.1',
                'Batería' => '8,840 mAh (Carga Rápida 33W)',
            ],
            'Xiaomi Smart Band 8' => [
                'Pantalla' => '1.62" AMOLED 60Hz 600 nits con brillo automático',
                'Diseño' => 'Cuerpo metálico desmontable (Colgante, Clip para zapatillas)',
                'Batería' => '190 mAh (Hasta 16 días de uso típico)',
                'Modos Deportivos' => 'Más de 150 modos de entrenamiento y análisis de carrera',
            ],
            'Xiaomi Watch S3' => [
                'Pantalla' => '1.43" AMOLED 60Hz 600 nits con Bisel Intercambiable',
                'Sistema Operativo' => 'Xiaomi HyperOS',
                'Conectividad' => 'Bluetooth 5.2, GPS L1+L5 de 5 sistemas, NFC',
                'Batería' => '486 mAh (Hasta 15 días de uso)',
                'Resistencia' => '5 ATM',
            ],

            // --- MOTOROLA ---
            'Moto G24 Power' => [
                'Pantalla' => '6.6" HD+ 90Hz Punch-Hole',
                'Procesador' => 'MediaTek Helio G85',
                'RAM' => '8 GB (Expandible RAM Boost)',
                'Almacenamiento' => '128GB / 256GB',
                'Batería Extra' => '6,000 mAh Gran Autonomía (Carga TurboPower 30W)',
                'Cámara Principal' => '50 MP Quad Pixel + Macro',
            ],
            'Moto G54 5G' => [
                'Pantalla' => '6.5" Full HD+ 120Hz (2400x1080)',
                'Procesador' => 'MediaTek Dimensity 7020 5G (6nm)',
                'RAM' => '8 GB / 12 GB',
                'Almacenamiento' => '128GB / 256GB',
                'Cámara Principal' => '50 MP (f/1.8) con Estabilización Óptica OIS',
                'Batería' => '5,000 mAh (Carga TurboPower)',
            ],
            'Moto G84 5G' => [
                'Pantalla' => '6.55" pOLED FHD+ 120Hz 10-bit 1300 nits',
                'Procesador' => 'Snapdragon 695 5G',
                'RAM' => '12 GB',
                'Almacenamiento' => '256GB',
                'Acabado' => 'Cuero Vegano Pantone (Viva Magenta / Marshmallow Blue)',
                'Cámara Principal' => '50 MP Ultra Pixel OIS + 8 MP UW/Macro',
                'Batería' => '5,000 mAh (Carga TurboPower 30W)',
            ],
            'Motorola Edge 40 Neo' => [
                'Pantalla' => '6.55" pOLED Curva 144Hz 1300 nits Pantone',
                'Procesador' => 'MediaTek Dimensity 7030 (6nm)',
                'RAM' => '8 GB / 12 GB',
                'Almacenamiento' => '128GB / 256GB',
                'Resistencia' => 'IP68 (Resistente al Agua y Polvo)',
                'Batería' => '5,000 mAh (Carga TurboPower 68W - 50% en 15 min)',
            ],
            'Motorola Edge 50 Pro' => [
                'Pantalla' => '6.7" pOLED 144Hz Super HD 2000 nits Validación Pantone',
                'Procesador' => 'Snapdragon 7 Gen 3 (4nm)',
                'RAM' => '12 GB',
                'Almacenamiento' => '512GB',
                'Cámara Principal' => '50 MP (f/1.4 OIS) + 10 MP Telefoto 3x OIS + 13 MP UW',
                'Batería' => '4,500 mAh (Carga 125W por cable + 50W Inalámbrica)',
                'Resistencia' => 'IP68',
            ],
            'Motorola Edge 50 Ultra' => [
                'Pantalla' => '6.7" pOLED 144Hz LTPS Super HD 2500 nits Pantone Validated',
                'Procesador' => 'Snapdragon 8s Gen 3',
                'Material' => 'Madera Real / Cuero Vegano con Chasis de Aluminio',
                'RAM' => '16 GB LPDDR5X',
                'Almacenamiento' => '1 TB UFS 4.0',
                'Cámara Principal' => '50 MP OIS + 50 MP UW + 64 MP Telefoto Periscopio 3x OIS',
                'Batería' => '4,500 mAh (Carga TurboPower 125W + 50W Inalámbrica)',
                'Resistencia' => 'IP68',
            ],

            // --- HONOR ---
            'Honor X7b' => [
                'Pantalla' => '6.8" FHD+ 90Hz Hyper-Transmissive 850 nits',
                'Procesador' => 'Snapdragon 680 (6nm)',
                'RAM' => '6 GB / 8 GB (+8GB Turbo RAM)',
                'Almacenamiento' => '128GB / 256GB',
                'Batería Búho' => '6,000 mAh (Batería de larga duración de 3 días)',
                'Cámara Principal' => '108 MP (f/1.75) Ultra-Clear',
            ],
            'Honor X8b' => [
                'Pantalla' => '6.7" AMOLED FHD+ 90Hz 2000 nits Rincón Mágico (Magic Capsule)',
                'Procesador' => 'Snapdragon 680',
                'RAM' => '8 GB (+8GB Turbo RAM)',
                'Almacenamiento' => '256GB / 512GB',
                'Cámara Principal' => '108 MP Ultra-Clear + Flash Frontal para Selfies de 50MP',
                'Diseño' => 'Ultra Delgado 6.78mm con Acabado en Cuero Vegano',
            ],
            'Honor X9b 5G' => [
                'Pantalla' => '6.78" AMOLED Curva 120Hz Ultra-Bounce Anti-Drop',
                'Procesador' => 'Snapdragon 6 Gen 1 (4nm)',
                'RAM' => '12 GB (+8GB Turbo RAM)',
                'Almacenamiento' => '256GB',
                'Cámara Principal' => '108 MP (f/1.75) + 5 MP UW + 2 MP Macro',
                'Batería' => '5,800 mAh (Autonomía de 3 Días)',
            ],
            'Honor Magic6 Lite 5G' => [
                'Pantalla' => '6.78" AMOLED Curva 120Hz 1.5K Antishock 1200 nits',
                'Procesador' => 'Snapdragon 6 Gen 1 (4nm)',
                'RAM' => '8 GB / 12 GB',
                'Almacenamiento' => '256GB',
                'Cámara Principal' => '108 MP OIS + 5 MP UW + 2 MP Macro',
                'Batería' => '5,300 mAh (Carga 35W)',
            ],
            'Honor Magic6 Pro 5G' => [
                'Pantalla' => '6.8" LTPO OLED 120Hz 5000 nits PWM 4320Hz',
                'Procesador' => 'Snapdragon 8 Gen 3 (4nm)',
                'RAM' => '12 GB / 16 GB',
                'Almacenamiento' => '512GB / 1TB',
                'Cámara Principal' => '50 MP Apertura Variable (f/1.4-f/2.0 OIS) + 180 MP Telefoto Periscopio 2.5x + 50 MP UW',
                'Batería' => '5,600 mAh Silicio-Carbono 2da Gen (Carga 80W + 66W Inalámbrica)',
                'Resistencia' => 'IP68 / Cristal NanoCrystal Shield',
            ],
            'Honor Pad X9 11.5"' => [
                'Pantalla' => '11.5" 2K (2000x1200) TFT LCD 120Hz',
                'Procesador' => 'Snapdragon 685 (6nm)',
                'RAM' => '4 GB (+3GB Turbo)',
                'Almacenamiento' => '128GB',
                'Audio' => '6 Altavoces con Tecnología HONOR Histen',
                'Batería' => '7,250 mAh',
            ],

            // --- INFINIX & TECNO ---
            'Infinix Note 30 Pro' => [
                'Pantalla' => '6.67" AMOLED 120Hz 900 nits',
                'Procesador' => 'MediaTek Helio G99 (6nm)',
                'RAM' => '8 GB (+8GB Virtual)',
                'Almacenamiento' => '256GB',
                'Carga Rápida' => '68W All-Round FastCharge + 15W Inalámbrica',
                'Cámara Principal' => '108 MP + 2 MP Macro + 2 MP Profundidad',
                'Audio' => 'Sonido por JBL con altavoces dobles',
            ],
            'Infinix Note 40 Pro 5G' => [
                'Pantalla' => '6.78" 3D Curved AMOLED 120Hz Gorilla Glass 1300 nits',
                'Procesador' => 'MediaTek Dimensity 7020 5G (6nm)',
                'RAM' => '8 GB / 12 GB',
                'Almacenamiento' => '256GB',
                'Carga MagCharge' => '70W FastCharge + 20W Inalámbrica MagCharge',
                'Cámara Principal' => '108 MP OIS Super-Zoom 3x',
                'Luz Halo' => 'Active Halo AI Lighting',
            ],
            'Infinix Hot 40 Pro' => [
                'Pantalla' => '6.78" FHD+ 120Hz Magic Ring',
                'Procesador' => 'MediaTek Helio G99 Ultra Speed Processor',
                'RAM' => '8 GB (+8GB Expandible)',
                'Almacenamiento' => '128GB / 256GB',
                'Cámara Principal' => '108 MP HM6 Sensor + 2 MP Macro',
                'Batería' => '5,000 mAh (Carga 33W FastCharge)',
            ],
            'Tecno Camon 20 Pro' => [
                'Pantalla' => '6.67" AMOLED 120Hz Always-On Display',
                'Procesador' => 'MediaTek Helio G99',
                'RAM' => '8 GB (+8GB Expandible)',
                'Almacenamiento' => '256GB',
                'Cámara Principal' => '64 MP RGBW OIS Night portrait',
                'Cámara Frontal' => '32 MP con Doble Flash',
                'Batería' => '5,000 mAh (Carga 33W)',
            ],
            'Tecno Camon 30 Pro 5G' => [
                'Pantalla' => '6.78" AMOLED 144Hz FHD+',
                'Procesador' => 'MediaTek Dimensity 8200 Ultimate 5G (4nm)',
                'RAM' => '12 GB',
                'Almacenamiento' => '256GB / 512GB',
                'Cámara Principal' => '50 MP Sony IMX890 OIS + 50 MP UW + 50 MP Frontal con Autofoco',
                'Batería' => '5,000 mAh (Carga Ultra 70W - 100% en 45 min)',
            ],
            'Tecno Spark 20 Pro+' => [
                'Pantalla' => '6.78" AMOLED Curva 120Hz 1000 nits Gorilla Glass 5',
                'Procesador' => 'MediaTek Helio G99 Ultimate (6nm)',
                'RAM' => '8 GB (+8GB RAM Virtual)',
                'Almacenamiento' => '256GB',
                'Cámara Principal' => '108 MP Ultra-Sensing + 32MP Frontal Dual Flash',
                'Diseño' => 'Ergonómico Curvo 7.55mm de Piel Vegana',
                'Batería' => '5,000 mAh (Carga 33W)',
            ],
        ];

        foreach ($modeloOverrides as $nombreModelo => $overrides) {
            Modelo::where('nombre_comercial', $nombreModelo)->update([
                'specs_overrides' => $overrides,
            ]);
        }
    }
}

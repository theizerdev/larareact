<?php

return [
    /*
    |--------------------------------------------------------------------------
    | BioTime PRO (ZKTeco BioTime 8.0) — integración de solo lectura
    |--------------------------------------------------------------------------
    |
    | La URL, usuario y contraseña de cada instancia se guardan por empresa
    | (columnas biotime_* en la tabla empresas). Aquí sólo viven los
    | parámetros de comportamiento del cliente HTTP y del sincronizador.
    |
    | El cliente NUNCA escribe en BioTime: sólo hace GET a la API REST y el
    | POST de login (/jwt-api-token-auth/).
    */

    // Segundos de espera por request contra la API de BioTime.
    'timeout' => (int) env('BIOTIME_TIMEOUT', 20),

    // Tamaño de página al recorrer los endpoints paginados de BioTime.
    'page_size' => (int) env('BIOTIME_PAGE_SIZE', 100),

    // Válvula de seguridad: nº máximo de páginas que getPaginated() recorrerá
    // en una sola llamada antes de cortar (evita bucles infinitos si la API
    // devolviera un 'next' mal formado).
    'max_pages' => (int) env('BIOTIME_MAX_PAGES', 2000),

    // Al hacer la sincronización incremental de marcajes se re-consulta esta
    // ventana hacia atrás además de lo nuevo, para no perder punches que
    // BioTime hubiera subido tarde desde un reloj sin conexión.
    'sync_overlap_minutes' => (int) env('BIOTIME_SYNC_OVERLAP_MINUTES', 5),

    // Nº de fotos de empleado que se descargan por corrida de sync de fotos.
    'photo_batch' => (int) env('BIOTIME_PHOTO_BATCH', 25),

    // Fecha desde la que se traen marcajes en una sincronización completa
    // (`--full`). El endpoint de marcajes SIEMPRE se consulta con ventana
    // start_time/end_time acotada; nunca sin filtro. Los datos reales de esta
    // instalación empiezan el 2025-05-28, así que 2025-01-01 es margen seguro
    // (las ventanas vacías previas cuestan una petición trivial cada una).
    'backfill_from' => env('BIOTIME_BACKFILL_FROM', '2025-01-01'),

    // Tamaño máximo (días) de cada ventana al recorrer marcajes. Acota el
    // tamaño de cada respuesta de BioTime aunque el rango total sea grande.
    'window_days' => (int) env('BIOTIME_WINDOW_DAYS', 30),

    // Filas por transacción de BD al volcar a las tablas espejo (SQLite en
    // producción: lotes cortos = locks cortos).
    'db_chunk' => (int) env('BIOTIME_DB_CHUNK', 200),

    // Verificación TLS. El servidor conocido es HTTP plano, así que por
    // defecto va desactivada; se puede forzar por env si algún día es HTTPS.
    'verify_ssl' => (bool) env('BIOTIME_VERIFY_SSL', false),
];

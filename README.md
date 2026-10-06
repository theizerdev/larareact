# Hoshō — Plataforma de Control de Acceso, Identidad y Asistencia

Aplicación web multiempresa para **controlar quién entra, quién es y cuánto trabajó**: garita de visitas y proveedores, pre-registro por liga, validación de identidad (KYC) con firma electrónica, integración con lectores biométricos y cálculo de asistencia conforme a la Ley Federal del Trabajo (México).

Construida con **Laravel 13 + Inertia 3 + React 19 + TypeScript + shadcn/ui + TailwindCSS 4**. Es una SPA sin API REST separada: Laravel renderiza páginas React vía Inertia.

> Todos los nombres, folios, CURP, teléfonos, tokens y URLs que aparecen en este documento son **datos de demostración**. No hay información real en este README.

---

## Índice

1. [Qué hace](#qué-hace)
2. [Qué entrega](#qué-entrega)
3. [Módulos](#módulos)
4. [Flujos principales](#flujos-principales)
5. [Integraciones externas](#integraciones-externas)
6. [Arquitectura](#arquitectura)
7. [Stack tecnológico](#stack-tecnológico)
8. [Instalación y desarrollo](#instalación-y-desarrollo)
9. [Configuración (.env)](#configuración-env)
10. [Despliegue con Docker](#despliegue-con-docker)
11. [Roles y permisos](#roles-y-permisos)
12. [Rutas públicas](#rutas-públicas)
13. [Pruebas y calidad](#pruebas-y-calidad)
14. [Estructura del repositorio](#estructura-del-repositorio)
15. [Notas operativas](#notas-operativas)

---

## Qué hace

| Necesidad | Cómo la resuelve |
|---|---|
| Registrar personas que entran a una planta o sitio | Garita con lector QR, pases digitales, invitaciones y autorización por WhatsApp |
| Dar de alta colaboradores, proveedores, socios/productores y visitas sin capturar todo a mano | **Pre-registro** por liga con token: la propia persona llena un asistente (wizard) desde su celular |
| Saber que la persona es quien dice ser | **KYC**: validación de INE (OCR, listas de riesgo, comparación facial) y antifraude |
| Dejar evidencia legal | **Firma electrónica** de documentos a partir de plantillas |
| Credencializar | **Carnets** en PNG con QR y código de acceso, enviables por WhatsApp |
| Controlar asistencia y nómina | Reloj checador (kiosko PWA), importación de marcajes de dispositivos biométricos y **cálculo LFT** con semáforos |
| Auditar y operar | Dashboard, bitácora de actividad, notificaciones en la app y monitoreo de servidor, BD, colas y sesiones |

## Qué entrega

- **Panel administrativo** responsive con sidebar colapsable, tema claro/oscuro, idiomas **ES / EN / AR** y visibilidad de menú configurable por empresa.
- **Landing pública** (hero, plataforma, cumplimiento, clientes, aliados, demo de acceso y formulario de contacto que envía correo y guarda la solicitud).
- **Asistentes de pre-registro públicos** (proveedor, productor/socio, empleado, visita) con enlace por token.
- **Liga pública de seguimiento** de un folio de validación (estatus de identidad y firma en tiempo real).
- **Pase digital** de visita y **carnets** públicos con QR.
- **Kiosko de reloj checador** instalable como PWA.
- **Reportes de asistencia**: bitácora de marcajes (exportable), panel de control y cálculo de nómina.
- **Notificaciones** internas (campana) y por WhatsApp.
- **Respaldo/rollback** documentado para producción (fuera de este repo; ver [Notas operativas](#notas-operativas)).

---

## Módulos

### Organización (catálogos)
Empresas, sucursales, departamentos, cargos, responsables, países y tipos de servicio. Cada empresa guarda su zona horaria, logo y sus credenciales de integraciones.

### Personas y entidades
- **Colaboradores (empleados)**: alta manual, **importación masiva desde Excel** con vista previa y confirmación por contraseña, foto(s), vehículos, tarjetas de acceso, validación de **CURP** (consulta + validación local de respaldo), carnet y envío por WhatsApp.
- **Proveedores** y **Productores / socios**: cada uno con su plantilla de empleados y vehículos (incluye datos de tránsito y remolque), RFC/CURP y carnet.
- **Visitas temporales**: con tipo de servicio, nombre comercial y pre-registro.

### Garita y accesos
- **Control de garita** con lector QR: busca empleados, proveedores y productores por código de acceso.
- **Visitas / accesos**: ingreso, acompañantes, marcar salida, visitante particular o ligado a un proveedor/productor.
- **Invitaciones**: se emiten con QR, se canjean en garita o se cancelan; con foto de carnet.
- **Autorización por WhatsApp**: el anfitrión recibe una liga y aprueba o rechaza; la garita ve el resultado en vivo.
- **Pase digital** público por UUID donde la visita completa sus datos de acceso.
- **Códigos de acceso** autogenerados con consecutivo por rol y sucursal (con reintento ante colisión).

### Validaciones (identidad y firma)
- **Folio de operación**: agrupa bajo un identificador (`COL-…`, `PRV-…`, `SOC-…`, `VIS-…`) el alta de una entidad, su KYC y sus documentos a firma. Estatus: `en_curso`, `completo`, `con_observaciones`, `rechazado`.
- **Tablero de validaciones** con reproceso, **documentos** (consultar, cancelar y descargar PDF firmado) y detalle por operación.
- **Reglas por empresa y entidad** (colaboradores, visitas, proveedores, socios): KYC activo, antifraude, firma activa/obligatoria y plantilla.
- Procesamiento en segundo plano (job) con presupuesto de tiempo configurable.

### Control de acceso (hardware)
Consulta en solo lectura al middleware de control de acceso: empleados, vehículos, tarjetas, **eventos peatonales** y **eventos vehiculares** (placas) con sus fotografías servidas por proxy autenticado.

### Asistencia y nómina (LFT)
- **Reloj checador** (kiosko PWA) con búsqueda por código y registro de marcajes; también API para app móvil (configuración, búsqueda, "mi empleado", registrar, historial).
- **Configuración**: turnos laborales, días festivos (precarga de feriados LFT), reglas de descanso, "ley silla", opciones de descanso, reforma laboral y **semáforos** de horas (normal / tiempo extra doble / triple).
- **Cálculo** diario y semanal, horas extra y alertas por semáforo o descanso excedido.
- **Reportes**: bitácora de marcajes con exportación, panel de control y cálculo de nómina.
- **Notificaciones por WhatsApp** al colaborador (recordatorios de descanso, alertas).

### BioTime (ZKTeco)
Sincronización de **dispositivos, departamentos, áreas, cargos, empleados y marcajes** desde un servidor BioTime; vinculación manual o automática con colaboradores y foto del empleado. Sincronización por comando (`BioTimeSync`) o botón "sincronizar ahora".

### Integraciones (panel)
Pantalla única para configurar y **probar conexión** de: WhatsApp, Mapbox, Google Maps, Control de acceso, BioTime, JAAK, DIDIT y ZapSign. Incluye planificador de rutas y navegador 3D (Mapbox) como herramientas auxiliares.

### Administración y seguridad
Usuarios, roles y permisos (por sector), **bitácora de actividad** en español, visibilidad de menú por empresa, perfil, apariencia y seguridad.

### Monitoreo
Servidor (CPU, RAM, disco, red), base de datos, logs de Laravel, actividad, colas, tareas programadas y sesiones activas.

---

## Flujos principales

### 1. Pre-registro con validación de identidad
```
Admin genera liga ──► Persona abre /preregistro-…/{token} (wizard)
        │                          │
        ▼                          ▼
  Folio COL-000123  ◄── datos + fotos + INE
        │
        ├─► KYC (JAAK): OCR, listas, comparación facial
        ├─► Antifraude (DIDIT)            [según reglas de la empresa]
        └─► Firma (ZapSign) por plantilla [según reglas de la empresa]
        │
        ▼
Liga pública /validacion/{token}  ◄── webhooks de DIDIT y ZapSign
        │
        ▼
Estatus del folio: completo / con_observaciones / rechazado
        │
        ▼
Notificación en la app + carnet con QR (opcional por WhatsApp)
```

### 2. Visita en garita
```
Anfitrión crea invitación ─► QR / pase digital
        │
Garita escanea ─► (si aplica) solicitud de autorización por WhatsApp
        │
Anfitrión aprueba ─► Registro de acceso (acompañantes, vehículo)
        │
Garita marca salida ─► Dashboard (accesos hoy / dentro ahora)
```

### 3. Asistencia
```
Marcaje (kiosko PWA / app / BioTime)
        ▼
Cálculo LFT diario ─► Resumen semanal ─► Semáforo
        ▼
Bitácora · Panel de control · Cálculo de nómina · Alertas WhatsApp
```

---

## Integraciones externas

| Servicio | Para qué se usa | Dónde se configura |
|---|---|---|
| **JAAK** | KYC: OCR de INE, listas de riesgo, face match | Integraciones › Validaciones |
| **DIDIT** | Verificación de identidad y antifraude (pasaporte/extranjeros), webhooks firmados | Integraciones › Validaciones |
| **ZapSign** | Firma electrónica desde plantillas, webhooks por documento | Integraciones › Validaciones |
| **WhatsApp API** | Carnets, autorizaciones de visita, alertas de asistencia | Integraciones › WhatsApp |
| **BioTime (ZKTeco)** | Marcajes y empleados de relojes biométricos | Integraciones › Reloj checador |
| **Middleware de control de acceso** | Eventos peatonales/vehiculares y tarjetas | Integraciones › Control de acceso |
| **Mapbox / Google Maps** | Mapas, rutas, geocodificación | Integraciones › Mapas |
| **Servicio de CURP** | Validación de CURP con respaldo local | Configuración del servidor |

Las credenciales viven **por empresa** (tabla `empresas`) y los secretos se almacenan cifrados; cada servicio expone un botón de **probar conexión**.

---

## Arquitectura

- **Multiempresa / multisucursal**: el trait `Multitenantable` agrega un *global scope* por `empresa_id` / `sucursal_id` y los rellena al crear. Las rutas sensibles exigen sesión para que el scope aplique.
- **Inertia**: controladores devuelven `Inertia::render()`; páginas en `resources/js/pages`. Rutas tipadas con **Wayfinder**.
- **Rutas por módulo**: `routes/admin.php` carga automáticamente todos los archivos de `routes/modules/*.php`.
- **Servicios de dominio** en `app/Services`: un cliente HTTP por integración (`JaakService`, `DiditService`, `ZapSignService`, `BioTimeService`, `ControlAccesoService`, `WhatsAppService`), más `CalculoAsistenciaLftService`, `AccessCodeService`, `CarnetGeneratorService`, `IdentityDataService` y `NotificationDispatcher`.
- **Autenticación**: Laravel Fortify (login, registro, 2FA, verificación de correo), **passkeys (WebAuthn)** y recuperación de contraseña por **OTP** con *throttling*.
- **Autorización**: Spatie Permission (roles y permisos con `slug` y `sector`).
- **Auditoría**: Spatie Activitylog con descripciones en español.
- **Colas y caché**: driver `database` por defecto.
- **PWA**: kiosko de reloj checador instalable (`vite-plugin-pwa`, service worker de assets estáticos).
- **i18n**: `es`, `en`, `ar` con persistencia en sesión.

---

## Stack tecnológico

**Backend**: PHP 8.3+, Laravel 13, Inertia 3, Fortify, Wayfinder, Spatie Permission 8, Spatie Activitylog 4, SQLite (por defecto) o MySQL 8.
**Frontend**: React 19 (+ React Compiler), TypeScript 5.7, Vite 8, TailwindCSS 4, shadcn/ui (Radix), Lucide, Sonner, SweetAlert2, ApexCharts, Leaflet / react-leaflet, Mapbox GL, react-day-picker, jsQR.
**Calidad**: PHPUnit 12, Larastan (PHPStan), Laravel Pint, ESLint 9, Prettier.

---

## Instalación y desarrollo

Requisitos: PHP 8.3+, Composer 2, Node 20+, extensiones PHP `gd`, `intl`, `zip`, `bcmath`, `exif`, `pdo_mysql` (o `pdo_sqlite`).

```bash
git clone <url-del-repositorio> hosho
cd hosho/larareact

composer run setup        # instala deps, crea .env, key:generate, migra y compila
# o manualmente:
composer install
cp .env.example .env && php artisan key:generate
php artisan migrate
php artisan db:seed       # catálogos y permisos; ver nota abajo
npm install && npm run dev
```

Servidor de desarrollo completo (servidor + cola + logs + Vite):

```bash
composer run dev
```

> **Seeders**: `PermissionSeeder`, `RoleSeeder`, `PaisSeeder`, `TipoServicioSeeder`, `UsersSeeder` y `EmpresaSucursalSeeder` crean la base. Los seeders con sufijo de cliente cargan datos de un caso concreto; **no los ejecutes en producción** salvo que sepas lo que hacen.

### Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | Vite en desarrollo |
| `npm run build` / `build:ssr` | Compilación de producción (con o sin SSR) |
| `npm run lint` / `lint:check` | ESLint (con o sin corrección) |
| `npm run format` / `format:check` | Prettier |
| `npm run types:check` | TypeScript sin emitir |
| `composer run lint` | Laravel Pint |
| `composer run test` | PHPUnit + linters |

---

## Configuración (.env)

Variables mínimas (valores de ejemplo):

```dotenv
APP_NAME="Hoshō"
APP_URL=https://demo.example.com
APP_LOCALE=es
DB_CONNECTION=sqlite            # o mysql
QUEUE_CONNECTION=database
SESSION_DRIVER=database
MAIL_MAILER=smtp
MAIL_FROM_ADDRESS="no-reply@example.com"
```

Variables opcionales de integraciones (todas con valor por defecto en `config/*.php`):

```dotenv
# JAAK (KYC)
JAAK_KYC_ENABLED=true
JAAK_FACE_MATCH_THRESHOLD=60
JAAK_DEFAULT_COUNTRY=MEX

# DIDIT
DIDIT_ENABLED=true
DIDIT_DEFAULT_WORKFLOW_ID=00000000-0000-0000-0000-000000000000

# ZapSign
ZAPSIGN_ENABLED=true
ZAPSIGN_RATE_LIMIT=500

# BioTime
BIOTIME_PAGE_SIZE=100
BIOTIME_SYNC_OVERLAP_MINUTES=5
BIOTIME_BACKFILL_FROM=2025-01-01
BIOTIME_VERIFY_SSL=false

# WhatsApp (el token por empresa se captura desde el panel)
WHATSAPP_API_URL=https://whatsapp.example.com
WHATSAPP_TIMEOUT=30
```

Las credenciales por empresa (tokens de JAAK, DIDIT, ZapSign, BioTime, WhatsApp, Mapbox, middleware de acceso y secretos de webhook) **no van en `.env`**: se capturan desde *Integraciones* y se guardan cifradas en base de datos.

---

## Despliegue con Docker

El `Dockerfile` es multi-etapa:

1. **build**: PHP 8.3 + Node 20; `composer install --no-dev`, `npm ci` y `vite build` (el plugin de Wayfinder necesita PHP para leer el router).
2. **runtime**: PHP 8.3 + Apache, sin Node ni Composer; solo el código compilado.

`docker-compose.yml` levanta el servicio `app` en el puerto interno 80 (publicado, por ejemplo, en `8098`), con:

- `env_file` con las variables de producción (no versionado),
- volumen persistente para `storage/`,
- `entrypoint.sh` y vhost de Apache montados desde `docker/`,
- *healthcheck* contra `/up`.

El *entrypoint* ejecuta las **migraciones automáticamente** al arrancar. Detrás del contenedor se recomienda un proxy inverso con TLS.

```bash
docker compose build
docker compose up -d
docker compose logs -f app
```

> No hay *scheduler* ni *queue worker* definidos en el contenedor. Si activas tareas programadas o colas asíncronas, agrega un servicio dedicado (`php artisan schedule:work` / `queue:work`).

---

## Roles y permisos

Los permisos siguen el patrón `modulo.accion` y se agrupan por sector. Familias principales:

`dashboard`, `empresas`, `sucursales`, `departamentos`, `cargos`, `responsables`, `paises`, `empleados` (incluye `import`, `send-carnet-whatsapp`), `proveedores`, `productores`, `visitas_temporales`, `control_acceso`, `asistencia`, `biotime`, `integrations`, `whatsapp`, `jaak`, `zapsign`, `validaciones`, `users`, `roles`, `monitoreo`.

Ejemplo de usuarios demo (solo para entornos de prueba):

| Usuario | Rol | Contraseña |
|---|---|---|
| `admin@example.com` | Administrador | *definida en el seeder local* |
| `garita@example.com` | Garita | *definida en el seeder local* |

> Cambia de inmediato cualquier credencial sembrada antes de exponer el sistema.

---

## Rutas públicas

| Ruta | Propósito |
|---|---|
| `/` | Landing |
| `POST /contacto` | Solicitud de demo (limitada a 5/min) |
| `/preregistro/{token}` · `/preregistro-productor/{token}` · `/preregistro-empleado/{token}` · `/preregistro-visita/{token}` | Asistentes de pre-registro |
| `/validacion/{token}` · `/validacion/{token}/estado` | Seguimiento del folio |
| `POST /webhooks/didit` · `POST /webhooks/zapsign` | Webhooks (firma verificada, limitados) |
| `/autorizar-acceso/{token}` | Anfitrión autoriza una visita |
| `/pase-digital/{uuid}` | Pase digital de visita |
| `/carnet-empleado/{id}` · `/carnet-proveedor/{id}` · `/carnet-productor/{id}` | Carnets públicos |
| `/forgot-password` | Recuperación por OTP |

Las vistas de garita y kiosko (`/garita`, `/admin/reloj-checador/kiosko`) **requieren sesión**.

---

## Pruebas y calidad

```bash
composer run test          # PHPUnit + linters
php artisan test --filter=BioTime
npm run types:check
```

Cobertura actual: autenticación y ajustes, dashboard, importación de empleados, BioTime (servicio, sincronización, administración) y aislamiento multiempresa (`MultitenantableTest`).

---

## Estructura del repositorio

```
larareact/
├── app/
│   ├── Http/Controllers/
│   │   ├── Admin/              # Un controlador por módulo del panel
│   │   ├── Api/                # API del kiosko / app de asistencia
│   │   ├── Auth/               # Recuperación de contraseña por OTP
│   │   ├── Settings/           # Perfil, seguridad, apariencia
│   │   └── *PreRegistro*, ValidacionSeguimiento, WebhookValidacion, …
│   ├── Models/                 # Empleado, Proveedor, Productor, VisitaAcceso,
│   │                           # OperacionValidacion, KycValidacion, FirmaDocumento,
│   │                           # Biotime*, Asistencia*, Empresa, Sucursal, …
│   ├── Services/               # Clientes de integraciones y reglas de negocio
│   │   └── Validaciones/       # Sincronizador DIDIT, servicio de firma
│   ├── Jobs/                   # ProcesarKycValidacion
│   ├── Notifications/          # Visitas, KYC, firma, semáforos de jornada
│   ├── Traits/                 # Multitenantable, HasKycValidaciones, …
│   └── Console/Commands/       # BioTimeSync, utilidades de WhatsApp y soporte
├── config/                     # jaak, didit, zapsign, biotime, whatsapp, …
├── database/
│   ├── migrations/
│   └── seeders/
├── resources/js/
│   ├── pages/                  # Public, admin, auth, preregistro-*, validacion, settings
│   ├── components/             # UI base (shadcn), tablas, filtros, paginación, mapas
│   ├── layouts/ · hooks/ · lib/ · wayfinder/
├── routes/
│   ├── web.php                 # Públicas y webhooks
│   ├── admin.php               # Carga routes/modules/*.php
│   └── modules/                # Un archivo por módulo
├── lang/                       # es, en, ar
├── public/                     # Assets, íconos y manifest PWA del kiosko
└── tests/
```

---

## Notas operativas

- **Backups**: se recomienda snapshot diario de la BD (en caliente), volumen `storage/`, código e imagen Docker, con rotación y restauración verificada.
- **Privacidad**: el sistema maneja datos personales sensibles (CURP, INE, biometría, placas). Mantén las credenciales fuera del repositorio, usa HTTPS y restringe el acceso por rol.
- **Zona horaria**: se define por empresa y sucursal.
- **Webhooks**: DIDIT y ZapSign se validan por firma/secreto por empresa; configura la URL pública correspondiente en cada proveedor.
- **Registro de jornada**: la reforma a la LFT introduce obligaciones de registro de asistencia; el módulo de asistencia está pensado para sostener esa evidencia.

## Licencia

MIT.

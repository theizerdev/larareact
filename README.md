# LaraReact - Admin Panel Full Stack

![LaraReact Logo](public/image/logo/larareact_full_logo.jpg)

Sistema de administración full-stack construido con **Laravel 13 + React 19 + shadcn/ui**, moderno, escalable y listo para producción.

## Tecnologías Principales

### Backend
- **PHP 8.3+** - Versión mínima requerida
- **Laravel 13.17** - Framework PHP de última generación
- **InertiaJS 3.0** - Bridge entre Laravel y React sin APIs REST separadas
- **Laravel Fortify** - Autenticación de usuarios
- **Spatie Activitylog** - Registro de actividades en el sistema
- **MySQL/SQLite** - Bases de datos soportadas

### Frontend
- **React 19.2** - Última versión de React con compilador oficial
- **TypeScript 5.7** - Tipado estático para código robusto
- **shadcn/ui** - Componentes de UI accesibles y personalizables
- **TailwindCSS 4.0** - Framework de estilos utility-first
- **react-leaflet 5.0** - Integración de mapas interactivos Leaflet
- **Lucide React** - Iconos modernos y ligeros
- **Sonner** - Sistema de notificaciones toast
- **Vite 8.0** - Build tool ultrarrápido para desarrollo

## Instalación como Paquete (Uso Principal)

LaraReact está diseñado para ser instalado como dependencia en tus proyectos Laravel existentes o nuevos:

```bash
# En tu proyecto Laravel (nuevo o existente)
composer require theizerdev/larareact
```

Después de instalar el paquete, ejecuta el comando de instalación para publicar todos los assets:

```bash
php artisan larareact:install
```

Este comando publica automáticamente:
- Archivos de configuración
- Componentes React (shadcn/ui + componentes personalizados)
- Assets CSS y JavaScript
- Archivos de idioma para multilenguaje
- Migraciones del módulo de países

### Instalación Completa desde el Repositorio (Desarrollo)

Si quieres contribuir o modificar LaraReact, clona el repositorio completo:

```bash
# Clonar y configurar
git clone https://github.com/theizerdev/larareact.git
cd larareact
composer install
npm install
cp .env.example .env
php artisan key:generate
php artisan migrate --force
npm run dev

## Módulos del Sistema

### 🔐 Autenticación y Seguridad
- Login/Registro de usuarios
- Recuperación de contraseña
- Autenticación de dos factores (2FA)
- Passkeys webauthn
- Roles y permisos básicos
- Sesiones seguras

### 🎨 Panel de Administración
- Layout responsive con sidebar colapsable
- Tema claro/oscuro (modo oscuro por defecto)
- Cambiador de idioma (Español/Inglés)
- Barra de navegación superior con menú de usuario
- Dashboard con estadísticas básicas
- Páginas de configuración de perfil, seguridad y apariencia

### 🌍 Módulo de Gestión de Países (CRUD Completo)
- Listado paginado de países con datos ISO
- Creación y edición de países con formulario validado
- Vista en mapa interactivo con Leaflet
- Selección de coordenadas mediante clic en el mapa
- Estados activo/inactivo para cada país
- Filtros avanzados:
  - Buscador por nombre, código ISO2/ISO3
  - Filtro por estado (activo/inactivo)
  - Selector de registros por página (10/25/50/100)
- Búsqueda con debounce de 300ms para optimizar consultas
- Eliminación masiva de registros seleccionados
- Exportación de datos

### 🗺️ Módulo de Mapas y Navegación 3D (Mapbox + Google Places)
- **Búsqueda e Indicaciones en Venezuela**: Planificador de rutas inteligente con cobertura completa de direcciones, estaciones de metro y puntos de interés (POIs) en Venezuela.
- **Buscador Dual Inteligente**: Integra sugerencias predictivas combinando Google Places Autocomplete, Mapbox Searchbox y OpenStreetMap (Nominatim).
- **Asignación de Pines Interactiva**: Permite hacer clic directamente sobre el mapa para fijar dinámicamente las coordenadas de partida y destino.
- **Navegador 3D Real-Time**: Interfaz cockpit inmersiva a pantalla completa con cámara inclinada a 60° y rotación automática de brújula según el sentido de viaje.
- **Asistente de Voz Inteligente**: Lee en voz alta las indicaciones giro a giro mediante la API de SpeechSynthesis, adaptándose automáticamente al idioma del navegador (Español/Inglés).
- **Simulador de Conducción**: Modos dinámicos para simular la navegación paso a paso a lo largo de la ruta en tiempo real, ideal para pruebas de desarrollo locales.
- **Alertas de Conectividad**: Notificaciones emergentes discretas (Toasts) sobre disponibilidad de señal GPS y fallbacks automáticos.

### 💬 Módulo de Integración de WhatsApp API
- Panel de control de enlace para mensajería automatizada de la empresa.
- Gestión de tokens de autenticación API y credenciales de servidor.
- Sincronización del estado de conexión de WhatsApp y simulación de envío de mensajes de prueba.

### 🖥️ Módulo de Monitoreo del Sistema y Servidor
- **Dashboard de Servidor**: Gráficos interactivos de consumo de CPU, Memoria RAM, Almacenamiento y Red en tiempo real.
- **Auditoría de Logs**: Visor integrado de logs de Laravel y base de datos con filtros de severidad y búsquedas.
- **Monitoreo de Procesos y Colas**: Panel de control para verificar el estado de las colas de trabajo (Queues), tareas programadas e historial de sesiones de usuario activas.

### 🗺️ Características Técnicas Destacadas
- **SSR Seguro**: Mapas Leaflet cargados solo en cliente para evitar errores de window undefined
- **Lazy Loading**: Componentes pesados cargados bajo demanda
- **Paginación Reutilizable**: Componente genérico compatible con la paginación de Laravel
- **Multilenguaje Nativo**: Sistema de cambio de idioma con persistencia en sesión
- **Actividad Log**: Registro de todas las acciones realizadas en el sistema
- **Arquitectura Modular**: Componentes reutilizables y fácilmente extensibles
- **Código Tipado**: TypeScript en todo el frontend para mayor robustez

## Componentes Disponibles
- **UI Base**: Alert, Avatar, Badge, Button, Card, Checkbox, Dialog, Input, Label, Select, Table, Tabs, etc.
- **Negocio**: Pagination (reutilizable), FilterBar, Breadcrumbs, StatCard, DataTable
- **Mapas**: MapComponent (Leaflet), PaisesMap para visualización geográfica
- **Utilidades**: ConfirmDialogs, LanguageTabs, AppearanceToggle, Sonner notifications

## Scripts Disponibles
```bash
# Desarrollo
npm run dev          # Iniciar servidor de desarrollo Vite
composer run dev     # Iniciar servidor Laravel + Vite concurrently

# Build
npm run build        # Compilar para producción
npm run build:ssr    # Compilar con soporte SSR

# Calidad de Código
npm run lint         # Ejecutar ESLint con fix
npm run lint:check   # Verificar errores de lint
npm run format       # Formatear código con Prettier
npm run format:check # Verificar formato
npm run types:check  # Verificar tipos TypeScript
composer run lint    # Ejecutar Laravel Pint (PHP)
composer run test    # Ejecutar tests PHPUnit + linters
```

## Estructura de Archivos Clave
```
├── app/
│   ├── Http/Controllers/Admin/
│   │   ├── PaisController.php         # Controlador de países
│   │   ├── IntegrationController.php  # Controlador de Mapbox, Navegación y WhatsApp
│   │   └── DbMonitoringController.php # Controladores de Monitoreo de BD y Servidor
│   └── Models/
│       ├── Pais.php                   # Modelo de país
│       ├── Empresa.php                # Modelo de empresa y tokens de WhatsApp/Mapbox
│       └── Sucursal.php               # Modelo de sucursal
├── resources/
│   ├── js/
│   │   ├── pages/admin/integrations/
│   │   │   ├── map.tsx                # Planificador de rutas de Venezuela
│   │   │   └── navigation.tsx         # Navegador 3D en tiempo real (Full Screen)
│   │   ├── ssr.tsx                    # Punto de entrada SSR para compilación en servidor
│   │   └── components/pagination.tsx  # Componente de paginación genérico
│   └── lang/
│       ├── es.json                    # Traducciones en español
│       └── en.json                    # Traducciones en inglés
```

## Requisitos del Sistema
- PHP 8.3+
- Laravel 13+
- Node.js 20+
- MySQL 8.0+ / PostgreSQL 13+
- Extensiones PHP: GD, cURL, JSON, MBstring, XML

## Licencia
MIT - El código es open-source y puedes usarlo libremente en proyectos personales y comerciales.

## Mantenimiento
Proyecto mantenido por theizerdev. Reporta issues en el repositorio de GitHub.
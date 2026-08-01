# 🚀 Fix Sale — Gestor Integral de Ventas y Servicios (POS & ERP Multi-Tenant)

**Fix Sale** es un ecosistema de software SaaS empresarial diseñado para la administración unificada de **Puntos de Venta (POS)**, **Gestión de Crédito Flexible**, **Control de Inventario**, **Servicios Técnicos** y **Monitoreo en Tiempo Real**, todo bajo una arquitectura multi-empresa y multi-sucursal avanzada.

---

## 🌟 Características Principales del Sistema

### 🛒 1. Punto de Venta (POS) & Operación de Caja
* **Venta en Mostrador:** Interfaz ultra-rápida con búsqueda inteligente de productos, código de barras y carrito dinámico.
* **Ventas en Espera (Held Sales):** Retención y recuperación instantánea de carritos de compra pendientes.
* **Control de Cajas Registradoras:** Apertura, arqueo, ingresos/egresos manuales y cierre con métricas de cuadre.
* **Múltiples Métodos de Pago:** Efectivo, transferencias, tarjetas de débito/crédito, pagos digitales y crédito interno.
* **Ventas a Crédito & Abonos:** Otorgamiento directo de créditos con límites parametrizables y amortización.

### 💳 2. Políticas de Crédito & Finanzas
* **Políticas Flexibles:** Configuración de cuotas, márgenes de recargo, días de gracia e intereses.
* **Gestión de Abonos (Credit Payment):** Historial detallado de amortizaciones, recibos y saldo pendiente.

### 📦 3. Gestión de Inventarios & Catálogos
* **Productos y Servicios:** Control de existencias, precios de costo/venta y unidades de medida.
* **Clasificación Multinivel:** Organización por Categorías, Familias, Marcas y Modelos.
* **Historial de Movimientos:** Trazabilidad completa de entradas, salidas y ajustes de inventario.

### 💼 4. Arquitectura Multi-Empresa & Sucursales (SaaS Multi-Tenant)
* **Aislamiento por Empresa (`empresa_id`):** Datos estrictamente segregados por empresa para seguridad y confidencialidad.
* **Gestión de Sucursales (`sucursal_id`):** Asignación de usuarios, inventarios y cajas por sede.
* **Planes de Suscripción:** Gestión de planes SaaS, límites y pasarela de pago para tenants.

### 🔐 5. Seguridad & Autenticación de Doble Factor
* **Verificación WhatsApp OTP:** Validación en dos pasos enviando código OTP vía WhatsApp con resguardo de sesión.
* **Control de Acceso (Spatie RBAC):** Roles y permisos avanzados por usuario y empresa.
* **Captura de Geolocalización en Login:** Registro exacto de coordenadas GPS y geocodificación inversa con OpenStreetMap Nominatim.

### 📊 6. Centro de Monitoreo & Telemetría del Sistema
* **Monitoreo de Sesiones:** Panel interactivo en tiempo real con geolocalización de IPs, tipo de dispositivo (Escritorio/Móvil) e historial de accesos.
* **Métricas de Base de Datos:** Tamaño exacto en KB/MB, recuento real de filas por tabla, consultas lentas y procesos activos.
* **Wizard Modal de Backup SQL:** Exportación guiada en 4 pasos del respaldo `.sql` aislado exclusivamente para los datos de la empresa autenticada.
* **Monitoreo de Servidor y Colas:** Telemetría de CPU, RAM, uso de disco y estado de tareas en segundo plano.

---

## 🛠️ Tecnologías Utilizadas

* **Backend:** PHP 8.3+, Laravel 13.x (Inertia.js Stack).
* **Frontend:** React 19, TypeScript, TailwindCSS v4, Radix UI.
* **Base de Datos:** MySQL 8+ / MariaDB.
* **Geolocalización:** Nominatim OpenStreetMap API + Geolocation Web API.
* **Generación de Reportes / Backup:** Streamed SQL Exporter con aislamiento multi-inquilino.

---

## 🚀 Instalación y Configuración Local

1. **Clonar el repositorio y entrar al proyecto:**
   ```bash
   git clone <repository-url>
   cd servitec
   ```

2. **Instalar dependencias de PHP y JavaScript:**
   ```bash
   composer install
   npm install
   ```

3. **Configurar el archivo de entorno `.env`:**
   ```bash
   cp .env.example .env
   php artisan key:generate
   ```

4. **Ejecutar migraciones y seeders de prueba:**
   ```bash
   php artisan migrate --seed
   ```

5. **Iniciar los servidores de desarrollo:**
   ```bash
   php artisan serve
   npm run dev
   ```

---

## 📄 Licencia
Este proyecto es un software privado propiedad de **Fix Sale**. Todos los derechos reservados.
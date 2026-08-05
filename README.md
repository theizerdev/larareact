# 🚀 Servitec — Gestor Integral de Ventas, POS y ERP Multi-Tenant

**Servitec** (anteriormente Fix Sale) es un ecosistema de software SaaS empresarial de alto rendimiento diseñado para la administración unificada de **Puntos de Venta (POS)**, **Gestión de Crédito Flexible**, **Control de Inventario y Kardex**, **Servicios Técnicos**, **Facturación de Compras** y **Monitoreo en Tiempo Real**, todo bajo una arquitectura multi-empresa y multi-sucursal avanzada.

---

## 🌟 Características Principales del Sistema

### 🛒 1. Punto de Venta (POS) & Operación de Caja
* **Venta en Mostrador:** Interfaz ultra-rápida con búsqueda inteligente de productos, código de barras y carrito dinámico.
* **Ventas en Espera (Held Sales):** Retención y recuperación instantánea de carritos de compra pendientes.
* **Control de Cajas Registradoras:** Apertura, arqueo, ingresos/egresos manuales y cierre con métricas de cuadre (`CashRegisterRequest` & `CashRegisterResource`).
* **Múltiples Métodos de Pago:** Efectivo, transferencias, pagos digitales, transacciones multimoneda (USD/Moneda local) y crédito interno.
* **Ventas a Crédito & Abonos:** Otorgamiento directo de créditos a clientes con límites parametrizables y amortización.

### 💳 2. Políticas de Crédito & Finanzas
* **Políticas Flexibles:** Configuración de cuotas, márgenes de recargo, días de gracia e intereses.
* **Gestión de Abonos (`CreditPayment`):** Historial detallado de amortizaciones, recibos y saldo pendiente.

### 📦 3. Gestión de Inventarios, Kardex & Compras
* **Kardex Automatizado (`InventoryService`):** Registro atómico de movimientos de inventario por entradas, salidas, ventas y ajustes.
* **Módulo de Compras (`PurchaseController`):** Emisión de órdenes de compra, control de facturas de proveedor y cuentas por pagar (`StoreCompraRequest` & `CompraResource`).
* **Productos y Servicios:** Control de existencias, costos de compra, precios de venta y unidades de medida.
* **Clasificación Multinivel:** Organización por Categorías, Familias, Marcas y Modelos.

### 💼 4. Arquitectura Multi-Empresa & Sucursales (SaaS Multi-Tenant)
* **Aislamiento por Empresa (`BelongsToEmpresa` & `Multitenantable`):** Trait y Global Scope (`empresa_scope`) que garantizan aislamiento transparente y estricto de datos por tenant (omitiendo automáticamente para Super Admin).
* **Gestión de Sucursales (`sucursal_id`):** Asignación de usuarios, inventarios y cajas por sede.
* **Planes de Suscripción:** Gestión de planes SaaS, límites y pasarelas de pago.

### 🔐 5. Seguridad & Autenticación
* **Control de Acceso Declarativo (`Policies` & `Gate`):** Políticas de autorización granulares (`UserPolicy`, `EmpresaPolicy`, `ProductoPolicy`, `CashRegisterPolicy`).
* **Verificación WhatsApp OTP:** Validación en dos pasos enviando código OTP vía WhatsApp con resguardo de sesión.
* **Control de Acceso (Spatie RBAC):** Roles y permisos avanzados por usuario y empresa.

### 📊 6. Centro de Monitoreo & Telemetría del Sistema
* **Monitoreo de Sesiones:** Panel interactivo en tiempo real con geolocalización de IPs y dispositivos.
* **Métricas de Base de Datos:** Tamaño exacto en KB/MB, recuento real de filas por tabla y procesos activos.
* **Wizard Modal de Backup SQL:** Exportación guiada en 4 pasos del respaldo `.sql` aislado exclusivamente para los datos de la empresa autenticada.

---

## 🏛️ Patrones de Arquitectura Implementados

El sistema sigue los más estrictos estándares de desarrollo software en **Laravel 13** y **React 19**:

1. **Thin Controllers & Form Requests**: Lógica de validación desacoplada en clases dedicadas (`StoreUserRequest`, `StoreProductoRequest`, `ClienteRequest`, `SaleRequest`, `StoreCompraRequest`, etc.).
2. **Transformación API (`JsonResource`)**: Todas las vistas de Inertia.js reciben datos limpios y fuertemente formateados a través de `JsonResource` (`UserResource`, `ProductoResource`, `ClienteResource`, `SaleResource`, etc.).
3. **Servicios de Dominio (`Services`)**: Lógica de negocio encapsulated en servicios desacoplados (`InventoryService`, `CashRegisterService`, `SaleService`, `PurchaseService`).
4. **Sincronización de Tipos TypeScript (`resources/js/types/index.ts`)**: Interfaces de React idénticas 1:1 con las respuestas enviadas por las capas del backend.

Para más detalles técnicos, consulta la **[Guía de Arquitectura del Desarrollador](file:///c:/laragon/www/servitec/docs/architecture.md)**.

---

## 🛠️ Tecnologías Utilizadas

* **Backend:** PHP 8.3+, Laravel 13.x (Inertia.js Stack).
* **Frontend:** React 19, TypeScript 5.7+, TailwindCSS v4, Radix UI.
* **Base de Datos:** MySQL 8+ / MariaDB.
* **Testing:** PHPUnit / Pest.

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

5. **Ejecutar la suite de pruebas automatizadas:**
   ```bash
   php artisan test
   ```

6. **Iniciar los servidores de desarrollo:**
   ```bash
   php artisan serve
   npm run dev
   ```

---

## 📄 Licencia
Este proyecto es un software privado propiedad de **Servitec**. Todos los derechos reservados.
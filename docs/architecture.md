# 📘 Guía de Arquitectura de Servitec

Esta guía documenta los patrones de diseño, arquitectura e infraestructura del proyecto **Servitec** (Laravel 13 + React 19 + Inertia.js 3.0).

---

## 🏗️ 1. Patrones de Diseño Principales

### A. Multi-Tenancy Aislado (`BelongsToEmpresa` & `Multitenantable`)
- **Ubicación**: [BelongsToEmpresa.php](file:///c:/laragon/www/servitec/app/Traits/BelongsToEmpresa.php) & [Multitenantable.php](file:///c:/laragon/www/servitec/app/Traits/Multitenantable.php)
- **Funcionamiento**:
  - Aplica un **Global Scope (`empresa_scope`)** a las consultas Eloquent de los modelos asociados a una empresa.
  - Los usuarios pertenecientes a un Tenant (Empresa) únicamente pueden consultar y editar datos con su `empresa_id`.
  - El rol **`Super Administrador`** o **`super-admin`** omite este filtro para permitir administración global.

### B. Autonomía de Roles y Permisos por Empresa (`Spatie Permission Teams`)
- **Configuración**: `config/permission.php` (`'teams' => true`, `'team_foreign_key' => 'empresa_id'`)
- **Middleware**: [SetPermissionsTeam.php](file:///c:/laragon/www/servitec/app/Http/Middleware/SetPermissionsTeam.php)
- **Migración**: [2026_08_05_100000_add_teams_empresa_id_to_permission_tables.php](file:///c:/laragon/www/servitec/database/migrations/2026_08_05_100000_add_teams_empresa_id_to_permission_tables.php)
- **Funcionamiento**:
  - Cada empresa posee **su propia lista de Roles autónomos** asociando `roles.empresa_id`.
  - El middleware `SetPermissionsTeam` establece automáticamente `setPermissionsTeamId($user->empresa_id)` en cada petición.
  - La *Empresa A* y la *Empresa B* pueden crear roles con el mismo nombre y asignaciones de permisos independientes sin colisiones.

### C. Servicio de Inventario y Kardex (`InventoryService`)
- **Ubicación**: [InventoryService.php](file:///c:/laragon/www/servitec/app/Services/InventoryService.php)
- **Métodos**:
  - `recordMovement(...)`: Registra cualquier entrada o salida de inventario de forma atómica.
  - `recordInitialStock(...)`: Registra el movimiento inicial al dar de alta un producto.
  - `recordStockAdjustment(...)`: Registra diferencias por edición directa de existencias.

### D. Form Requests (Validaciones Desacopladas)
- **Ubicación**: `app/Http/Requests/Admin/`
- **Uso**: Los controladores inyectan clases `FormRequest` (`StoreUserRequest`, `UpdateUserRequest`, `StoreEmpresaRequest`, `StoreProductoRequest`, `SucursalRequest`, `ClienteRequest`, `CashRegisterRequest`, `SaleRequest`, `StoreCompraRequest`, etc.) para asegurar controladores delgados (Thin Controllers).

### E. Capa de Transformación API (`JsonResource`)
- **Ubicación**: `app/Http/Resources/`
- **Modelos**: `UserResource`, `EmpresaResource`, `ProductoResource`, `SucursalResource`, `ProveedorResource`, `ClienteResource`, `CashRegisterResource`, `SaleResource`, `CompraResource`.
- **Beneficio**: Garantiza que React reciba objetos formateados mediante Inertia props sin transferir atributos no requeridos o confidenciales.

---

## 🧪 2. Suite de Pruebas Automatizadas
- `tests/Feature/Admin/UserManagementTest.php`: Cobertura de autenticación, creación de usuarios y aislamiento multi-tenant.
- `tests/Feature/Admin/ProductoManagementTest.php`: Validación de Kardex e integración del `InventoryService`.
- `tests/Feature/Admin/PointOfSaleTest.php`: Validación de apertura/cierre de caja registradora y procesamiento de ventas de contado/crédito.

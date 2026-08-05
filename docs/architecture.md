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

### B. Servicio de Inventario y Kardex (`InventoryService`)
- **Ubicación**: [InventoryService.php](file:///c:/laragon/www/servitec/app/Services/InventoryService.php)
- **Métodos**:
  - `recordMovement(...)`: Registra cualquier entrada o salida de inventario de forma atómica.
  - `recordInitialStock(...)`: Registra el movimiento inicial al dar de alta un producto.
  - `recordStockAdjustment(...)`: Registra diferencias por edición directa de existencias.

### C. Form Requests (Validaciones Desacopladas)
- **Ubicación**: `app/Http/Requests/Admin/`
- **Uso**: Los controladores inyectan clases `FormRequest` (`StoreUserRequest`, `UpdateUserRequest`, `StoreEmpresaRequest`, `StoreProductoRequest`, `SucursalRequest`, etc.) para asegurar controladores delgados (Thin Controllers).

### D. Capa de Transformación API (`JsonResource`)
- **Ubicación**: `app/Http/Resources/`
- **Modelos**: `UserResource`, `EmpresaResource`, `ProductoResource`, `SucursalResource`, `ProveedorResource`.
- **Beneficio**: Garantiza que React reciba objetos formateados mediante Inertia props sin transferir atributos no requeridos o confidenciales.

### E. Autorización Declarativa (`Policies & Gate`)
- **Ubicación**: `app/Policies/`
- **Mapeo**: `UserPolicy`, `EmpresaPolicy`, `ProductoPolicy`.
- **Invocación**: `$this->authorize(...)` o `Gate::authorize(...)` en controladores.

---

## 🧪 2. Suite de Pruebas Automatizadas
- `tests/Feature/Admin/UserManagementTest.php`: Cobertura de autenticación, creación de usuarios y aislamiento multi-tenant.
- `tests/Feature/Admin/ProductoManagementTest.php`: Validación de Kardex e integración del `InventoryService`.

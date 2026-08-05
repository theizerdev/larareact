export * from './app';
export * from './auth';

export interface Empresa {
    id: number;
    razon_social: string;
    documento: string;
    email?: string;
    telefono?: string;
    direccion?: string;
    representante_legal?: string;
    status: boolean;
    logo?: string;
    logo_mini?: string;
    subscription_status?: string;
    pais?: {
        id: number;
        nombre: string;
        codigo_iso2: string;
    };
    created_at?: string;
}

export interface Sucursal {
    id: number;
    nombre: string;
    telefono?: string;
    direccion?: string;
    latitud?: number;
    longitud?: number;
    status: boolean;
    empresa_id: number;
    pais_telefono_id?: number;
    empresa?: Partial<Empresa>;
    created_at?: string;
}

export interface User {
    id: number;
    name: string;
    username?: string;
    email: string;
    status: string;
    telefono?: string;
    empresa_id?: number;
    sucursal_id?: number;
    pais_telefono_id?: number;
    empresa?: Partial<Empresa>;
    sucursal?: Partial<Sucursal>;
    roles?: { id: number; name: string }[];
    created_at?: string;
}

export interface Producto {
    id: number;
    sku: string;
    codigo_barras?: string;
    nombre_variante: string;
    condicion: 'nuevo' | 'usado' | 'reacondicionado' | 'repuesto';
    tipo_venta: 'unidad' | 'granel' | 'paquete';
    usa_inventario: boolean;
    precio_compra: number;
    precio_venta: number;
    precio_mayoreo: number;
    stock: number;
    stock_minimo: number;
    estado: boolean;
    specs_completas?: Record<string, string>;
    categoria?: { id: number; nombre: string };
    marca?: { id: number; nombre: string };
    familia?: { id: number; nombre: string };
    modelo?: { id: number; nombre_comercial: string; codigo_modelo?: string };
    created_at?: string;
}

export interface Cliente {
    id: number;
    nombre: string;
    telefono?: string;
    email?: string;
    direccion?: string;
    limite_credito: number;
    saldo_pendiente: number;
    credito_disponible: number;
    estado: boolean;
    empresa_id?: number;
    sucursal_id?: number;
    created_at?: string;
}

export interface CashRegister {
    id: number;
    status: 'open' | 'closed';
    opening_amount: number;
    closing_amount?: number;
    counted_amount?: number;
    difference?: number;
    opened_at?: string;
    closed_at?: string;
    empresa_id?: number;
    sucursal_id?: number;
    user?: Partial<User>;
    movements_count?: number;
}

export interface SaleItem {
    id: number;
    concepto_tipo: 'producto' | 'servicio';
    nombre: string;
    cantidad: number;
    precio_unitario: number;
    subtotal: number;
}

export interface SalePayment {
    id: number;
    metodo_pago: string;
    monto: number;
}

export interface Sale {
    id: number;
    codigo_ticket: string;
    cliente_nombre?: string;
    cliente_id?: number;
    metodo_pago?: string;
    subtotal: number;
    impuesto: number;
    descuento: number;
    total: number;
    monto_recibido: number;
    cambio: number;
    es_credito: boolean;
    saldo_credito: number;
    estado: string;
    empresa_id?: number;
    sucursal_id?: number;
    created_at?: string;
    user?: Partial<User>;
    items?: SaleItem[];
    payments?: SalePayment[];
}

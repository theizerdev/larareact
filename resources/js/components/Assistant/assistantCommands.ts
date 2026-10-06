export type CommandCategoryId = 'todos' | 'taller' | 'clientes' | 'inventario' | 'finanzas' | 'catalogo';

export interface CommandCategory {
    id: CommandCategoryId;
    label: string;
    emoji: string;
}

export interface AssistantCommand {
    category: Exclude<CommandCategoryId, 'todos'>;
    /** Texto corto mostrado en el chip */
    label: string;
    /** Texto que se escribe/envía al asistente */
    text: string;
    /** Si es true, solo se precarga en el input (requiere completar datos) */
    prefill?: boolean;
    /** Descripción breve mostrada en el autocompletado */
    hint: string;
}

export const COMMAND_CATEGORIES: CommandCategory[] = [
    { id: 'todos', label: 'Todos', emoji: '⚡' },
    { id: 'taller', label: 'Taller', emoji: '🔧' },
    { id: 'clientes', label: 'Clientes', emoji: '👤' },
    { id: 'inventario', label: 'Inventario', emoji: '📦' },
    { id: 'finanzas', label: 'Finanzas', emoji: '💼' },
    { id: 'catalogo', label: 'Catálogo', emoji: '🏷️' },
];

export const ASSISTANT_COMMANDS: AssistantCommand[] = [
    // Taller & Reparaciones
    { category: 'taller', label: 'Crear orden', text: 'crear orden ', prefill: true, hint: 'crear orden cliente Juan Perez telefono 04141234567 equipo iPhone 11 falla pantalla costo 45' },
    { category: 'taller', label: 'Consultar orden', text: 'orden ', prefill: true, hint: 'orden 1 · datos completos, técnico, saldo y estado' },
    { category: 'taller', label: 'Cambiar estado', text: 'estado ', prefill: true, hint: 'estado 1 listo y notificar · actualiza y envía WhatsApp' },
    { category: 'taller', label: 'Eliminar orden', text: 'eliminar orden ', prefill: true, hint: 'eliminar orden 1 · cancela y elimina con restauración de stock' },
    { category: 'taller', label: 'Cotizar reparación', text: 'cotizar ', prefill: true, hint: 'cotizar pantalla iphone 13 · calcula repuesto + mano de obra' },
    { category: 'taller', label: 'Resumen hoy', text: 'resumen hoy', hint: 'Estadísticas y balance de órdenes del día' },
    { category: 'taller', label: 'Órdenes listas', text: 'ordenes listas', hint: 'Equipos reparados en espera de retiro del cliente' },
    { category: 'taller', label: 'Equipos en taller', text: 'equipos en reparacion', hint: 'Dispositivos actualmente en diagnóstico o reparación' },
    { category: 'taller', label: 'Notificar WhatsApp', text: 'whatsapp ', prefill: true, hint: 'whatsapp 1 · envía mensaje con link público de seguimiento' },
    { category: 'taller', label: 'Alertas de stock taller', text: 'alertas stock', hint: 'Repuestos técnicos con existencias bajas' },

    // Clientes & Cuentas por Cobrar
    { category: 'clientes', label: 'Ver clientes', text: 'ver clientes', hint: 'Directorio de clientes registrados recientemente' },
    { category: 'clientes', label: 'Buscar cliente', text: 'buscar cliente ', prefill: true, hint: 'buscar cliente Juan · por nombre, teléfono o email' },
    { category: 'clientes', label: 'Crear cliente', text: 'crear cliente ', prefill: true, hint: 'crear cliente Juan Perez telefono 04121234567 email juan@ejemplo.com' },
    { category: 'clientes', label: 'Clientes con deuda', text: 'clientes con deuda', hint: 'Listado de morosos y cuentas por cobrar pendientes' },
    { category: 'clientes', label: 'Consultar deuda', text: 'deuda de ', prefill: true, hint: 'deuda de Carlos · saldo pendiente y límite de crédito' },
    { category: 'clientes', label: 'Abonar a cuenta', text: 'abonar ', prefill: true, hint: 'abonar 20 a Juan Perez · registra cobro y abono en caja' },

    // Inventario, Precios & Kardex
    { category: 'inventario', label: 'Verificar precio', text: 'precio ', prefill: true, hint: 'precio pantalla iphone 13 · consulta precio de venta y stock' },
    { category: 'inventario', label: '¿Cuánto cuesta?', text: 'cuanto cuesta ', prefill: true, hint: 'cuanto cuesta cargador samsung · precio y disponibilidad' },
    { category: 'inventario', label: 'Consultar existencias', text: 'stock ', prefill: true, hint: 'stock Pantalla · existencias físicas y disponibilidad' },
    { category: 'inventario', label: '¿Cuánto hay en stock?', text: 'cuanto hay de ', prefill: true, hint: 'cuanto hay de bateria · existencias actuales' },
    { category: 'inventario', label: 'Ver repuestos', text: 'repuestos ', prefill: true, hint: 'repuestos Bateria · piezas físicas para taller' },
    { category: 'inventario', label: 'Repuestos agotados', text: 'repuestos agotados', hint: 'Piezas de taller sin existencias en inventario' },
    { category: 'inventario', label: 'Por categoría', text: 'categoria ', prefill: true, hint: 'categoria Display · artículos registrados en una categoría' },
    { category: 'inventario', label: 'Ver Kardex', text: 'ver kardex', hint: 'Últimos movimientos de entradas y salidas de inventario' },
    { category: 'inventario', label: 'Kardex de producto', text: 'kardex ', prefill: true, hint: 'kardex Pantalla · historial de movimientos de un artículo' },
    { category: 'inventario', label: 'Ajustar stock físico', text: 'ajustar stock ', prefill: true, hint: 'ajustar stock Bateria a 15 por inventario' },
    { category: 'inventario', label: 'Sumar stock (+)', text: 'sumar ', prefill: true, hint: 'sumar 5 stock Pantalla' },
    { category: 'inventario', label: 'Restar stock (-)', text: 'restar ', prefill: true, hint: 'restar 2 stock Mica' },
    { category: 'inventario', label: 'Crear producto', text: 'crear producto ', prefill: true, hint: 'crear producto Mica precio 5 stock 20' },
    { category: 'inventario', label: 'Stock bajo', text: 'alertas stock', hint: 'Artículos con existencias iguales o menores al mínimo' },

    // Finanzas, Caja Chica & POS
    { category: 'finanzas', label: 'Ventas de hoy', text: 'ventas hoy', hint: 'Facturación, tickets cobrados y desglose de métodos de pago de hoy' },
    { category: 'finanzas', label: 'Estado de caja', text: 'estado de caja', hint: 'Efectivo en gaveta, ventas en efectivo y balance de turno' },
    { category: 'finanzas', label: 'Abrir caja', text: 'abrir caja ', prefill: true, hint: 'abrir caja 50 · apertura con monto base en efectivo' },
    { category: 'finanzas', label: 'Cerrar caja', text: 'cerrar caja ', prefill: true, hint: 'cerrar caja 250 · cierre de turno con arqueo' },
    { category: 'finanzas', label: 'Registrar gasto', text: 'gasto ', prefill: true, hint: 'gasto 10 almuerzo · egreso de caja chica con motivo' },
    { category: 'finanzas', label: 'Registrar ingreso', text: 'ingreso caja ', prefill: true, hint: 'ingreso caja 20 cambio · entrada a caja chica' },
    { category: 'finanzas', label: 'Metas de ventas', text: 'meta de ventas', hint: 'Progreso y cumplimiento mensual y diario' },
    { category: 'finanzas', label: 'Fondo de mes', text: 'fondo de mes', hint: 'Balance consolidado de cajas y egresos del mes' },
    { category: 'finanzas', label: 'Ver compras', text: 'ver compras', hint: 'Compras recientes de insumos y mercadería' },
    { category: 'finanzas', label: 'Ver proveedores', text: 'ver proveedores', hint: 'Directorio de proveedores registrados' },
    { category: 'finanzas', label: 'Crear proveedor', text: 'crear proveedor ', prefill: true, hint: 'crear proveedor Insumos Tech telefono 04121234567' },

    // Catálogo, Marcas & Servicios
    { category: 'catalogo', label: 'Ver servicios', text: 'servicios', hint: 'Catálogo de mano de obra técnica y tarifas de instalación' },
    { category: 'catalogo', label: 'Consultar servicio', text: 'servicio ', prefill: true, hint: 'servicio cambio de pantalla · costo y mano de obra' },
    { category: 'catalogo', label: 'Ver marcas', text: 'ver marcas', hint: 'Listado de marcas registradas' },
    { category: 'catalogo', label: 'Crear marca', text: 'crear marca ', prefill: true, hint: 'crear marca Xiaomi' },
    { category: 'catalogo', label: 'Ver categorías', text: 'ver categorias', hint: 'Listado de categorías registradas' },
    { category: 'catalogo', label: 'Crear categoría', text: 'crear categoria ', prefill: true, hint: 'crear categoria Baterias' },
    { category: 'catalogo', label: 'Modelos de marca', text: 'modelos de ', prefill: true, hint: 'modelos de Xiaomi' },
    { category: 'catalogo', label: 'Crear modelo', text: 'crear modelo ', prefill: true, hint: 'crear modelo Redmi Note 13 para Xiaomi' },
];

const normalize = (value: string): string =>
    value
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();

/**
 * Devuelve comandos sugeridos para el texto escrito (autocompletado).
 * Soporta disparador con '/' para menú tipo Spotlight rápido.
 */
export function suggestCommands(input: string, limit = 8): AssistantCommand[] {
    const raw = input.trim();
    if (raw === '/' || raw === '?' || raw === 'ayuda' || raw === 'comandos') {
        return ASSISTANT_COMMANDS.slice(0, limit);
    }

    const clean = raw.startsWith('/') ? raw.slice(1).trim() : raw;
    const query = normalize(clean);

    if (raw.startsWith('/') && query.length === 0) {
        return ASSISTANT_COMMANDS.slice(0, limit);
    }

    if (query.length < 2) {
        return [];
    }

    const seen = new Set<string>();
    const scored: Array<{ command: AssistantCommand; score: number }> = [];

    for (const command of ASSISTANT_COMMANDS) {
        const key = command.text.trim();
        if (seen.has(key)) continue;

        const text = normalize(command.text);
        const label = normalize(command.label);
        const hint = normalize(command.hint);

        let score = 0;
        if (text.startsWith(query)) score = 4;
        else if (label.startsWith(query)) score = 3;
        else if (text.includes(query) || label.includes(query)) score = 2;
        else if (hint.includes(query)) score = 1;

        // Si el usuario ya completó el comando y sigue escribiendo datos, no molestar
        if (score > 0 && text.length > 0 && query.startsWith(text) && query.length > text.length + 1 && command.prefill) {
            continue;
        }

        if (score > 0) {
            seen.add(key);
            scored.push({ command, score });
        }
    }

    return scored
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map((entry) => entry.command);
}

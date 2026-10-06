export type CommandCategoryId = 'taller' | 'clientes' | 'inventario' | 'finanzas' | 'catalogo';

export interface CommandCategory {
    id: CommandCategoryId;
    label: string;
    emoji: string;
}

export interface AssistantCommand {
    category: CommandCategoryId;
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
    { id: 'taller', label: 'Taller', emoji: '🔧' },
    { id: 'clientes', label: 'Clientes', emoji: '👤' },
    { id: 'inventario', label: 'Inventario', emoji: '📦' },
    { id: 'finanzas', label: 'Finanzas', emoji: '💼' },
    { id: 'catalogo', label: 'Catálogo', emoji: '🏷️' },
];

export const ASSISTANT_COMMANDS: AssistantCommand[] = [
    // Taller
    { category: 'taller', label: 'Resumen hoy', text: 'resumen hoy', hint: 'Órdenes del taller del día' },
    { category: 'taller', label: 'Consultar orden', text: 'orden ', prefill: true, hint: 'orden 1 · datos y estado de una orden' },
    { category: 'taller', label: 'Cambiar estado', text: 'estado ', prefill: true, hint: 'estado 1 listo · actualiza una orden' },
    { category: 'taller', label: 'Notificar WhatsApp', text: 'whatsapp ', prefill: true, hint: 'whatsapp 1 · avisa al cliente con tracking' },
    { category: 'taller', label: 'Alertas de stock', text: 'alertas stock', hint: 'Repuestos con existencias bajas' },

    // Clientes
    { category: 'clientes', label: 'Ver clientes', text: 'ver clientes', hint: 'Clientes registrados recientemente' },
    { category: 'clientes', label: 'Crear cliente', text: 'crear cliente ', prefill: true, hint: 'crear cliente Juan Perez telefono 0412... email ...' },
    { category: 'clientes', label: 'Buscar cliente', text: 'buscar cliente ', prefill: true, hint: 'por nombre, teléfono o email' },

    // Inventario
    { category: 'inventario', label: 'Ver Kardex', text: 'ver kardex', hint: 'Últimos movimientos de inventario' },
    { category: 'inventario', label: 'Kardex de producto', text: 'kardex ', prefill: true, hint: 'kardex Pantalla · movimientos de un producto' },
    { category: 'inventario', label: 'Ajustar stock', text: 'ajustar stock ', prefill: true, hint: 'ajustar stock Bateria a 15 por inventario' },
    { category: 'inventario', label: 'Sumar stock', text: 'sumar ', prefill: true, hint: 'sumar 5 stock Pantalla' },
    { category: 'inventario', label: 'Restar stock', text: 'restar ', prefill: true, hint: 'restar 2 stock Mica' },
    { category: 'inventario', label: 'Crear producto', text: 'crear producto ', prefill: true, hint: 'crear producto Mica precio 5 stock 20' },
    { category: 'inventario', label: 'Stock bajo', text: 'alertas stock', hint: 'Repuestos con existencias bajas' },

    // Finanzas
    { category: 'finanzas', label: 'Metas de ventas', text: 'meta de ventas', hint: 'Progreso mensual y diario' },
    { category: 'finanzas', label: 'Fondo de mes', text: 'fondo de mes', hint: 'Balance de cajas y compras del mes' },
    { category: 'finanzas', label: 'Proveedores', text: 'ver proveedores', hint: 'Directorio de proveedores' },
    { category: 'finanzas', label: 'Crear proveedor', text: 'crear proveedor ', prefill: true, hint: 'crear proveedor Insumos Tech telefono 0412...' },
    { category: 'finanzas', label: 'Compras', text: 'ver compras', hint: 'Compras recientes de insumos' },

    // Catálogo
    { category: 'catalogo', label: 'Ver marcas', text: 'ver marcas', hint: 'Marcas registradas' },
    { category: 'catalogo', label: 'Ver categorías', text: 'ver categorias', hint: 'Categorías registradas' },
    { category: 'catalogo', label: 'Crear marca', text: 'crear marca ', prefill: true, hint: 'crear marca Xiaomi' },
    { category: 'catalogo', label: 'Crear modelo', text: 'crear modelo ', prefill: true, hint: 'crear modelo Redmi Note 13 para Xiaomi' },
    { category: 'catalogo', label: 'Crear categoría', text: 'crear categoria ', prefill: true, hint: 'crear categoria Baterias' },
    { category: 'catalogo', label: 'Modelos de marca', text: 'modelos de ', prefill: true, hint: 'modelos de Xiaomi' },
];

const normalize = (value: string): string =>
    value
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();

/**
 * Devuelve comandos sugeridos para el texto escrito (autocompletado).
 */
export function suggestCommands(input: string, limit = 5): AssistantCommand[] {
    const query = normalize(input);
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

        let score = 0;
        if (text.startsWith(query)) score = 3;
        else if (label.startsWith(query)) score = 2;
        else if (text.includes(query) || label.includes(query)) score = 1;

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

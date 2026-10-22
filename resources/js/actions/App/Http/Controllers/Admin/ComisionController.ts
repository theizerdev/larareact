import { queryParams, type RouteQueryOptions, type RouteDefinition, applyUrlDefaults } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Admin\ComisionController::index
 * @see app/Http/Controllers/Admin/ComisionController.php:45
 * @route '/admin/comisiones'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/admin/comisiones',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\ComisionController::index
 * @see app/Http/Controllers/Admin/ComisionController.php:45
 * @route '/admin/comisiones'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ComisionController::index
 * @see app/Http/Controllers/Admin/ComisionController.php:45
 * @route '/admin/comisiones'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Admin\ComisionController::index
 * @see app/Http/Controllers/Admin/ComisionController.php:45
 * @route '/admin/comisiones'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Admin\ComisionController::pagar
 * @see app/Http/Controllers/Admin/ComisionController.php:136
 * @route '/admin/comisiones/pagar'
 */
export const pagar = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: pagar.url(options),
    method: 'post',
})

pagar.definition = {
    methods: ["post"],
    url: '/admin/comisiones/pagar',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\ComisionController::pagar
 * @see app/Http/Controllers/Admin/ComisionController.php:136
 * @route '/admin/comisiones/pagar'
 */
pagar.url = (options?: RouteQueryOptions) => {
    return pagar.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ComisionController::pagar
 * @see app/Http/Controllers/Admin/ComisionController.php:136
 * @route '/admin/comisiones/pagar'
 */
pagar.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: pagar.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\ComisionController::pendingSales
 * @see app/Http/Controllers/Admin/ComisionController.php:115
 * @route '/admin/comisiones/empleado/{empleado}/pendientes'
 */
export const pendingSales = (args: { empleado: number | { id: number } } | [empleado: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: pendingSales.url(args, options),
    method: 'get',
})

pendingSales.definition = {
    methods: ["get","head"],
    url: '/admin/comisiones/empleado/{empleado}/pendientes',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\ComisionController::pendingSales
 * @see app/Http/Controllers/Admin/ComisionController.php:115
 * @route '/admin/comisiones/empleado/{empleado}/pendientes'
 */
pendingSales.url = (args: { empleado: number | { id: number } } | [empleado: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { empleado: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { empleado: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    empleado: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        empleado: typeof args.empleado === 'object'
                ? args.empleado.id
                : args.empleado,
                }

    return pendingSales.definition.url
            .replace('{empleado}', parsedArgs.empleado.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ComisionController::pendingSales
 * @see app/Http/Controllers/Admin/ComisionController.php:115
 * @route '/admin/comisiones/empleado/{empleado}/pendientes'
 */
pendingSales.get = (args: { empleado: number | { id: number } } | [empleado: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: pendingSales.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Admin\ComisionController::pendingSales
 * @see app/Http/Controllers/Admin/ComisionController.php:115
 * @route '/admin/comisiones/empleado/{empleado}/pendientes'
 */
pendingSales.head = (args: { empleado: number | { id: number } } | [empleado: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: pendingSales.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Admin\ComisionController::ticket
 * @see app/Http/Controllers/Admin/ComisionController.php:185
 * @route '/admin/comisiones/ticket/{comisionPago}'
 */
export const ticket = (args: { comisionPago: number | { id: number } } | [comisionPago: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: ticket.url(args, options),
    method: 'get',
})

ticket.definition = {
    methods: ["get","head"],
    url: '/admin/comisiones/ticket/{comisionPago}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\ComisionController::ticket
 * @see app/Http/Controllers/Admin/ComisionController.php:185
 * @route '/admin/comisiones/ticket/{comisionPago}'
 */
ticket.url = (args: { comisionPago: number | { id: number } } | [comisionPago: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { comisionPago: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { comisionPago: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    comisionPago: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        comisionPago: typeof args.comisionPago === 'object'
                ? args.comisionPago.id
                : args.comisionPago,
                }

    return ticket.definition.url
            .replace('{comisionPago}', parsedArgs.comisionPago.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ComisionController::ticket
 * @see app/Http/Controllers/Admin/ComisionController.php:185
 * @route '/admin/comisiones/ticket/{comisionPago}'
 */
ticket.get = (args: { comisionPago: number | { id: number } } | [comisionPago: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: ticket.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Admin\ComisionController::ticket
 * @see app/Http/Controllers/Admin/ComisionController.php:185
 * @route '/admin/comisiones/ticket/{comisionPago}'
 */
ticket.head = (args: { comisionPago: number | { id: number } } | [comisionPago: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: ticket.url(args, options),
    method: 'head',
})
const ComisionController = { index, pagar, pendingSales, ticket }

export default ComisionController
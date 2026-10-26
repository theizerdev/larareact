import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../wayfinder'
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
* @see \App\Http\Controllers\Admin\ComisionController::index
* @see app/Http/Controllers/Admin/ComisionController.php:45
* @route '/admin/comisiones'
*/
const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\ComisionController::index
* @see app/Http/Controllers/Admin/ComisionController.php:45
* @route '/admin/comisiones'
*/
indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\ComisionController::index
* @see app/Http/Controllers/Admin/ComisionController.php:45
* @route '/admin/comisiones'
*/
indexForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

index.form = indexForm

/**
* @see \App\Http\Controllers\Admin\ComisionController::pagar
* @see app/Http/Controllers/Admin/ComisionController.php:139
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
* @see app/Http/Controllers/Admin/ComisionController.php:139
* @route '/admin/comisiones/pagar'
*/
pagar.url = (options?: RouteQueryOptions) => {
    return pagar.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ComisionController::pagar
* @see app/Http/Controllers/Admin/ComisionController.php:139
* @route '/admin/comisiones/pagar'
*/
pagar.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: pagar.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\ComisionController::pagar
* @see app/Http/Controllers/Admin/ComisionController.php:139
* @route '/admin/comisiones/pagar'
*/
const pagarForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: pagar.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\ComisionController::pagar
* @see app/Http/Controllers/Admin/ComisionController.php:139
* @route '/admin/comisiones/pagar'
*/
pagarForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: pagar.url(options),
    method: 'post',
})

pagar.form = pagarForm

/**
* @see \App\Http\Controllers\Admin\ComisionController::syncTaller
* @see app/Http/Controllers/Admin/ComisionController.php:197
* @route '/admin/comisiones/sync-taller'
*/
export const syncTaller = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: syncTaller.url(options),
    method: 'post',
})

syncTaller.definition = {
    methods: ["post"],
    url: '/admin/comisiones/sync-taller',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\ComisionController::syncTaller
* @see app/Http/Controllers/Admin/ComisionController.php:197
* @route '/admin/comisiones/sync-taller'
*/
syncTaller.url = (options?: RouteQueryOptions) => {
    return syncTaller.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ComisionController::syncTaller
* @see app/Http/Controllers/Admin/ComisionController.php:197
* @route '/admin/comisiones/sync-taller'
*/
syncTaller.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: syncTaller.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\ComisionController::syncTaller
* @see app/Http/Controllers/Admin/ComisionController.php:197
* @route '/admin/comisiones/sync-taller'
*/
const syncTallerForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: syncTaller.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\ComisionController::syncTaller
* @see app/Http/Controllers/Admin/ComisionController.php:197
* @route '/admin/comisiones/sync-taller'
*/
syncTallerForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: syncTaller.url(options),
    method: 'post',
})

syncTaller.form = syncTallerForm

/**
* @see \App\Http\Controllers\Admin\ComisionController::actualizarPctTaller
* @see app/Http/Controllers/Admin/ComisionController.php:225
* @route '/admin/comisiones/actualizar-pct-taller'
*/
export const actualizarPctTaller = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: actualizarPctTaller.url(options),
    method: 'post',
})

actualizarPctTaller.definition = {
    methods: ["post"],
    url: '/admin/comisiones/actualizar-pct-taller',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\ComisionController::actualizarPctTaller
* @see app/Http/Controllers/Admin/ComisionController.php:225
* @route '/admin/comisiones/actualizar-pct-taller'
*/
actualizarPctTaller.url = (options?: RouteQueryOptions) => {
    return actualizarPctTaller.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ComisionController::actualizarPctTaller
* @see app/Http/Controllers/Admin/ComisionController.php:225
* @route '/admin/comisiones/actualizar-pct-taller'
*/
actualizarPctTaller.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: actualizarPctTaller.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\ComisionController::actualizarPctTaller
* @see app/Http/Controllers/Admin/ComisionController.php:225
* @route '/admin/comisiones/actualizar-pct-taller'
*/
const actualizarPctTallerForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: actualizarPctTaller.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\ComisionController::actualizarPctTaller
* @see app/Http/Controllers/Admin/ComisionController.php:225
* @route '/admin/comisiones/actualizar-pct-taller'
*/
actualizarPctTallerForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: actualizarPctTaller.url(options),
    method: 'post',
})

actualizarPctTaller.form = actualizarPctTallerForm

/**
* @see \App\Http\Controllers\Admin\ComisionController::syncVentas
* @see app/Http/Controllers/Admin/ComisionController.php:271
* @route '/admin/comisiones/sync-ventas'
*/
export const syncVentas = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: syncVentas.url(options),
    method: 'post',
})

syncVentas.definition = {
    methods: ["post"],
    url: '/admin/comisiones/sync-ventas',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\ComisionController::syncVentas
* @see app/Http/Controllers/Admin/ComisionController.php:271
* @route '/admin/comisiones/sync-ventas'
*/
syncVentas.url = (options?: RouteQueryOptions) => {
    return syncVentas.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ComisionController::syncVentas
* @see app/Http/Controllers/Admin/ComisionController.php:271
* @route '/admin/comisiones/sync-ventas'
*/
syncVentas.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: syncVentas.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\ComisionController::syncVentas
* @see app/Http/Controllers/Admin/ComisionController.php:271
* @route '/admin/comisiones/sync-ventas'
*/
const syncVentasForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: syncVentas.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\ComisionController::syncVentas
* @see app/Http/Controllers/Admin/ComisionController.php:271
* @route '/admin/comisiones/sync-ventas'
*/
syncVentasForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: syncVentas.url(options),
    method: 'post',
})

syncVentas.form = syncVentasForm

/**
* @see \App\Http\Controllers\Admin\ComisionController::actualizarPctVentas
* @see app/Http/Controllers/Admin/ComisionController.php:299
* @route '/admin/comisiones/actualizar-pct-ventas'
*/
export const actualizarPctVentas = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: actualizarPctVentas.url(options),
    method: 'post',
})

actualizarPctVentas.definition = {
    methods: ["post"],
    url: '/admin/comisiones/actualizar-pct-ventas',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\ComisionController::actualizarPctVentas
* @see app/Http/Controllers/Admin/ComisionController.php:299
* @route '/admin/comisiones/actualizar-pct-ventas'
*/
actualizarPctVentas.url = (options?: RouteQueryOptions) => {
    return actualizarPctVentas.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ComisionController::actualizarPctVentas
* @see app/Http/Controllers/Admin/ComisionController.php:299
* @route '/admin/comisiones/actualizar-pct-ventas'
*/
actualizarPctVentas.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: actualizarPctVentas.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\ComisionController::actualizarPctVentas
* @see app/Http/Controllers/Admin/ComisionController.php:299
* @route '/admin/comisiones/actualizar-pct-ventas'
*/
const actualizarPctVentasForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: actualizarPctVentas.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\ComisionController::actualizarPctVentas
* @see app/Http/Controllers/Admin/ComisionController.php:299
* @route '/admin/comisiones/actualizar-pct-ventas'
*/
actualizarPctVentasForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: actualizarPctVentas.url(options),
    method: 'post',
})

actualizarPctVentas.form = actualizarPctVentasForm

/**
* @see \App\Http\Controllers\Admin\ComisionController::pendientes
* @see app/Http/Controllers/Admin/ComisionController.php:118
* @route '/admin/comisiones/empleado/{empleado}/pendientes'
*/
export const pendientes = (args: { empleado: number | { id: number } } | [empleado: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: pendientes.url(args, options),
    method: 'get',
})

pendientes.definition = {
    methods: ["get","head"],
    url: '/admin/comisiones/empleado/{empleado}/pendientes',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\ComisionController::pendientes
* @see app/Http/Controllers/Admin/ComisionController.php:118
* @route '/admin/comisiones/empleado/{empleado}/pendientes'
*/
pendientes.url = (args: { empleado: number | { id: number } } | [empleado: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
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

    return pendientes.definition.url
            .replace('{empleado}', parsedArgs.empleado.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ComisionController::pendientes
* @see app/Http/Controllers/Admin/ComisionController.php:118
* @route '/admin/comisiones/empleado/{empleado}/pendientes'
*/
pendientes.get = (args: { empleado: number | { id: number } } | [empleado: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: pendientes.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\ComisionController::pendientes
* @see app/Http/Controllers/Admin/ComisionController.php:118
* @route '/admin/comisiones/empleado/{empleado}/pendientes'
*/
pendientes.head = (args: { empleado: number | { id: number } } | [empleado: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: pendientes.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Admin\ComisionController::pendientes
* @see app/Http/Controllers/Admin/ComisionController.php:118
* @route '/admin/comisiones/empleado/{empleado}/pendientes'
*/
const pendientesForm = (args: { empleado: number | { id: number } } | [empleado: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: pendientes.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\ComisionController::pendientes
* @see app/Http/Controllers/Admin/ComisionController.php:118
* @route '/admin/comisiones/empleado/{empleado}/pendientes'
*/
pendientesForm.get = (args: { empleado: number | { id: number } } | [empleado: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: pendientes.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\ComisionController::pendientes
* @see app/Http/Controllers/Admin/ComisionController.php:118
* @route '/admin/comisiones/empleado/{empleado}/pendientes'
*/
pendientesForm.head = (args: { empleado: number | { id: number } } | [empleado: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: pendientes.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

pendientes.form = pendientesForm

/**
* @see \App\Http\Controllers\Admin\ComisionController::ticket
* @see app/Http/Controllers/Admin/ComisionController.php:188
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
* @see app/Http/Controllers/Admin/ComisionController.php:188
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
* @see app/Http/Controllers/Admin/ComisionController.php:188
* @route '/admin/comisiones/ticket/{comisionPago}'
*/
ticket.get = (args: { comisionPago: number | { id: number } } | [comisionPago: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: ticket.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\ComisionController::ticket
* @see app/Http/Controllers/Admin/ComisionController.php:188
* @route '/admin/comisiones/ticket/{comisionPago}'
*/
ticket.head = (args: { comisionPago: number | { id: number } } | [comisionPago: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: ticket.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Admin\ComisionController::ticket
* @see app/Http/Controllers/Admin/ComisionController.php:188
* @route '/admin/comisiones/ticket/{comisionPago}'
*/
const ticketForm = (args: { comisionPago: number | { id: number } } | [comisionPago: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: ticket.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\ComisionController::ticket
* @see app/Http/Controllers/Admin/ComisionController.php:188
* @route '/admin/comisiones/ticket/{comisionPago}'
*/
ticketForm.get = (args: { comisionPago: number | { id: number } } | [comisionPago: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: ticket.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\ComisionController::ticket
* @see app/Http/Controllers/Admin/ComisionController.php:188
* @route '/admin/comisiones/ticket/{comisionPago}'
*/
ticketForm.head = (args: { comisionPago: number | { id: number } } | [comisionPago: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: ticket.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

ticket.form = ticketForm

const comisiones = {
    index: Object.assign(index, index),
    pagar: Object.assign(pagar, pagar),
    syncTaller: Object.assign(syncTaller, syncTaller),
    actualizarPctTaller: Object.assign(actualizarPctTaller, actualizarPctTaller),
    syncVentas: Object.assign(syncVentas, syncVentas),
    actualizarPctVentas: Object.assign(actualizarPctVentas, actualizarPctVentas),
    pendientes: Object.assign(pendientes, pendientes),
    ticket: Object.assign(ticket, ticket),
}

export default comisiones
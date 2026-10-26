import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../../wayfinder'
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
* @see \App\Http\Controllers\Admin\ComisionController::updateWorkshopPercentage
* @see app/Http/Controllers/Admin/ComisionController.php:225
* @route '/admin/comisiones/actualizar-pct-taller'
*/
export const updateWorkshopPercentage = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: updateWorkshopPercentage.url(options),
    method: 'post',
})

updateWorkshopPercentage.definition = {
    methods: ["post"],
    url: '/admin/comisiones/actualizar-pct-taller',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\ComisionController::updateWorkshopPercentage
* @see app/Http/Controllers/Admin/ComisionController.php:225
* @route '/admin/comisiones/actualizar-pct-taller'
*/
updateWorkshopPercentage.url = (options?: RouteQueryOptions) => {
    return updateWorkshopPercentage.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ComisionController::updateWorkshopPercentage
* @see app/Http/Controllers/Admin/ComisionController.php:225
* @route '/admin/comisiones/actualizar-pct-taller'
*/
updateWorkshopPercentage.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: updateWorkshopPercentage.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\ComisionController::updateWorkshopPercentage
* @see app/Http/Controllers/Admin/ComisionController.php:225
* @route '/admin/comisiones/actualizar-pct-taller'
*/
const updateWorkshopPercentageForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: updateWorkshopPercentage.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\ComisionController::updateWorkshopPercentage
* @see app/Http/Controllers/Admin/ComisionController.php:225
* @route '/admin/comisiones/actualizar-pct-taller'
*/
updateWorkshopPercentageForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: updateWorkshopPercentage.url(options),
    method: 'post',
})

updateWorkshopPercentage.form = updateWorkshopPercentageForm

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
* @see \App\Http\Controllers\Admin\ComisionController::updateSalesPercentage
* @see app/Http/Controllers/Admin/ComisionController.php:299
* @route '/admin/comisiones/actualizar-pct-ventas'
*/
export const updateSalesPercentage = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: updateSalesPercentage.url(options),
    method: 'post',
})

updateSalesPercentage.definition = {
    methods: ["post"],
    url: '/admin/comisiones/actualizar-pct-ventas',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\ComisionController::updateSalesPercentage
* @see app/Http/Controllers/Admin/ComisionController.php:299
* @route '/admin/comisiones/actualizar-pct-ventas'
*/
updateSalesPercentage.url = (options?: RouteQueryOptions) => {
    return updateSalesPercentage.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ComisionController::updateSalesPercentage
* @see app/Http/Controllers/Admin/ComisionController.php:299
* @route '/admin/comisiones/actualizar-pct-ventas'
*/
updateSalesPercentage.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: updateSalesPercentage.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\ComisionController::updateSalesPercentage
* @see app/Http/Controllers/Admin/ComisionController.php:299
* @route '/admin/comisiones/actualizar-pct-ventas'
*/
const updateSalesPercentageForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: updateSalesPercentage.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\ComisionController::updateSalesPercentage
* @see app/Http/Controllers/Admin/ComisionController.php:299
* @route '/admin/comisiones/actualizar-pct-ventas'
*/
updateSalesPercentageForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: updateSalesPercentage.url(options),
    method: 'post',
})

updateSalesPercentage.form = updateSalesPercentageForm

/**
* @see \App\Http\Controllers\Admin\ComisionController::pendingSales
* @see app/Http/Controllers/Admin/ComisionController.php:118
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
* @see app/Http/Controllers/Admin/ComisionController.php:118
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
* @see app/Http/Controllers/Admin/ComisionController.php:118
* @route '/admin/comisiones/empleado/{empleado}/pendientes'
*/
pendingSales.get = (args: { empleado: number | { id: number } } | [empleado: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: pendingSales.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\ComisionController::pendingSales
* @see app/Http/Controllers/Admin/ComisionController.php:118
* @route '/admin/comisiones/empleado/{empleado}/pendientes'
*/
pendingSales.head = (args: { empleado: number | { id: number } } | [empleado: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: pendingSales.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Admin\ComisionController::pendingSales
* @see app/Http/Controllers/Admin/ComisionController.php:118
* @route '/admin/comisiones/empleado/{empleado}/pendientes'
*/
const pendingSalesForm = (args: { empleado: number | { id: number } } | [empleado: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: pendingSales.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\ComisionController::pendingSales
* @see app/Http/Controllers/Admin/ComisionController.php:118
* @route '/admin/comisiones/empleado/{empleado}/pendientes'
*/
pendingSalesForm.get = (args: { empleado: number | { id: number } } | [empleado: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: pendingSales.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\ComisionController::pendingSales
* @see app/Http/Controllers/Admin/ComisionController.php:118
* @route '/admin/comisiones/empleado/{empleado}/pendientes'
*/
pendingSalesForm.head = (args: { empleado: number | { id: number } } | [empleado: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: pendingSales.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

pendingSales.form = pendingSalesForm

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

const ComisionController = { index, pagar, syncTaller, updateWorkshopPercentage, syncVentas, updateSalesPercentage, pendingSales, ticket }

export default ComisionController
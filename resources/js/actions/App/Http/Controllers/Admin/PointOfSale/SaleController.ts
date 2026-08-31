import { queryParams, type RouteQueryOptions, type RouteDefinition, applyUrlDefaults } from './../../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Admin\PointOfSale\SaleController::terminal
* @see app/Http/Controllers/Admin/PointOfSale/SaleController.php:43
* @route '/admin/ventas/terminal'
*/
export const terminal = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: terminal.url(options),
    method: 'get',
})

terminal.definition = {
    methods: ["get","head"],
    url: '/admin/ventas/terminal',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\PointOfSale\SaleController::terminal
* @see app/Http/Controllers/Admin/PointOfSale/SaleController.php:43
* @route '/admin/ventas/terminal'
*/
terminal.url = (options?: RouteQueryOptions) => {
    return terminal.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\PointOfSale\SaleController::terminal
* @see app/Http/Controllers/Admin/PointOfSale/SaleController.php:43
* @route '/admin/ventas/terminal'
*/
terminal.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: terminal.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\PointOfSale\SaleController::terminal
* @see app/Http/Controllers/Admin/PointOfSale/SaleController.php:43
* @route '/admin/ventas/terminal'
*/
terminal.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: terminal.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Admin\PointOfSale\SaleController::updateValorDolar
* @see app/Http/Controllers/Admin/PointOfSale/SaleController.php:199
* @route '/admin/ventas/valor-dolar'
*/
export const updateValorDolar = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: updateValorDolar.url(options),
    method: 'post',
})

updateValorDolar.definition = {
    methods: ["post"],
    url: '/admin/ventas/valor-dolar',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\PointOfSale\SaleController::updateValorDolar
* @see app/Http/Controllers/Admin/PointOfSale/SaleController.php:199
* @route '/admin/ventas/valor-dolar'
*/
updateValorDolar.url = (options?: RouteQueryOptions) => {
    return updateValorDolar.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\PointOfSale\SaleController::updateValorDolar
* @see app/Http/Controllers/Admin/PointOfSale/SaleController.php:199
* @route '/admin/ventas/valor-dolar'
*/
updateValorDolar.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: updateValorDolar.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\PointOfSale\SaleController::index
* @see app/Http/Controllers/Admin/PointOfSale/SaleController.php:232
* @route '/admin/ventas'
*/
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/admin/ventas',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\PointOfSale\SaleController::index
* @see app/Http/Controllers/Admin/PointOfSale/SaleController.php:232
* @route '/admin/ventas'
*/
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\PointOfSale\SaleController::index
* @see app/Http/Controllers/Admin/PointOfSale/SaleController.php:232
* @route '/admin/ventas'
*/
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\PointOfSale\SaleController::index
* @see app/Http/Controllers/Admin/PointOfSale/SaleController.php:232
* @route '/admin/ventas'
*/
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Admin\PointOfSale\SaleController::store
* @see app/Http/Controllers/Admin/PointOfSale/SaleController.php:219
* @route '/admin/ventas'
*/
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/admin/ventas',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\PointOfSale\SaleController::store
* @see app/Http/Controllers/Admin/PointOfSale/SaleController.php:219
* @route '/admin/ventas'
*/
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\PointOfSale\SaleController::store
* @see app/Http/Controllers/Admin/PointOfSale/SaleController.php:219
* @route '/admin/ventas'
*/
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\PointOfSale\SaleController::show
* @see app/Http/Controllers/Admin/PointOfSale/SaleController.php:277
* @route '/admin/ventas/{venta}'
*/
export const show = (args: { venta: number | { id: number } } | [venta: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/admin/ventas/{venta}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\PointOfSale\SaleController::show
* @see app/Http/Controllers/Admin/PointOfSale/SaleController.php:277
* @route '/admin/ventas/{venta}'
*/
show.url = (args: { venta: number | { id: number } } | [venta: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { venta: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { venta: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            venta: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        venta: typeof args.venta === 'object'
        ? args.venta.id
        : args.venta,
    }

    return show.definition.url
            .replace('{venta}', parsedArgs.venta.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\PointOfSale\SaleController::show
* @see app/Http/Controllers/Admin/PointOfSale/SaleController.php:277
* @route '/admin/ventas/{venta}'
*/
show.get = (args: { venta: number | { id: number } } | [venta: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\PointOfSale\SaleController::show
* @see app/Http/Controllers/Admin/PointOfSale/SaleController.php:277
* @route '/admin/ventas/{venta}'
*/
show.head = (args: { venta: number | { id: number } } | [venta: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Admin\PointOfSale\SaleController::holdSale
* @see app/Http/Controllers/Admin/PointOfSale/SaleController.php:289
* @route '/admin/ventas/hold'
*/
export const holdSale = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: holdSale.url(options),
    method: 'post',
})

holdSale.definition = {
    methods: ["post"],
    url: '/admin/ventas/hold',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\PointOfSale\SaleController::holdSale
* @see app/Http/Controllers/Admin/PointOfSale/SaleController.php:289
* @route '/admin/ventas/hold'
*/
holdSale.url = (options?: RouteQueryOptions) => {
    return holdSale.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\PointOfSale\SaleController::holdSale
* @see app/Http/Controllers/Admin/PointOfSale/SaleController.php:289
* @route '/admin/ventas/hold'
*/
holdSale.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: holdSale.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\PointOfSale\SaleController::resumeSale
* @see app/Http/Controllers/Admin/PointOfSale/SaleController.php:314
* @route '/admin/ventas/resume/{heldSale}'
*/
export const resumeSale = (args: { heldSale: number | { id: number } } | [heldSale: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: resumeSale.url(args, options),
    method: 'post',
})

resumeSale.definition = {
    methods: ["post"],
    url: '/admin/ventas/resume/{heldSale}',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\PointOfSale\SaleController::resumeSale
* @see app/Http/Controllers/Admin/PointOfSale/SaleController.php:314
* @route '/admin/ventas/resume/{heldSale}'
*/
resumeSale.url = (args: { heldSale: number | { id: number } } | [heldSale: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { heldSale: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { heldSale: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            heldSale: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        heldSale: typeof args.heldSale === 'object'
        ? args.heldSale.id
        : args.heldSale,
    }

    return resumeSale.definition.url
            .replace('{heldSale}', parsedArgs.heldSale.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\PointOfSale\SaleController::resumeSale
* @see app/Http/Controllers/Admin/PointOfSale/SaleController.php:314
* @route '/admin/ventas/resume/{heldSale}'
*/
resumeSale.post = (args: { heldSale: number | { id: number } } | [heldSale: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: resumeSale.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\PointOfSale\SaleController::deleteHeldSale
* @see app/Http/Controllers/Admin/PointOfSale/SaleController.php:330
* @route '/admin/ventas/held/{heldSale}'
*/
export const deleteHeldSale = (args: { heldSale: number | { id: number } } | [heldSale: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: deleteHeldSale.url(args, options),
    method: 'delete',
})

deleteHeldSale.definition = {
    methods: ["delete"],
    url: '/admin/ventas/held/{heldSale}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\Admin\PointOfSale\SaleController::deleteHeldSale
* @see app/Http/Controllers/Admin/PointOfSale/SaleController.php:330
* @route '/admin/ventas/held/{heldSale}'
*/
deleteHeldSale.url = (args: { heldSale: number | { id: number } } | [heldSale: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { heldSale: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { heldSale: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            heldSale: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        heldSale: typeof args.heldSale === 'object'
        ? args.heldSale.id
        : args.heldSale,
    }

    return deleteHeldSale.definition.url
            .replace('{heldSale}', parsedArgs.heldSale.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\PointOfSale\SaleController::deleteHeldSale
* @see app/Http/Controllers/Admin/PointOfSale/SaleController.php:330
* @route '/admin/ventas/held/{heldSale}'
*/
deleteHeldSale.delete = (args: { heldSale: number | { id: number } } | [heldSale: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: deleteHeldSale.url(args, options),
    method: 'delete',
})

const SaleController = { terminal, updateValorDolar, index, store, show, holdSale, resumeSale, deleteHeldSale }

export default SaleController
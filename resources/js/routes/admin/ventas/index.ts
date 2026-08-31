import { queryParams, type RouteQueryOptions, type RouteDefinition, applyUrlDefaults } from './../../../wayfinder'
import held from './held'
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
* @see \App\Http\Controllers\Admin\PointOfSale\SaleController::valorDolar
* @see app/Http/Controllers/Admin/PointOfSale/SaleController.php:199
* @route '/admin/ventas/valor-dolar'
*/
export const valorDolar = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: valorDolar.url(options),
    method: 'post',
})

valorDolar.definition = {
    methods: ["post"],
    url: '/admin/ventas/valor-dolar',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\PointOfSale\SaleController::valorDolar
* @see app/Http/Controllers/Admin/PointOfSale/SaleController.php:199
* @route '/admin/ventas/valor-dolar'
*/
valorDolar.url = (options?: RouteQueryOptions) => {
    return valorDolar.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\PointOfSale\SaleController::valorDolar
* @see app/Http/Controllers/Admin/PointOfSale/SaleController.php:199
* @route '/admin/ventas/valor-dolar'
*/
valorDolar.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: valorDolar.url(options),
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
* @see \App\Http\Controllers\Admin\PointOfSale\SaleController::hold
* @see app/Http/Controllers/Admin/PointOfSale/SaleController.php:289
* @route '/admin/ventas/hold'
*/
export const hold = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: hold.url(options),
    method: 'post',
})

hold.definition = {
    methods: ["post"],
    url: '/admin/ventas/hold',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\PointOfSale\SaleController::hold
* @see app/Http/Controllers/Admin/PointOfSale/SaleController.php:289
* @route '/admin/ventas/hold'
*/
hold.url = (options?: RouteQueryOptions) => {
    return hold.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\PointOfSale\SaleController::hold
* @see app/Http/Controllers/Admin/PointOfSale/SaleController.php:289
* @route '/admin/ventas/hold'
*/
hold.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: hold.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\PointOfSale\SaleController::resume
* @see app/Http/Controllers/Admin/PointOfSale/SaleController.php:314
* @route '/admin/ventas/resume/{heldSale}'
*/
export const resume = (args: { heldSale: number | { id: number } } | [heldSale: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: resume.url(args, options),
    method: 'post',
})

resume.definition = {
    methods: ["post"],
    url: '/admin/ventas/resume/{heldSale}',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\PointOfSale\SaleController::resume
* @see app/Http/Controllers/Admin/PointOfSale/SaleController.php:314
* @route '/admin/ventas/resume/{heldSale}'
*/
resume.url = (args: { heldSale: number | { id: number } } | [heldSale: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
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

    return resume.definition.url
            .replace('{heldSale}', parsedArgs.heldSale.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\PointOfSale\SaleController::resume
* @see app/Http/Controllers/Admin/PointOfSale/SaleController.php:314
* @route '/admin/ventas/resume/{heldSale}'
*/
resume.post = (args: { heldSale: number | { id: number } } | [heldSale: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: resume.url(args, options),
    method: 'post',
})

const ventas = {
    terminal: Object.assign(terminal, terminal),
    valorDolar: Object.assign(valorDolar, valorDolar),
    index: Object.assign(index, index),
    store: Object.assign(store, store),
    show: Object.assign(show, show),
    hold: Object.assign(hold, hold),
    resume: Object.assign(resume, resume),
    held: Object.assign(held, held),
}

export default ventas
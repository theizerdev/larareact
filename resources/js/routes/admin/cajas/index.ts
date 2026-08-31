import { queryParams, type RouteQueryOptions, type RouteDefinition, applyUrlDefaults } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\Admin\PointOfSale\CashRegisterController::bcvRate
* @see app/Http/Controllers/Admin/PointOfSale/CashRegisterController.php:37
* @route '/admin/cajas/bcv-rate'
*/
export const bcvRate = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: bcvRate.url(options),
    method: 'get',
})

bcvRate.definition = {
    methods: ["get","head"],
    url: '/admin/cajas/bcv-rate',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\PointOfSale\CashRegisterController::bcvRate
* @see app/Http/Controllers/Admin/PointOfSale/CashRegisterController.php:37
* @route '/admin/cajas/bcv-rate'
*/
bcvRate.url = (options?: RouteQueryOptions) => {
    return bcvRate.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\PointOfSale\CashRegisterController::bcvRate
* @see app/Http/Controllers/Admin/PointOfSale/CashRegisterController.php:37
* @route '/admin/cajas/bcv-rate'
*/
bcvRate.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: bcvRate.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\PointOfSale\CashRegisterController::bcvRate
* @see app/Http/Controllers/Admin/PointOfSale/CashRegisterController.php:37
* @route '/admin/cajas/bcv-rate'
*/
bcvRate.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: bcvRate.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Admin\PointOfSale\CashRegisterController::index
* @see app/Http/Controllers/Admin/PointOfSale/CashRegisterController.php:54
* @route '/admin/cajas'
*/
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/admin/cajas',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\PointOfSale\CashRegisterController::index
* @see app/Http/Controllers/Admin/PointOfSale/CashRegisterController.php:54
* @route '/admin/cajas'
*/
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\PointOfSale\CashRegisterController::index
* @see app/Http/Controllers/Admin/PointOfSale/CashRegisterController.php:54
* @route '/admin/cajas'
*/
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\PointOfSale\CashRegisterController::index
* @see app/Http/Controllers/Admin/PointOfSale/CashRegisterController.php:54
* @route '/admin/cajas'
*/
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Admin\PointOfSale\CashRegisterController::store
* @see app/Http/Controllers/Admin/PointOfSale/CashRegisterController.php:84
* @route '/admin/cajas'
*/
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/admin/cajas',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\PointOfSale\CashRegisterController::store
* @see app/Http/Controllers/Admin/PointOfSale/CashRegisterController.php:84
* @route '/admin/cajas'
*/
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\PointOfSale\CashRegisterController::store
* @see app/Http/Controllers/Admin/PointOfSale/CashRegisterController.php:84
* @route '/admin/cajas'
*/
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\PointOfSale\CashRegisterController::show
* @see app/Http/Controllers/Admin/PointOfSale/CashRegisterController.php:115
* @route '/admin/cajas/{caja}'
*/
export const show = (args: { caja: number | { id: number } } | [caja: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/admin/cajas/{caja}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\PointOfSale\CashRegisterController::show
* @see app/Http/Controllers/Admin/PointOfSale/CashRegisterController.php:115
* @route '/admin/cajas/{caja}'
*/
show.url = (args: { caja: number | { id: number } } | [caja: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { caja: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { caja: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            caja: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        caja: typeof args.caja === 'object'
        ? args.caja.id
        : args.caja,
    }

    return show.definition.url
            .replace('{caja}', parsedArgs.caja.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\PointOfSale\CashRegisterController::show
* @see app/Http/Controllers/Admin/PointOfSale/CashRegisterController.php:115
* @route '/admin/cajas/{caja}'
*/
show.get = (args: { caja: number | { id: number } } | [caja: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\PointOfSale\CashRegisterController::show
* @see app/Http/Controllers/Admin/PointOfSale/CashRegisterController.php:115
* @route '/admin/cajas/{caja}'
*/
show.head = (args: { caja: number | { id: number } } | [caja: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Admin\PointOfSale\CashRegisterController::movement
* @see app/Http/Controllers/Admin/PointOfSale/CashRegisterController.php:167
* @route '/admin/cajas/{caja}/movement'
*/
export const movement = (args: { caja: number | { id: number } } | [caja: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: movement.url(args, options),
    method: 'post',
})

movement.definition = {
    methods: ["post"],
    url: '/admin/cajas/{caja}/movement',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\PointOfSale\CashRegisterController::movement
* @see app/Http/Controllers/Admin/PointOfSale/CashRegisterController.php:167
* @route '/admin/cajas/{caja}/movement'
*/
movement.url = (args: { caja: number | { id: number } } | [caja: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { caja: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { caja: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            caja: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        caja: typeof args.caja === 'object'
        ? args.caja.id
        : args.caja,
    }

    return movement.definition.url
            .replace('{caja}', parsedArgs.caja.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\PointOfSale\CashRegisterController::movement
* @see app/Http/Controllers/Admin/PointOfSale/CashRegisterController.php:167
* @route '/admin/cajas/{caja}/movement'
*/
movement.post = (args: { caja: number | { id: number } } | [caja: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: movement.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\PointOfSale\CashRegisterController::close
* @see app/Http/Controllers/Admin/PointOfSale/CashRegisterController.php:200
* @route '/admin/cajas/{caja}/close'
*/
export const close = (args: { caja: number | { id: number } } | [caja: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: close.url(args, options),
    method: 'post',
})

close.definition = {
    methods: ["post"],
    url: '/admin/cajas/{caja}/close',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\PointOfSale\CashRegisterController::close
* @see app/Http/Controllers/Admin/PointOfSale/CashRegisterController.php:200
* @route '/admin/cajas/{caja}/close'
*/
close.url = (args: { caja: number | { id: number } } | [caja: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { caja: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { caja: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            caja: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        caja: typeof args.caja === 'object'
        ? args.caja.id
        : args.caja,
    }

    return close.definition.url
            .replace('{caja}', parsedArgs.caja.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\PointOfSale\CashRegisterController::close
* @see app/Http/Controllers/Admin/PointOfSale/CashRegisterController.php:200
* @route '/admin/cajas/{caja}/close'
*/
close.post = (args: { caja: number | { id: number } } | [caja: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: close.url(args, options),
    method: 'post',
})

const cajas = {
    bcvRate: Object.assign(bcvRate, bcvRate),
    index: Object.assign(index, index),
    store: Object.assign(store, store),
    show: Object.assign(show, show),
    movement: Object.assign(movement, movement),
    close: Object.assign(close, close),
}

export default cajas
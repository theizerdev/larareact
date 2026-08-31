import { queryParams, type RouteQueryOptions, type RouteDefinition, applyUrlDefaults } from './../../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Admin\PointOfSale\CashRegisterController::getBcvRate
* @see app/Http/Controllers/Admin/PointOfSale/CashRegisterController.php:37
* @route '/admin/cajas/bcv-rate'
*/
export const getBcvRate = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getBcvRate.url(options),
    method: 'get',
})

getBcvRate.definition = {
    methods: ["get","head"],
    url: '/admin/cajas/bcv-rate',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\PointOfSale\CashRegisterController::getBcvRate
* @see app/Http/Controllers/Admin/PointOfSale/CashRegisterController.php:37
* @route '/admin/cajas/bcv-rate'
*/
getBcvRate.url = (options?: RouteQueryOptions) => {
    return getBcvRate.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\PointOfSale\CashRegisterController::getBcvRate
* @see app/Http/Controllers/Admin/PointOfSale/CashRegisterController.php:37
* @route '/admin/cajas/bcv-rate'
*/
getBcvRate.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getBcvRate.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\PointOfSale\CashRegisterController::getBcvRate
* @see app/Http/Controllers/Admin/PointOfSale/CashRegisterController.php:37
* @route '/admin/cajas/bcv-rate'
*/
getBcvRate.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: getBcvRate.url(options),
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
* @see \App\Http\Controllers\Admin\PointOfSale\CashRegisterController::addMovement
* @see app/Http/Controllers/Admin/PointOfSale/CashRegisterController.php:167
* @route '/admin/cajas/{caja}/movement'
*/
export const addMovement = (args: { caja: number | { id: number } } | [caja: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: addMovement.url(args, options),
    method: 'post',
})

addMovement.definition = {
    methods: ["post"],
    url: '/admin/cajas/{caja}/movement',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\PointOfSale\CashRegisterController::addMovement
* @see app/Http/Controllers/Admin/PointOfSale/CashRegisterController.php:167
* @route '/admin/cajas/{caja}/movement'
*/
addMovement.url = (args: { caja: number | { id: number } } | [caja: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
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

    return addMovement.definition.url
            .replace('{caja}', parsedArgs.caja.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\PointOfSale\CashRegisterController::addMovement
* @see app/Http/Controllers/Admin/PointOfSale/CashRegisterController.php:167
* @route '/admin/cajas/{caja}/movement'
*/
addMovement.post = (args: { caja: number | { id: number } } | [caja: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: addMovement.url(args, options),
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

const CashRegisterController = { getBcvRate, index, store, show, addMovement, close }

export default CashRegisterController
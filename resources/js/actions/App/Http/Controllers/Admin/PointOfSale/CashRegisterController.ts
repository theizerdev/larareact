import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../../../wayfinder'
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
* @see \App\Http\Controllers\Admin\PointOfSale\CashRegisterController::getBcvRate
* @see app/Http/Controllers/Admin/PointOfSale/CashRegisterController.php:37
* @route '/admin/cajas/bcv-rate'
*/
const getBcvRateForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: getBcvRate.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\PointOfSale\CashRegisterController::getBcvRate
* @see app/Http/Controllers/Admin/PointOfSale/CashRegisterController.php:37
* @route '/admin/cajas/bcv-rate'
*/
getBcvRateForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: getBcvRate.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\PointOfSale\CashRegisterController::getBcvRate
* @see app/Http/Controllers/Admin/PointOfSale/CashRegisterController.php:37
* @route '/admin/cajas/bcv-rate'
*/
getBcvRateForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: getBcvRate.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

getBcvRate.form = getBcvRateForm

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
* @see \App\Http\Controllers\Admin\PointOfSale\CashRegisterController::index
* @see app/Http/Controllers/Admin/PointOfSale/CashRegisterController.php:54
* @route '/admin/cajas'
*/
const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\PointOfSale\CashRegisterController::index
* @see app/Http/Controllers/Admin/PointOfSale/CashRegisterController.php:54
* @route '/admin/cajas'
*/
indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\PointOfSale\CashRegisterController::index
* @see app/Http/Controllers/Admin/PointOfSale/CashRegisterController.php:54
* @route '/admin/cajas'
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
* @see \App\Http\Controllers\Admin\PointOfSale\CashRegisterController::store
* @see app/Http/Controllers/Admin/PointOfSale/CashRegisterController.php:84
* @route '/admin/cajas'
*/
const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\PointOfSale\CashRegisterController::store
* @see app/Http/Controllers/Admin/PointOfSale/CashRegisterController.php:84
* @route '/admin/cajas'
*/
storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(options),
    method: 'post',
})

store.form = storeForm

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
* @see \App\Http\Controllers\Admin\PointOfSale\CashRegisterController::show
* @see app/Http/Controllers/Admin/PointOfSale/CashRegisterController.php:115
* @route '/admin/cajas/{caja}'
*/
const showForm = (args: { caja: number | { id: number } } | [caja: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\PointOfSale\CashRegisterController::show
* @see app/Http/Controllers/Admin/PointOfSale/CashRegisterController.php:115
* @route '/admin/cajas/{caja}'
*/
showForm.get = (args: { caja: number | { id: number } } | [caja: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\PointOfSale\CashRegisterController::show
* @see app/Http/Controllers/Admin/PointOfSale/CashRegisterController.php:115
* @route '/admin/cajas/{caja}'
*/
showForm.head = (args: { caja: number | { id: number } } | [caja: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

show.form = showForm

/**
* @see \App\Http\Controllers\Admin\PointOfSale\CashRegisterController::addMovement
* @see app/Http/Controllers/Admin/PointOfSale/CashRegisterController.php:162
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
* @see app/Http/Controllers/Admin/PointOfSale/CashRegisterController.php:162
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
* @see app/Http/Controllers/Admin/PointOfSale/CashRegisterController.php:162
* @route '/admin/cajas/{caja}/movement'
*/
addMovement.post = (args: { caja: number | { id: number } } | [caja: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: addMovement.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\PointOfSale\CashRegisterController::addMovement
* @see app/Http/Controllers/Admin/PointOfSale/CashRegisterController.php:162
* @route '/admin/cajas/{caja}/movement'
*/
const addMovementForm = (args: { caja: number | { id: number } } | [caja: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: addMovement.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\PointOfSale\CashRegisterController::addMovement
* @see app/Http/Controllers/Admin/PointOfSale/CashRegisterController.php:162
* @route '/admin/cajas/{caja}/movement'
*/
addMovementForm.post = (args: { caja: number | { id: number } } | [caja: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: addMovement.url(args, options),
    method: 'post',
})

addMovement.form = addMovementForm

/**
* @see \App\Http\Controllers\Admin\PointOfSale\CashRegisterController::close
* @see app/Http/Controllers/Admin/PointOfSale/CashRegisterController.php:199
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
* @see app/Http/Controllers/Admin/PointOfSale/CashRegisterController.php:199
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
* @see app/Http/Controllers/Admin/PointOfSale/CashRegisterController.php:199
* @route '/admin/cajas/{caja}/close'
*/
close.post = (args: { caja: number | { id: number } } | [caja: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: close.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\PointOfSale\CashRegisterController::close
* @see app/Http/Controllers/Admin/PointOfSale/CashRegisterController.php:199
* @route '/admin/cajas/{caja}/close'
*/
const closeForm = (args: { caja: number | { id: number } } | [caja: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: close.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\PointOfSale\CashRegisterController::close
* @see app/Http/Controllers/Admin/PointOfSale/CashRegisterController.php:199
* @route '/admin/cajas/{caja}/close'
*/
closeForm.post = (args: { caja: number | { id: number } } | [caja: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: close.url(args, options),
    method: 'post',
})

close.form = closeForm

const CashRegisterController = { getBcvRate, index, store, show, addMovement, close }

export default CashRegisterController
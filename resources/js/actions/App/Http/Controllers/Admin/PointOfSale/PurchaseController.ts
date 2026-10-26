import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Admin\PointOfSale\PurchaseController::accountsPayable
* @see app/Http/Controllers/Admin/PointOfSale/PurchaseController.php:225
* @route '/admin/cuentas-por-pagar'
*/
export const accountsPayable = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: accountsPayable.url(options),
    method: 'get',
})

accountsPayable.definition = {
    methods: ["get","head"],
    url: '/admin/cuentas-por-pagar',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\PointOfSale\PurchaseController::accountsPayable
* @see app/Http/Controllers/Admin/PointOfSale/PurchaseController.php:225
* @route '/admin/cuentas-por-pagar'
*/
accountsPayable.url = (options?: RouteQueryOptions) => {
    return accountsPayable.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\PointOfSale\PurchaseController::accountsPayable
* @see app/Http/Controllers/Admin/PointOfSale/PurchaseController.php:225
* @route '/admin/cuentas-por-pagar'
*/
accountsPayable.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: accountsPayable.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\PointOfSale\PurchaseController::accountsPayable
* @see app/Http/Controllers/Admin/PointOfSale/PurchaseController.php:225
* @route '/admin/cuentas-por-pagar'
*/
accountsPayable.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: accountsPayable.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Admin\PointOfSale\PurchaseController::accountsPayable
* @see app/Http/Controllers/Admin/PointOfSale/PurchaseController.php:225
* @route '/admin/cuentas-por-pagar'
*/
const accountsPayableForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: accountsPayable.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\PointOfSale\PurchaseController::accountsPayable
* @see app/Http/Controllers/Admin/PointOfSale/PurchaseController.php:225
* @route '/admin/cuentas-por-pagar'
*/
accountsPayableForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: accountsPayable.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\PointOfSale\PurchaseController::accountsPayable
* @see app/Http/Controllers/Admin/PointOfSale/PurchaseController.php:225
* @route '/admin/cuentas-por-pagar'
*/
accountsPayableForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: accountsPayable.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

accountsPayable.form = accountsPayableForm

/**
* @see \App\Http\Controllers\Admin\PointOfSale\PurchaseController::index
* @see app/Http/Controllers/Admin/PointOfSale/PurchaseController.php:43
* @route '/admin/compras'
*/
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/admin/compras',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\PointOfSale\PurchaseController::index
* @see app/Http/Controllers/Admin/PointOfSale/PurchaseController.php:43
* @route '/admin/compras'
*/
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\PointOfSale\PurchaseController::index
* @see app/Http/Controllers/Admin/PointOfSale/PurchaseController.php:43
* @route '/admin/compras'
*/
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\PointOfSale\PurchaseController::index
* @see app/Http/Controllers/Admin/PointOfSale/PurchaseController.php:43
* @route '/admin/compras'
*/
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Admin\PointOfSale\PurchaseController::index
* @see app/Http/Controllers/Admin/PointOfSale/PurchaseController.php:43
* @route '/admin/compras'
*/
const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\PointOfSale\PurchaseController::index
* @see app/Http/Controllers/Admin/PointOfSale/PurchaseController.php:43
* @route '/admin/compras'
*/
indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\PointOfSale\PurchaseController::index
* @see app/Http/Controllers/Admin/PointOfSale/PurchaseController.php:43
* @route '/admin/compras'
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
* @see \App\Http\Controllers\Admin\PointOfSale\PurchaseController::create
* @see app/Http/Controllers/Admin/PointOfSale/PurchaseController.php:91
* @route '/admin/compras/crear'
*/
export const create = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})

create.definition = {
    methods: ["get","head"],
    url: '/admin/compras/crear',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\PointOfSale\PurchaseController::create
* @see app/Http/Controllers/Admin/PointOfSale/PurchaseController.php:91
* @route '/admin/compras/crear'
*/
create.url = (options?: RouteQueryOptions) => {
    return create.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\PointOfSale\PurchaseController::create
* @see app/Http/Controllers/Admin/PointOfSale/PurchaseController.php:91
* @route '/admin/compras/crear'
*/
create.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\PointOfSale\PurchaseController::create
* @see app/Http/Controllers/Admin/PointOfSale/PurchaseController.php:91
* @route '/admin/compras/crear'
*/
create.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: create.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Admin\PointOfSale\PurchaseController::create
* @see app/Http/Controllers/Admin/PointOfSale/PurchaseController.php:91
* @route '/admin/compras/crear'
*/
const createForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: create.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\PointOfSale\PurchaseController::create
* @see app/Http/Controllers/Admin/PointOfSale/PurchaseController.php:91
* @route '/admin/compras/crear'
*/
createForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: create.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\PointOfSale\PurchaseController::create
* @see app/Http/Controllers/Admin/PointOfSale/PurchaseController.php:91
* @route '/admin/compras/crear'
*/
createForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: create.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

create.form = createForm

/**
* @see \App\Http\Controllers\Admin\PointOfSale\PurchaseController::store
* @see app/Http/Controllers/Admin/PointOfSale/PurchaseController.php:162
* @route '/admin/compras'
*/
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/admin/compras',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\PointOfSale\PurchaseController::store
* @see app/Http/Controllers/Admin/PointOfSale/PurchaseController.php:162
* @route '/admin/compras'
*/
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\PointOfSale\PurchaseController::store
* @see app/Http/Controllers/Admin/PointOfSale/PurchaseController.php:162
* @route '/admin/compras'
*/
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\PointOfSale\PurchaseController::store
* @see app/Http/Controllers/Admin/PointOfSale/PurchaseController.php:162
* @route '/admin/compras'
*/
const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\PointOfSale\PurchaseController::store
* @see app/Http/Controllers/Admin/PointOfSale/PurchaseController.php:162
* @route '/admin/compras'
*/
storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(options),
    method: 'post',
})

store.form = storeForm

/**
* @see \App\Http\Controllers\Admin\PointOfSale\PurchaseController::show
* @see app/Http/Controllers/Admin/PointOfSale/PurchaseController.php:172
* @route '/admin/compras/{compra}'
*/
export const show = (args: { compra: number | { id: number } } | [compra: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/admin/compras/{compra}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\PointOfSale\PurchaseController::show
* @see app/Http/Controllers/Admin/PointOfSale/PurchaseController.php:172
* @route '/admin/compras/{compra}'
*/
show.url = (args: { compra: number | { id: number } } | [compra: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { compra: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { compra: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            compra: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        compra: typeof args.compra === 'object'
        ? args.compra.id
        : args.compra,
    }

    return show.definition.url
            .replace('{compra}', parsedArgs.compra.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\PointOfSale\PurchaseController::show
* @see app/Http/Controllers/Admin/PointOfSale/PurchaseController.php:172
* @route '/admin/compras/{compra}'
*/
show.get = (args: { compra: number | { id: number } } | [compra: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\PointOfSale\PurchaseController::show
* @see app/Http/Controllers/Admin/PointOfSale/PurchaseController.php:172
* @route '/admin/compras/{compra}'
*/
show.head = (args: { compra: number | { id: number } } | [compra: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Admin\PointOfSale\PurchaseController::show
* @see app/Http/Controllers/Admin/PointOfSale/PurchaseController.php:172
* @route '/admin/compras/{compra}'
*/
const showForm = (args: { compra: number | { id: number } } | [compra: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\PointOfSale\PurchaseController::show
* @see app/Http/Controllers/Admin/PointOfSale/PurchaseController.php:172
* @route '/admin/compras/{compra}'
*/
showForm.get = (args: { compra: number | { id: number } } | [compra: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\PointOfSale\PurchaseController::show
* @see app/Http/Controllers/Admin/PointOfSale/PurchaseController.php:172
* @route '/admin/compras/{compra}'
*/
showForm.head = (args: { compra: number | { id: number } } | [compra: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
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
* @see \App\Http\Controllers\Admin\PointOfSale\PurchaseController::storePayment
* @see app/Http/Controllers/Admin/PointOfSale/PurchaseController.php:263
* @route '/admin/compras/{compra}/pagos'
*/
export const storePayment = (args: { compra: number | { id: number } } | [compra: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: storePayment.url(args, options),
    method: 'post',
})

storePayment.definition = {
    methods: ["post"],
    url: '/admin/compras/{compra}/pagos',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\PointOfSale\PurchaseController::storePayment
* @see app/Http/Controllers/Admin/PointOfSale/PurchaseController.php:263
* @route '/admin/compras/{compra}/pagos'
*/
storePayment.url = (args: { compra: number | { id: number } } | [compra: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { compra: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { compra: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            compra: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        compra: typeof args.compra === 'object'
        ? args.compra.id
        : args.compra,
    }

    return storePayment.definition.url
            .replace('{compra}', parsedArgs.compra.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\PointOfSale\PurchaseController::storePayment
* @see app/Http/Controllers/Admin/PointOfSale/PurchaseController.php:263
* @route '/admin/compras/{compra}/pagos'
*/
storePayment.post = (args: { compra: number | { id: number } } | [compra: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: storePayment.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\PointOfSale\PurchaseController::storePayment
* @see app/Http/Controllers/Admin/PointOfSale/PurchaseController.php:263
* @route '/admin/compras/{compra}/pagos'
*/
const storePaymentForm = (args: { compra: number | { id: number } } | [compra: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: storePayment.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\PointOfSale\PurchaseController::storePayment
* @see app/Http/Controllers/Admin/PointOfSale/PurchaseController.php:263
* @route '/admin/compras/{compra}/pagos'
*/
storePaymentForm.post = (args: { compra: number | { id: number } } | [compra: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: storePayment.url(args, options),
    method: 'post',
})

storePayment.form = storePaymentForm

/**
* @see \App\Http\Controllers\Admin\PointOfSale\PurchaseController::cancel
* @see app/Http/Controllers/Admin/PointOfSale/PurchaseController.php:218
* @route '/admin/compras/{compra}/cancel'
*/
export const cancel = (args: { compra: number | { id: number } } | [compra: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: cancel.url(args, options),
    method: 'post',
})

cancel.definition = {
    methods: ["post"],
    url: '/admin/compras/{compra}/cancel',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\PointOfSale\PurchaseController::cancel
* @see app/Http/Controllers/Admin/PointOfSale/PurchaseController.php:218
* @route '/admin/compras/{compra}/cancel'
*/
cancel.url = (args: { compra: number | { id: number } } | [compra: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { compra: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { compra: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            compra: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        compra: typeof args.compra === 'object'
        ? args.compra.id
        : args.compra,
    }

    return cancel.definition.url
            .replace('{compra}', parsedArgs.compra.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\PointOfSale\PurchaseController::cancel
* @see app/Http/Controllers/Admin/PointOfSale/PurchaseController.php:218
* @route '/admin/compras/{compra}/cancel'
*/
cancel.post = (args: { compra: number | { id: number } } | [compra: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: cancel.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\PointOfSale\PurchaseController::cancel
* @see app/Http/Controllers/Admin/PointOfSale/PurchaseController.php:218
* @route '/admin/compras/{compra}/cancel'
*/
const cancelForm = (args: { compra: number | { id: number } } | [compra: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: cancel.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\PointOfSale\PurchaseController::cancel
* @see app/Http/Controllers/Admin/PointOfSale/PurchaseController.php:218
* @route '/admin/compras/{compra}/cancel'
*/
cancelForm.post = (args: { compra: number | { id: number } } | [compra: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: cancel.url(args, options),
    method: 'post',
})

cancel.form = cancelForm

const PurchaseController = { accountsPayable, index, create, store, show, storePayment, cancel }

export default PurchaseController
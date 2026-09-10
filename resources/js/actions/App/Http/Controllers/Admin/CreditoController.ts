import { queryParams, type RouteQueryOptions, type RouteDefinition, applyUrlDefaults } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Admin\CreditoController::index
 * @see app/Http/Controllers/Admin/CreditoController.php:27
 * @route '/admin/creditos'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/admin/creditos',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\CreditoController::index
 * @see app/Http/Controllers/Admin/CreditoController.php:27
 * @route '/admin/creditos'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\CreditoController::index
 * @see app/Http/Controllers/Admin/CreditoController.php:27
 * @route '/admin/creditos'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Admin\CreditoController::index
 * @see app/Http/Controllers/Admin/CreditoController.php:27
 * @route '/admin/creditos'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Admin\CreditoController::create
 * @see app/Http/Controllers/Admin/CreditoController.php:88
 * @route '/admin/creditos/nuevo'
 */
export const create = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})

create.definition = {
    methods: ["get","head"],
    url: '/admin/creditos/nuevo',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\CreditoController::create
 * @see app/Http/Controllers/Admin/CreditoController.php:88
 * @route '/admin/creditos/nuevo'
 */
create.url = (options?: RouteQueryOptions) => {
    return create.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\CreditoController::create
 * @see app/Http/Controllers/Admin/CreditoController.php:88
 * @route '/admin/creditos/nuevo'
 */
create.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Admin\CreditoController::create
 * @see app/Http/Controllers/Admin/CreditoController.php:88
 * @route '/admin/creditos/nuevo'
 */
create.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: create.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Admin\CreditoController::simular
 * @see app/Http/Controllers/Admin/CreditoController.php:110
 * @route '/admin/creditos/simular'
 */
export const simular = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: simular.url(options),
    method: 'post',
})

simular.definition = {
    methods: ["post"],
    url: '/admin/creditos/simular',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\CreditoController::simular
 * @see app/Http/Controllers/Admin/CreditoController.php:110
 * @route '/admin/creditos/simular'
 */
simular.url = (options?: RouteQueryOptions) => {
    return simular.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\CreditoController::simular
 * @see app/Http/Controllers/Admin/CreditoController.php:110
 * @route '/admin/creditos/simular'
 */
simular.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: simular.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\CreditoController::store
 * @see app/Http/Controllers/Admin/CreditoController.php:141
 * @route '/admin/creditos'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/admin/creditos',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\CreditoController::store
 * @see app/Http/Controllers/Admin/CreditoController.php:141
 * @route '/admin/creditos'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\CreditoController::store
 * @see app/Http/Controllers/Admin/CreditoController.php:141
 * @route '/admin/creditos'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\CreditoController::show
 * @see app/Http/Controllers/Admin/CreditoController.php:242
 * @route '/admin/creditos/{credito}'
 */
export const show = (args: { credito: number | { id: number } } | [credito: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/admin/creditos/{credito}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\CreditoController::show
 * @see app/Http/Controllers/Admin/CreditoController.php:242
 * @route '/admin/creditos/{credito}'
 */
show.url = (args: { credito: number | { id: number } } | [credito: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { credito: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { credito: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    credito: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        credito: typeof args.credito === 'object'
                ? args.credito.id
                : args.credito,
                }

    return show.definition.url
            .replace('{credito}', parsedArgs.credito.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\CreditoController::show
 * @see app/Http/Controllers/Admin/CreditoController.php:242
 * @route '/admin/creditos/{credito}'
 */
show.get = (args: { credito: number | { id: number } } | [credito: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Admin\CreditoController::show
 * @see app/Http/Controllers/Admin/CreditoController.php:242
 * @route '/admin/creditos/{credito}'
 */
show.head = (args: { credito: number | { id: number } } | [credito: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Admin\CreditoController::pagarCuota
 * @see app/Http/Controllers/Admin/CreditoController.php:260
 * @route '/admin/cuotas/{cuota}/pagar'
 */
export const pagarCuota = (args: { cuota: number | { id: number } } | [cuota: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: pagarCuota.url(args, options),
    method: 'post',
})

pagarCuota.definition = {
    methods: ["post"],
    url: '/admin/cuotas/{cuota}/pagar',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\CreditoController::pagarCuota
 * @see app/Http/Controllers/Admin/CreditoController.php:260
 * @route '/admin/cuotas/{cuota}/pagar'
 */
pagarCuota.url = (args: { cuota: number | { id: number } } | [cuota: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { cuota: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { cuota: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    cuota: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        cuota: typeof args.cuota === 'object'
                ? args.cuota.id
                : args.cuota,
                }

    return pagarCuota.definition.url
            .replace('{cuota}', parsedArgs.cuota.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\CreditoController::pagarCuota
 * @see app/Http/Controllers/Admin/CreditoController.php:260
 * @route '/admin/cuotas/{cuota}/pagar'
 */
pagarCuota.post = (args: { cuota: number | { id: number } } | [cuota: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: pagarCuota.url(args, options),
    method: 'post',
})
const CreditoController = { index, create, simular, store, show, pagarCuota }

export default CreditoController
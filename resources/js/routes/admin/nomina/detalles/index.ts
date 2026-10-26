import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\Admin\NominaController::update
* @see app/Http/Controllers/Admin/NominaController.php:206
* @route '/admin/nomina/detalles/{detalle}'
*/
export const update = (args: { detalle: number | { id: number } } | [detalle: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

update.definition = {
    methods: ["put"],
    url: '/admin/nomina/detalles/{detalle}',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\Admin\NominaController::update
* @see app/Http/Controllers/Admin/NominaController.php:206
* @route '/admin/nomina/detalles/{detalle}'
*/
update.url = (args: { detalle: number | { id: number } } | [detalle: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { detalle: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { detalle: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            detalle: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        detalle: typeof args.detalle === 'object'
        ? args.detalle.id
        : args.detalle,
    }

    return update.definition.url
            .replace('{detalle}', parsedArgs.detalle.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\NominaController::update
* @see app/Http/Controllers/Admin/NominaController.php:206
* @route '/admin/nomina/detalles/{detalle}'
*/
update.put = (args: { detalle: number | { id: number } } | [detalle: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

/**
* @see \App\Http\Controllers\Admin\NominaController::update
* @see app/Http/Controllers/Admin/NominaController.php:206
* @route '/admin/nomina/detalles/{detalle}'
*/
const updateForm = (args: { detalle: number | { id: number } } | [detalle: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: update.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PUT',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\NominaController::update
* @see app/Http/Controllers/Admin/NominaController.php:206
* @route '/admin/nomina/detalles/{detalle}'
*/
updateForm.put = (args: { detalle: number | { id: number } } | [detalle: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: update.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PUT',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

update.form = updateForm

/**
* @see \App\Http\Controllers\Admin\NominaController::pagar
* @see app/Http/Controllers/Admin/NominaController.php:265
* @route '/admin/nomina/detalles/{detalle}/pagar'
*/
export const pagar = (args: { detalle: number | { id: number } } | [detalle: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: pagar.url(args, options),
    method: 'post',
})

pagar.definition = {
    methods: ["post"],
    url: '/admin/nomina/detalles/{detalle}/pagar',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\NominaController::pagar
* @see app/Http/Controllers/Admin/NominaController.php:265
* @route '/admin/nomina/detalles/{detalle}/pagar'
*/
pagar.url = (args: { detalle: number | { id: number } } | [detalle: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { detalle: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { detalle: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            detalle: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        detalle: typeof args.detalle === 'object'
        ? args.detalle.id
        : args.detalle,
    }

    return pagar.definition.url
            .replace('{detalle}', parsedArgs.detalle.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\NominaController::pagar
* @see app/Http/Controllers/Admin/NominaController.php:265
* @route '/admin/nomina/detalles/{detalle}/pagar'
*/
pagar.post = (args: { detalle: number | { id: number } } | [detalle: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: pagar.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\NominaController::pagar
* @see app/Http/Controllers/Admin/NominaController.php:265
* @route '/admin/nomina/detalles/{detalle}/pagar'
*/
const pagarForm = (args: { detalle: number | { id: number } } | [detalle: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: pagar.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\NominaController::pagar
* @see app/Http/Controllers/Admin/NominaController.php:265
* @route '/admin/nomina/detalles/{detalle}/pagar'
*/
pagarForm.post = (args: { detalle: number | { id: number } } | [detalle: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: pagar.url(args, options),
    method: 'post',
})

pagar.form = pagarForm

const detalles = {
    update: Object.assign(update, update),
    pagar: Object.assign(pagar, pagar),
}

export default detalles
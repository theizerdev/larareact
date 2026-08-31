import { queryParams, type RouteQueryOptions, type RouteDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\Admin\CreditConfigController::id
* @see app/Http/Controllers/Admin/CreditConfigController.php:47
* @route '/admin/credit-config/{id}'
*/
export const id = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: id.url(args, options),
    method: 'put',
})

id.definition = {
    methods: ["put"],
    url: '/admin/credit-config/{id}',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\Admin\CreditConfigController::id
* @see app/Http/Controllers/Admin/CreditConfigController.php:47
* @route '/admin/credit-config/{id}'
*/
id.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { id: args }
    }

    if (Array.isArray(args)) {
        args = {
            id: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        id: args.id,
    }

    return id.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\CreditConfigController::id
* @see app/Http/Controllers/Admin/CreditConfigController.php:47
* @route '/admin/credit-config/{id}'
*/
id.put = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: id.url(args, options),
    method: 'put',
})

const update = {
    id: Object.assign(id, id),
}

export default update
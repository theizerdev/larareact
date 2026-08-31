import { queryParams, type RouteQueryOptions, type RouteDefinition } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\Admin\IntegrationController::index
* @see app/Http/Controllers/Admin/IntegrationController.php:797
* @route '/admin/integrations/validaciones'
*/
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/admin/integrations/validaciones',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\IntegrationController::index
* @see app/Http/Controllers/Admin/IntegrationController.php:797
* @route '/admin/integrations/validaciones'
*/
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\IntegrationController::index
* @see app/Http/Controllers/Admin/IntegrationController.php:797
* @route '/admin/integrations/validaciones'
*/
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\IntegrationController::index
* @see app/Http/Controllers/Admin/IntegrationController.php:797
* @route '/admin/integrations/validaciones'
*/
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

const validaciones = {
    index: Object.assign(index, index),
}

export default validaciones
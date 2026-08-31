import { queryParams, type RouteQueryOptions, type RouteDefinition } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\Admin\IntegrationController::update
* @see app/Http/Controllers/Admin/IntegrationController.php:151
* @route '/admin/integrations/google-maps'
*/
export const update = (options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(options),
    method: 'put',
})

update.definition = {
    methods: ["put"],
    url: '/admin/integrations/google-maps',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\Admin\IntegrationController::update
* @see app/Http/Controllers/Admin/IntegrationController.php:151
* @route '/admin/integrations/google-maps'
*/
update.url = (options?: RouteQueryOptions) => {
    return update.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\IntegrationController::update
* @see app/Http/Controllers/Admin/IntegrationController.php:151
* @route '/admin/integrations/google-maps'
*/
update.put = (options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(options),
    method: 'put',
})

const googleMaps = {
    update: Object.assign(update, update),
}

export default googleMaps
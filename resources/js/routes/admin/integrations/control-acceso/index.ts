import { queryParams, type RouteQueryOptions, type RouteDefinition } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\Admin\IntegrationController::update
* @see app/Http/Controllers/Admin/IntegrationController.php:181
* @route '/admin/integrations/control-acceso'
*/
export const update = (options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(options),
    method: 'put',
})

update.definition = {
    methods: ["put"],
    url: '/admin/integrations/control-acceso',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\Admin\IntegrationController::update
* @see app/Http/Controllers/Admin/IntegrationController.php:181
* @route '/admin/integrations/control-acceso'
*/
update.url = (options?: RouteQueryOptions) => {
    return update.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\IntegrationController::update
* @see app/Http/Controllers/Admin/IntegrationController.php:181
* @route '/admin/integrations/control-acceso'
*/
update.put = (options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(options),
    method: 'put',
})

/**
* @see \App\Http\Controllers\Admin\IntegrationController::test
* @see app/Http/Controllers/Admin/IntegrationController.php:215
* @route '/admin/integrations/control-acceso/test'
*/
export const test = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: test.url(options),
    method: 'post',
})

test.definition = {
    methods: ["post"],
    url: '/admin/integrations/control-acceso/test',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\IntegrationController::test
* @see app/Http/Controllers/Admin/IntegrationController.php:215
* @route '/admin/integrations/control-acceso/test'
*/
test.url = (options?: RouteQueryOptions) => {
    return test.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\IntegrationController::test
* @see app/Http/Controllers/Admin/IntegrationController.php:215
* @route '/admin/integrations/control-acceso/test'
*/
test.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: test.url(options),
    method: 'post',
})

const controlAcceso = {
    update: Object.assign(update, update),
    test: Object.assign(test, test),
}

export default controlAcceso
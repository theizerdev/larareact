import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\Admin\IntegrationController::map
 * @see app/Http/Controllers/Admin/IntegrationController.php:49
 * @route '/admin/integrations/map'
 */
export const map = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: map.url(options),
    method: 'get',
})

map.definition = {
    methods: ["get","head"],
    url: '/admin/integrations/map',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\IntegrationController::map
 * @see app/Http/Controllers/Admin/IntegrationController.php:49
 * @route '/admin/integrations/map'
 */
map.url = (options?: RouteQueryOptions) => {
    return map.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\IntegrationController::map
 * @see app/Http/Controllers/Admin/IntegrationController.php:49
 * @route '/admin/integrations/map'
 */
map.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: map.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Admin\IntegrationController::map
 * @see app/Http/Controllers/Admin/IntegrationController.php:49
 * @route '/admin/integrations/map'
 */
map.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: map.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Admin\IntegrationController::map
 * @see app/Http/Controllers/Admin/IntegrationController.php:49
 * @route '/admin/integrations/map'
 */
    const mapForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: map.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Admin\IntegrationController::map
 * @see app/Http/Controllers/Admin/IntegrationController.php:49
 * @route '/admin/integrations/map'
 */
        mapForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: map.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Admin\IntegrationController::map
 * @see app/Http/Controllers/Admin/IntegrationController.php:49
 * @route '/admin/integrations/map'
 */
        mapForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: map.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    map.form = mapForm
/**
* @see \App\Http\Controllers\Admin\IntegrationController::navigation
 * @see app/Http/Controllers/Admin/IntegrationController.php:71
 * @route '/admin/integrations/map/navigation'
 */
export const navigation = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: navigation.url(options),
    method: 'get',
})

navigation.definition = {
    methods: ["get","head"],
    url: '/admin/integrations/map/navigation',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\IntegrationController::navigation
 * @see app/Http/Controllers/Admin/IntegrationController.php:71
 * @route '/admin/integrations/map/navigation'
 */
navigation.url = (options?: RouteQueryOptions) => {
    return navigation.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\IntegrationController::navigation
 * @see app/Http/Controllers/Admin/IntegrationController.php:71
 * @route '/admin/integrations/map/navigation'
 */
navigation.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: navigation.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Admin\IntegrationController::navigation
 * @see app/Http/Controllers/Admin/IntegrationController.php:71
 * @route '/admin/integrations/map/navigation'
 */
navigation.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: navigation.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Admin\IntegrationController::navigation
 * @see app/Http/Controllers/Admin/IntegrationController.php:71
 * @route '/admin/integrations/map/navigation'
 */
    const navigationForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: navigation.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Admin\IntegrationController::navigation
 * @see app/Http/Controllers/Admin/IntegrationController.php:71
 * @route '/admin/integrations/map/navigation'
 */
        navigationForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: navigation.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Admin\IntegrationController::navigation
 * @see app/Http/Controllers/Admin/IntegrationController.php:71
 * @route '/admin/integrations/map/navigation'
 */
        navigationForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: navigation.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    navigation.form = navigationForm
/**
* @see \App\Http\Controllers\Admin\IntegrationController::update
 * @see app/Http/Controllers/Admin/IntegrationController.php:93
 * @route '/admin/integrations/mapbox'
 */
export const update = (options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(options),
    method: 'put',
})

update.definition = {
    methods: ["put"],
    url: '/admin/integrations/mapbox',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\Admin\IntegrationController::update
 * @see app/Http/Controllers/Admin/IntegrationController.php:93
 * @route '/admin/integrations/mapbox'
 */
update.url = (options?: RouteQueryOptions) => {
    return update.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\IntegrationController::update
 * @see app/Http/Controllers/Admin/IntegrationController.php:93
 * @route '/admin/integrations/mapbox'
 */
update.put = (options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(options),
    method: 'put',
})

    /**
* @see \App\Http\Controllers\Admin\IntegrationController::update
 * @see app/Http/Controllers/Admin/IntegrationController.php:93
 * @route '/admin/integrations/mapbox'
 */
    const updateForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: update.url({
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PUT',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\IntegrationController::update
 * @see app/Http/Controllers/Admin/IntegrationController.php:93
 * @route '/admin/integrations/mapbox'
 */
        updateForm.put = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: update.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PUT',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    update.form = updateForm
const mapbox = {
    map: Object.assign(map, map),
navigation: Object.assign(navigation, navigation),
update: Object.assign(update, update),
}

export default mapbox
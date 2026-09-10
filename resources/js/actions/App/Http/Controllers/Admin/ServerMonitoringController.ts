import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Admin\ServerMonitoringController::index
 * @see app/Http/Controllers/Admin/ServerMonitoringController.php:12
 * @route '/admin/monitoring/server'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/admin/monitoring/server',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\ServerMonitoringController::index
 * @see app/Http/Controllers/Admin/ServerMonitoringController.php:12
 * @route '/admin/monitoring/server'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ServerMonitoringController::index
 * @see app/Http/Controllers/Admin/ServerMonitoringController.php:12
 * @route '/admin/monitoring/server'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Admin\ServerMonitoringController::index
 * @see app/Http/Controllers/Admin/ServerMonitoringController.php:12
 * @route '/admin/monitoring/server'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Admin\ServerMonitoringController::index
 * @see app/Http/Controllers/Admin/ServerMonitoringController.php:12
 * @route '/admin/monitoring/server'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Admin\ServerMonitoringController::index
 * @see app/Http/Controllers/Admin/ServerMonitoringController.php:12
 * @route '/admin/monitoring/server'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Admin\ServerMonitoringController::index
 * @see app/Http/Controllers/Admin/ServerMonitoringController.php:12
 * @route '/admin/monitoring/server'
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
* @see \App\Http\Controllers\Admin\ServerMonitoringController::getMetrics
 * @see app/Http/Controllers/Admin/ServerMonitoringController.php:46
 * @route '/admin/monitoring/server/metrics'
 */
export const getMetrics = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getMetrics.url(options),
    method: 'get',
})

getMetrics.definition = {
    methods: ["get","head"],
    url: '/admin/monitoring/server/metrics',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\ServerMonitoringController::getMetrics
 * @see app/Http/Controllers/Admin/ServerMonitoringController.php:46
 * @route '/admin/monitoring/server/metrics'
 */
getMetrics.url = (options?: RouteQueryOptions) => {
    return getMetrics.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ServerMonitoringController::getMetrics
 * @see app/Http/Controllers/Admin/ServerMonitoringController.php:46
 * @route '/admin/monitoring/server/metrics'
 */
getMetrics.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getMetrics.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Admin\ServerMonitoringController::getMetrics
 * @see app/Http/Controllers/Admin/ServerMonitoringController.php:46
 * @route '/admin/monitoring/server/metrics'
 */
getMetrics.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: getMetrics.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Admin\ServerMonitoringController::getMetrics
 * @see app/Http/Controllers/Admin/ServerMonitoringController.php:46
 * @route '/admin/monitoring/server/metrics'
 */
    const getMetricsForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: getMetrics.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Admin\ServerMonitoringController::getMetrics
 * @see app/Http/Controllers/Admin/ServerMonitoringController.php:46
 * @route '/admin/monitoring/server/metrics'
 */
        getMetricsForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getMetrics.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Admin\ServerMonitoringController::getMetrics
 * @see app/Http/Controllers/Admin/ServerMonitoringController.php:46
 * @route '/admin/monitoring/server/metrics'
 */
        getMetricsForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getMetrics.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    getMetrics.form = getMetricsForm
const ServerMonitoringController = { index, getMetrics }

export default ServerMonitoringController
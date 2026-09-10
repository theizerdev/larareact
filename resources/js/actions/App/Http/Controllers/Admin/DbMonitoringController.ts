import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Admin\DbMonitoringController::index
 * @see app/Http/Controllers/Admin/DbMonitoringController.php:15
 * @route '/admin/monitoring/database'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/admin/monitoring/database',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\DbMonitoringController::index
 * @see app/Http/Controllers/Admin/DbMonitoringController.php:15
 * @route '/admin/monitoring/database'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\DbMonitoringController::index
 * @see app/Http/Controllers/Admin/DbMonitoringController.php:15
 * @route '/admin/monitoring/database'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Admin\DbMonitoringController::index
 * @see app/Http/Controllers/Admin/DbMonitoringController.php:15
 * @route '/admin/monitoring/database'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Admin\DbMonitoringController::index
 * @see app/Http/Controllers/Admin/DbMonitoringController.php:15
 * @route '/admin/monitoring/database'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Admin\DbMonitoringController::index
 * @see app/Http/Controllers/Admin/DbMonitoringController.php:15
 * @route '/admin/monitoring/database'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Admin\DbMonitoringController::index
 * @see app/Http/Controllers/Admin/DbMonitoringController.php:15
 * @route '/admin/monitoring/database'
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
* @see \App\Http\Controllers\Admin\DbMonitoringController::getMetrics
 * @see app/Http/Controllers/Admin/DbMonitoringController.php:98
 * @route '/admin/monitoring/database/metrics'
 */
export const getMetrics = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getMetrics.url(options),
    method: 'get',
})

getMetrics.definition = {
    methods: ["get","head"],
    url: '/admin/monitoring/database/metrics',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\DbMonitoringController::getMetrics
 * @see app/Http/Controllers/Admin/DbMonitoringController.php:98
 * @route '/admin/monitoring/database/metrics'
 */
getMetrics.url = (options?: RouteQueryOptions) => {
    return getMetrics.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\DbMonitoringController::getMetrics
 * @see app/Http/Controllers/Admin/DbMonitoringController.php:98
 * @route '/admin/monitoring/database/metrics'
 */
getMetrics.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getMetrics.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Admin\DbMonitoringController::getMetrics
 * @see app/Http/Controllers/Admin/DbMonitoringController.php:98
 * @route '/admin/monitoring/database/metrics'
 */
getMetrics.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: getMetrics.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Admin\DbMonitoringController::getMetrics
 * @see app/Http/Controllers/Admin/DbMonitoringController.php:98
 * @route '/admin/monitoring/database/metrics'
 */
    const getMetricsForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: getMetrics.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Admin\DbMonitoringController::getMetrics
 * @see app/Http/Controllers/Admin/DbMonitoringController.php:98
 * @route '/admin/monitoring/database/metrics'
 */
        getMetricsForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getMetrics.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Admin\DbMonitoringController::getMetrics
 * @see app/Http/Controllers/Admin/DbMonitoringController.php:98
 * @route '/admin/monitoring/database/metrics'
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
const DbMonitoringController = { index, getMetrics }

export default DbMonitoringController
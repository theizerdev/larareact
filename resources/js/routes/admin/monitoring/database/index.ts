import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../wayfinder'
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
* @see \App\Http\Controllers\Admin\DbMonitoringController::metrics
 * @see app/Http/Controllers/Admin/DbMonitoringController.php:98
 * @route '/admin/monitoring/database/metrics'
 */
export const metrics = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: metrics.url(options),
    method: 'get',
})

metrics.definition = {
    methods: ["get","head"],
    url: '/admin/monitoring/database/metrics',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\DbMonitoringController::metrics
 * @see app/Http/Controllers/Admin/DbMonitoringController.php:98
 * @route '/admin/monitoring/database/metrics'
 */
metrics.url = (options?: RouteQueryOptions) => {
    return metrics.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\DbMonitoringController::metrics
 * @see app/Http/Controllers/Admin/DbMonitoringController.php:98
 * @route '/admin/monitoring/database/metrics'
 */
metrics.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: metrics.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Admin\DbMonitoringController::metrics
 * @see app/Http/Controllers/Admin/DbMonitoringController.php:98
 * @route '/admin/monitoring/database/metrics'
 */
metrics.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: metrics.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Admin\DbMonitoringController::metrics
 * @see app/Http/Controllers/Admin/DbMonitoringController.php:98
 * @route '/admin/monitoring/database/metrics'
 */
    const metricsForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: metrics.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Admin\DbMonitoringController::metrics
 * @see app/Http/Controllers/Admin/DbMonitoringController.php:98
 * @route '/admin/monitoring/database/metrics'
 */
        metricsForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: metrics.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Admin\DbMonitoringController::metrics
 * @see app/Http/Controllers/Admin/DbMonitoringController.php:98
 * @route '/admin/monitoring/database/metrics'
 */
        metricsForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: metrics.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    metrics.form = metricsForm
const database = {
    index: Object.assign(index, index),
metrics: Object.assign(metrics, metrics),
}

export default database
import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Admin\LogMonitoringController::index
 * @see app/Http/Controllers/Admin/LogMonitoringController.php:15
 * @route '/admin/monitoring/logs'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/admin/monitoring/logs',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\LogMonitoringController::index
 * @see app/Http/Controllers/Admin/LogMonitoringController.php:15
 * @route '/admin/monitoring/logs'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\LogMonitoringController::index
 * @see app/Http/Controllers/Admin/LogMonitoringController.php:15
 * @route '/admin/monitoring/logs'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Admin\LogMonitoringController::index
 * @see app/Http/Controllers/Admin/LogMonitoringController.php:15
 * @route '/admin/monitoring/logs'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Admin\LogMonitoringController::index
 * @see app/Http/Controllers/Admin/LogMonitoringController.php:15
 * @route '/admin/monitoring/logs'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Admin\LogMonitoringController::index
 * @see app/Http/Controllers/Admin/LogMonitoringController.php:15
 * @route '/admin/monitoring/logs'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Admin\LogMonitoringController::index
 * @see app/Http/Controllers/Admin/LogMonitoringController.php:15
 * @route '/admin/monitoring/logs'
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
* @see \App\Http\Controllers\Admin\LogMonitoringController::clear
 * @see app/Http/Controllers/Admin/LogMonitoringController.php:35
 * @route '/admin/monitoring/logs/clear'
 */
export const clear = (options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: clear.url(options),
    method: 'delete',
})

clear.definition = {
    methods: ["delete"],
    url: '/admin/monitoring/logs/clear',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\Admin\LogMonitoringController::clear
 * @see app/Http/Controllers/Admin/LogMonitoringController.php:35
 * @route '/admin/monitoring/logs/clear'
 */
clear.url = (options?: RouteQueryOptions) => {
    return clear.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\LogMonitoringController::clear
 * @see app/Http/Controllers/Admin/LogMonitoringController.php:35
 * @route '/admin/monitoring/logs/clear'
 */
clear.delete = (options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: clear.url(options),
    method: 'delete',
})

    /**
* @see \App\Http\Controllers\Admin\LogMonitoringController::clear
 * @see app/Http/Controllers/Admin/LogMonitoringController.php:35
 * @route '/admin/monitoring/logs/clear'
 */
    const clearForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: clear.url({
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'DELETE',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\LogMonitoringController::clear
 * @see app/Http/Controllers/Admin/LogMonitoringController.php:35
 * @route '/admin/monitoring/logs/clear'
 */
        clearForm.delete = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: clear.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'DELETE',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    clear.form = clearForm
/**
* @see \App\Http\Controllers\Admin\LogMonitoringController::download
 * @see app/Http/Controllers/Admin/LogMonitoringController.php:52
 * @route '/admin/monitoring/logs/download'
 */
export const download = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: download.url(options),
    method: 'get',
})

download.definition = {
    methods: ["get","head"],
    url: '/admin/monitoring/logs/download',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\LogMonitoringController::download
 * @see app/Http/Controllers/Admin/LogMonitoringController.php:52
 * @route '/admin/monitoring/logs/download'
 */
download.url = (options?: RouteQueryOptions) => {
    return download.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\LogMonitoringController::download
 * @see app/Http/Controllers/Admin/LogMonitoringController.php:52
 * @route '/admin/monitoring/logs/download'
 */
download.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: download.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Admin\LogMonitoringController::download
 * @see app/Http/Controllers/Admin/LogMonitoringController.php:52
 * @route '/admin/monitoring/logs/download'
 */
download.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: download.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Admin\LogMonitoringController::download
 * @see app/Http/Controllers/Admin/LogMonitoringController.php:52
 * @route '/admin/monitoring/logs/download'
 */
    const downloadForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: download.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Admin\LogMonitoringController::download
 * @see app/Http/Controllers/Admin/LogMonitoringController.php:52
 * @route '/admin/monitoring/logs/download'
 */
        downloadForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: download.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Admin\LogMonitoringController::download
 * @see app/Http/Controllers/Admin/LogMonitoringController.php:52
 * @route '/admin/monitoring/logs/download'
 */
        downloadForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: download.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    download.form = downloadForm
const LogMonitoringController = { index, clear, download }

export default LogMonitoringController
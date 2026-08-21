import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Admin\QueueMonitoringController::index
 * @see app/Http/Controllers/Admin/QueueMonitoringController.php:14
 * @route '/admin/monitoring/queues'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/admin/monitoring/queues',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\QueueMonitoringController::index
 * @see app/Http/Controllers/Admin/QueueMonitoringController.php:14
 * @route '/admin/monitoring/queues'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\QueueMonitoringController::index
 * @see app/Http/Controllers/Admin/QueueMonitoringController.php:14
 * @route '/admin/monitoring/queues'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Admin\QueueMonitoringController::index
 * @see app/Http/Controllers/Admin/QueueMonitoringController.php:14
 * @route '/admin/monitoring/queues'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Admin\QueueMonitoringController::index
 * @see app/Http/Controllers/Admin/QueueMonitoringController.php:14
 * @route '/admin/monitoring/queues'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Admin\QueueMonitoringController::index
 * @see app/Http/Controllers/Admin/QueueMonitoringController.php:14
 * @route '/admin/monitoring/queues'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Admin\QueueMonitoringController::index
 * @see app/Http/Controllers/Admin/QueueMonitoringController.php:14
 * @route '/admin/monitoring/queues'
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
* @see \App\Http\Controllers\Admin\QueueMonitoringController::retryAll
 * @see app/Http/Controllers/Admin/QueueMonitoringController.php:81
 * @route '/admin/monitoring/queues/retry-all'
 */
export const retryAll = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: retryAll.url(options),
    method: 'post',
})

retryAll.definition = {
    methods: ["post"],
    url: '/admin/monitoring/queues/retry-all',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\QueueMonitoringController::retryAll
 * @see app/Http/Controllers/Admin/QueueMonitoringController.php:81
 * @route '/admin/monitoring/queues/retry-all'
 */
retryAll.url = (options?: RouteQueryOptions) => {
    return retryAll.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\QueueMonitoringController::retryAll
 * @see app/Http/Controllers/Admin/QueueMonitoringController.php:81
 * @route '/admin/monitoring/queues/retry-all'
 */
retryAll.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: retryAll.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Admin\QueueMonitoringController::retryAll
 * @see app/Http/Controllers/Admin/QueueMonitoringController.php:81
 * @route '/admin/monitoring/queues/retry-all'
 */
    const retryAllForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: retryAll.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\QueueMonitoringController::retryAll
 * @see app/Http/Controllers/Admin/QueueMonitoringController.php:81
 * @route '/admin/monitoring/queues/retry-all'
 */
        retryAllForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: retryAll.url(options),
            method: 'post',
        })
    
    retryAll.form = retryAllForm
/**
* @see \App\Http\Controllers\Admin\QueueMonitoringController::retry
 * @see app/Http/Controllers/Admin/QueueMonitoringController.php:68
 * @route '/admin/monitoring/queues/{id}/retry'
 */
export const retry = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: retry.url(args, options),
    method: 'post',
})

retry.definition = {
    methods: ["post"],
    url: '/admin/monitoring/queues/{id}/retry',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\QueueMonitoringController::retry
 * @see app/Http/Controllers/Admin/QueueMonitoringController.php:68
 * @route '/admin/monitoring/queues/{id}/retry'
 */
retry.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return retry.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\QueueMonitoringController::retry
 * @see app/Http/Controllers/Admin/QueueMonitoringController.php:68
 * @route '/admin/monitoring/queues/{id}/retry'
 */
retry.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: retry.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Admin\QueueMonitoringController::retry
 * @see app/Http/Controllers/Admin/QueueMonitoringController.php:68
 * @route '/admin/monitoring/queues/{id}/retry'
 */
    const retryForm = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: retry.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\QueueMonitoringController::retry
 * @see app/Http/Controllers/Admin/QueueMonitoringController.php:68
 * @route '/admin/monitoring/queues/{id}/retry'
 */
        retryForm.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: retry.url(args, options),
            method: 'post',
        })
    
    retry.form = retryForm
/**
* @see \App\Http\Controllers\Admin\QueueMonitoringController::destroyAll
 * @see app/Http/Controllers/Admin/QueueMonitoringController.php:107
 * @route '/admin/monitoring/queues/clear-all'
 */
export const destroyAll = (options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroyAll.url(options),
    method: 'delete',
})

destroyAll.definition = {
    methods: ["delete"],
    url: '/admin/monitoring/queues/clear-all',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\Admin\QueueMonitoringController::destroyAll
 * @see app/Http/Controllers/Admin/QueueMonitoringController.php:107
 * @route '/admin/monitoring/queues/clear-all'
 */
destroyAll.url = (options?: RouteQueryOptions) => {
    return destroyAll.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\QueueMonitoringController::destroyAll
 * @see app/Http/Controllers/Admin/QueueMonitoringController.php:107
 * @route '/admin/monitoring/queues/clear-all'
 */
destroyAll.delete = (options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroyAll.url(options),
    method: 'delete',
})

    /**
* @see \App\Http\Controllers\Admin\QueueMonitoringController::destroyAll
 * @see app/Http/Controllers/Admin/QueueMonitoringController.php:107
 * @route '/admin/monitoring/queues/clear-all'
 */
    const destroyAllForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: destroyAll.url({
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'DELETE',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\QueueMonitoringController::destroyAll
 * @see app/Http/Controllers/Admin/QueueMonitoringController.php:107
 * @route '/admin/monitoring/queues/clear-all'
 */
        destroyAllForm.delete = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: destroyAll.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'DELETE',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    destroyAll.form = destroyAllForm
/**
* @see \App\Http\Controllers\Admin\QueueMonitoringController::destroy
 * @see app/Http/Controllers/Admin/QueueMonitoringController.php:94
 * @route '/admin/monitoring/queues/{id}'
 */
export const destroy = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/admin/monitoring/queues/{id}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\Admin\QueueMonitoringController::destroy
 * @see app/Http/Controllers/Admin/QueueMonitoringController.php:94
 * @route '/admin/monitoring/queues/{id}'
 */
destroy.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return destroy.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\QueueMonitoringController::destroy
 * @see app/Http/Controllers/Admin/QueueMonitoringController.php:94
 * @route '/admin/monitoring/queues/{id}'
 */
destroy.delete = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

    /**
* @see \App\Http\Controllers\Admin\QueueMonitoringController::destroy
 * @see app/Http/Controllers/Admin/QueueMonitoringController.php:94
 * @route '/admin/monitoring/queues/{id}'
 */
    const destroyForm = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: destroy.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'DELETE',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\QueueMonitoringController::destroy
 * @see app/Http/Controllers/Admin/QueueMonitoringController.php:94
 * @route '/admin/monitoring/queues/{id}'
 */
        destroyForm.delete = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: destroy.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'DELETE',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    destroy.form = destroyForm
const QueueMonitoringController = { index, retryAll, retry, destroyAll, destroy }

export default QueueMonitoringController
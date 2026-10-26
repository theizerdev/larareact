import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Admin\DbMonitoringController::index
* @see app/Http/Controllers/Admin/DbMonitoringController.php:16
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
* @see app/Http/Controllers/Admin/DbMonitoringController.php:16
* @route '/admin/monitoring/database'
*/
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\DbMonitoringController::index
* @see app/Http/Controllers/Admin/DbMonitoringController.php:16
* @route '/admin/monitoring/database'
*/
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\DbMonitoringController::index
* @see app/Http/Controllers/Admin/DbMonitoringController.php:16
* @route '/admin/monitoring/database'
*/
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Admin\DbMonitoringController::index
* @see app/Http/Controllers/Admin/DbMonitoringController.php:16
* @route '/admin/monitoring/database'
*/
const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\DbMonitoringController::index
* @see app/Http/Controllers/Admin/DbMonitoringController.php:16
* @route '/admin/monitoring/database'
*/
indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\DbMonitoringController::index
* @see app/Http/Controllers/Admin/DbMonitoringController.php:16
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
* @see app/Http/Controllers/Admin/DbMonitoringController.php:108
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
* @see app/Http/Controllers/Admin/DbMonitoringController.php:108
* @route '/admin/monitoring/database/metrics'
*/
getMetrics.url = (options?: RouteQueryOptions) => {
    return getMetrics.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\DbMonitoringController::getMetrics
* @see app/Http/Controllers/Admin/DbMonitoringController.php:108
* @route '/admin/monitoring/database/metrics'
*/
getMetrics.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getMetrics.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\DbMonitoringController::getMetrics
* @see app/Http/Controllers/Admin/DbMonitoringController.php:108
* @route '/admin/monitoring/database/metrics'
*/
getMetrics.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: getMetrics.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Admin\DbMonitoringController::getMetrics
* @see app/Http/Controllers/Admin/DbMonitoringController.php:108
* @route '/admin/monitoring/database/metrics'
*/
const getMetricsForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: getMetrics.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\DbMonitoringController::getMetrics
* @see app/Http/Controllers/Admin/DbMonitoringController.php:108
* @route '/admin/monitoring/database/metrics'
*/
getMetricsForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: getMetrics.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\DbMonitoringController::getMetrics
* @see app/Http/Controllers/Admin/DbMonitoringController.php:108
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

/**
* @see \App\Http\Controllers\Admin\DbMonitoringController::exportPreview
* @see app/Http/Controllers/Admin/DbMonitoringController.php:323
* @route '/admin/monitoring/database/export/preview'
*/
export const exportPreview = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: exportPreview.url(options),
    method: 'post',
})

exportPreview.definition = {
    methods: ["post"],
    url: '/admin/monitoring/database/export/preview',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\DbMonitoringController::exportPreview
* @see app/Http/Controllers/Admin/DbMonitoringController.php:323
* @route '/admin/monitoring/database/export/preview'
*/
exportPreview.url = (options?: RouteQueryOptions) => {
    return exportPreview.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\DbMonitoringController::exportPreview
* @see app/Http/Controllers/Admin/DbMonitoringController.php:323
* @route '/admin/monitoring/database/export/preview'
*/
exportPreview.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: exportPreview.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\DbMonitoringController::exportPreview
* @see app/Http/Controllers/Admin/DbMonitoringController.php:323
* @route '/admin/monitoring/database/export/preview'
*/
const exportPreviewForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: exportPreview.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\DbMonitoringController::exportPreview
* @see app/Http/Controllers/Admin/DbMonitoringController.php:323
* @route '/admin/monitoring/database/export/preview'
*/
exportPreviewForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: exportPreview.url(options),
    method: 'post',
})

exportPreview.form = exportPreviewForm

/**
* @see \App\Http\Controllers\Admin\DbMonitoringController::confirmPassword
* @see app/Http/Controllers/Admin/DbMonitoringController.php:382
* @route '/admin/monitoring/database/export/confirm-password'
*/
export const confirmPassword = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: confirmPassword.url(options),
    method: 'post',
})

confirmPassword.definition = {
    methods: ["post"],
    url: '/admin/monitoring/database/export/confirm-password',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\DbMonitoringController::confirmPassword
* @see app/Http/Controllers/Admin/DbMonitoringController.php:382
* @route '/admin/monitoring/database/export/confirm-password'
*/
confirmPassword.url = (options?: RouteQueryOptions) => {
    return confirmPassword.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\DbMonitoringController::confirmPassword
* @see app/Http/Controllers/Admin/DbMonitoringController.php:382
* @route '/admin/monitoring/database/export/confirm-password'
*/
confirmPassword.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: confirmPassword.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\DbMonitoringController::confirmPassword
* @see app/Http/Controllers/Admin/DbMonitoringController.php:382
* @route '/admin/monitoring/database/export/confirm-password'
*/
const confirmPasswordForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: confirmPassword.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\DbMonitoringController::confirmPassword
* @see app/Http/Controllers/Admin/DbMonitoringController.php:382
* @route '/admin/monitoring/database/export/confirm-password'
*/
confirmPasswordForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: confirmPassword.url(options),
    method: 'post',
})

confirmPassword.form = confirmPasswordForm

/**
* @see \App\Http\Controllers\Admin\DbMonitoringController::downloadExport
* @see app/Http/Controllers/Admin/DbMonitoringController.php:400
* @route '/admin/monitoring/database/export/download'
*/
export const downloadExport = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: downloadExport.url(options),
    method: 'post',
})

downloadExport.definition = {
    methods: ["post"],
    url: '/admin/monitoring/database/export/download',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\DbMonitoringController::downloadExport
* @see app/Http/Controllers/Admin/DbMonitoringController.php:400
* @route '/admin/monitoring/database/export/download'
*/
downloadExport.url = (options?: RouteQueryOptions) => {
    return downloadExport.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\DbMonitoringController::downloadExport
* @see app/Http/Controllers/Admin/DbMonitoringController.php:400
* @route '/admin/monitoring/database/export/download'
*/
downloadExport.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: downloadExport.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\DbMonitoringController::downloadExport
* @see app/Http/Controllers/Admin/DbMonitoringController.php:400
* @route '/admin/monitoring/database/export/download'
*/
const downloadExportForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: downloadExport.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\DbMonitoringController::downloadExport
* @see app/Http/Controllers/Admin/DbMonitoringController.php:400
* @route '/admin/monitoring/database/export/download'
*/
downloadExportForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: downloadExport.url(options),
    method: 'post',
})

downloadExport.form = downloadExportForm

const DbMonitoringController = { index, getMetrics, exportPreview, confirmPassword, downloadExport }

export default DbMonitoringController
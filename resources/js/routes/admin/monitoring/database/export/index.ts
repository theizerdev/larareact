import { queryParams, type RouteQueryOptions, type RouteDefinition } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Admin\DbMonitoringController::preview
* @see app/Http/Controllers/Admin/DbMonitoringController.php:323
* @route '/admin/monitoring/database/export/preview'
*/
export const preview = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: preview.url(options),
    method: 'post',
})

preview.definition = {
    methods: ["post"],
    url: '/admin/monitoring/database/export/preview',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\DbMonitoringController::preview
* @see app/Http/Controllers/Admin/DbMonitoringController.php:323
* @route '/admin/monitoring/database/export/preview'
*/
preview.url = (options?: RouteQueryOptions) => {
    return preview.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\DbMonitoringController::preview
* @see app/Http/Controllers/Admin/DbMonitoringController.php:323
* @route '/admin/monitoring/database/export/preview'
*/
preview.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: preview.url(options),
    method: 'post',
})

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
* @see \App\Http\Controllers\Admin\DbMonitoringController::download
* @see app/Http/Controllers/Admin/DbMonitoringController.php:400
* @route '/admin/monitoring/database/export/download'
*/
export const download = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: download.url(options),
    method: 'post',
})

download.definition = {
    methods: ["post"],
    url: '/admin/monitoring/database/export/download',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\DbMonitoringController::download
* @see app/Http/Controllers/Admin/DbMonitoringController.php:400
* @route '/admin/monitoring/database/export/download'
*/
download.url = (options?: RouteQueryOptions) => {
    return download.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\DbMonitoringController::download
* @see app/Http/Controllers/Admin/DbMonitoringController.php:400
* @route '/admin/monitoring/database/export/download'
*/
download.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: download.url(options),
    method: 'post',
})

const exportMethod = {
    preview: Object.assign(preview, preview),
    confirmPassword: Object.assign(confirmPassword, confirmPassword),
    download: Object.assign(download, download),
}

export default exportMethod
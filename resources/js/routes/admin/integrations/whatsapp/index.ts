import { queryParams, type RouteQueryOptions, type RouteDefinition } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\Admin\IntegrationController::index
 * @see app/Http/Controllers/Admin/IntegrationController.php:222
 * @route '/admin/integrations/whatsapp'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/admin/integrations/whatsapp',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\IntegrationController::index
 * @see app/Http/Controllers/Admin/IntegrationController.php:222
 * @route '/admin/integrations/whatsapp'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\IntegrationController::index
 * @see app/Http/Controllers/Admin/IntegrationController.php:222
 * @route '/admin/integrations/whatsapp'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Admin\IntegrationController::index
 * @see app/Http/Controllers/Admin/IntegrationController.php:222
 * @route '/admin/integrations/whatsapp'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Admin\IntegrationController::status
 * @see app/Http/Controllers/Admin/IntegrationController.php:269
 * @route '/admin/integrations/whatsapp/status'
 */
export const status = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: status.url(options),
    method: 'get',
})

status.definition = {
    methods: ["get","head"],
    url: '/admin/integrations/whatsapp/status',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\IntegrationController::status
 * @see app/Http/Controllers/Admin/IntegrationController.php:269
 * @route '/admin/integrations/whatsapp/status'
 */
status.url = (options?: RouteQueryOptions) => {
    return status.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\IntegrationController::status
 * @see app/Http/Controllers/Admin/IntegrationController.php:269
 * @route '/admin/integrations/whatsapp/status'
 */
status.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: status.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Admin\IntegrationController::status
 * @see app/Http/Controllers/Admin/IntegrationController.php:269
 * @route '/admin/integrations/whatsapp/status'
 */
status.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: status.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Admin\IntegrationController::update
 * @see app/Http/Controllers/Admin/IntegrationController.php:294
 * @route '/admin/integrations/whatsapp/update'
 */
export const update = (options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(options),
    method: 'put',
})

update.definition = {
    methods: ["put"],
    url: '/admin/integrations/whatsapp/update',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\Admin\IntegrationController::update
 * @see app/Http/Controllers/Admin/IntegrationController.php:294
 * @route '/admin/integrations/whatsapp/update'
 */
update.url = (options?: RouteQueryOptions) => {
    return update.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\IntegrationController::update
 * @see app/Http/Controllers/Admin/IntegrationController.php:294
 * @route '/admin/integrations/whatsapp/update'
 */
update.put = (options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(options),
    method: 'put',
})

/**
* @see \App\Http\Controllers\Admin\IntegrationController::generateToken
 * @see app/Http/Controllers/Admin/IntegrationController.php:342
 * @route '/admin/integrations/whatsapp/generate-token'
 */
export const generateToken = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: generateToken.url(options),
    method: 'post',
})

generateToken.definition = {
    methods: ["post"],
    url: '/admin/integrations/whatsapp/generate-token',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\IntegrationController::generateToken
 * @see app/Http/Controllers/Admin/IntegrationController.php:342
 * @route '/admin/integrations/whatsapp/generate-token'
 */
generateToken.url = (options?: RouteQueryOptions) => {
    return generateToken.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\IntegrationController::generateToken
 * @see app/Http/Controllers/Admin/IntegrationController.php:342
 * @route '/admin/integrations/whatsapp/generate-token'
 */
generateToken.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: generateToken.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\IntegrationController::sync
 * @see app/Http/Controllers/Admin/IntegrationController.php:369
 * @route '/admin/integrations/whatsapp/sync'
 */
export const sync = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: sync.url(options),
    method: 'post',
})

sync.definition = {
    methods: ["post"],
    url: '/admin/integrations/whatsapp/sync',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\IntegrationController::sync
 * @see app/Http/Controllers/Admin/IntegrationController.php:369
 * @route '/admin/integrations/whatsapp/sync'
 */
sync.url = (options?: RouteQueryOptions) => {
    return sync.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\IntegrationController::sync
 * @see app/Http/Controllers/Admin/IntegrationController.php:369
 * @route '/admin/integrations/whatsapp/sync'
 */
sync.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: sync.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\IntegrationController::connect
 * @see app/Http/Controllers/Admin/IntegrationController.php:407
 * @route '/admin/integrations/whatsapp/connect'
 */
export const connect = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: connect.url(options),
    method: 'post',
})

connect.definition = {
    methods: ["post"],
    url: '/admin/integrations/whatsapp/connect',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\IntegrationController::connect
 * @see app/Http/Controllers/Admin/IntegrationController.php:407
 * @route '/admin/integrations/whatsapp/connect'
 */
connect.url = (options?: RouteQueryOptions) => {
    return connect.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\IntegrationController::connect
 * @see app/Http/Controllers/Admin/IntegrationController.php:407
 * @route '/admin/integrations/whatsapp/connect'
 */
connect.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: connect.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\IntegrationController::disconnect
 * @see app/Http/Controllers/Admin/IntegrationController.php:444
 * @route '/admin/integrations/whatsapp/disconnect'
 */
export const disconnect = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: disconnect.url(options),
    method: 'post',
})

disconnect.definition = {
    methods: ["post"],
    url: '/admin/integrations/whatsapp/disconnect',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\IntegrationController::disconnect
 * @see app/Http/Controllers/Admin/IntegrationController.php:444
 * @route '/admin/integrations/whatsapp/disconnect'
 */
disconnect.url = (options?: RouteQueryOptions) => {
    return disconnect.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\IntegrationController::disconnect
 * @see app/Http/Controllers/Admin/IntegrationController.php:444
 * @route '/admin/integrations/whatsapp/disconnect'
 */
disconnect.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: disconnect.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\IntegrationController::reconnect
 * @see app/Http/Controllers/Admin/IntegrationController.php:473
 * @route '/admin/integrations/whatsapp/reconnect'
 */
export const reconnect = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: reconnect.url(options),
    method: 'post',
})

reconnect.definition = {
    methods: ["post"],
    url: '/admin/integrations/whatsapp/reconnect',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\IntegrationController::reconnect
 * @see app/Http/Controllers/Admin/IntegrationController.php:473
 * @route '/admin/integrations/whatsapp/reconnect'
 */
reconnect.url = (options?: RouteQueryOptions) => {
    return reconnect.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\IntegrationController::reconnect
 * @see app/Http/Controllers/Admin/IntegrationController.php:473
 * @route '/admin/integrations/whatsapp/reconnect'
 */
reconnect.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: reconnect.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\IntegrationController::sendMessage
 * @see app/Http/Controllers/Admin/IntegrationController.php:496
 * @route '/admin/integrations/whatsapp/send-message'
 */
export const sendMessage = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: sendMessage.url(options),
    method: 'post',
})

sendMessage.definition = {
    methods: ["post"],
    url: '/admin/integrations/whatsapp/send-message',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\IntegrationController::sendMessage
 * @see app/Http/Controllers/Admin/IntegrationController.php:496
 * @route '/admin/integrations/whatsapp/send-message'
 */
sendMessage.url = (options?: RouteQueryOptions) => {
    return sendMessage.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\IntegrationController::sendMessage
 * @see app/Http/Controllers/Admin/IntegrationController.php:496
 * @route '/admin/integrations/whatsapp/send-message'
 */
sendMessage.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: sendMessage.url(options),
    method: 'post',
})
const whatsapp = {
    index: Object.assign(index, index),
status: Object.assign(status, status),
update: Object.assign(update, update),
generateToken: Object.assign(generateToken, generateToken),
sync: Object.assign(sync, sync),
connect: Object.assign(connect, connect),
disconnect: Object.assign(disconnect, disconnect),
reconnect: Object.assign(reconnect, reconnect),
sendMessage: Object.assign(sendMessage, sendMessage),
}

export default whatsapp
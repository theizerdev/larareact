import { queryParams, type RouteQueryOptions, type RouteDefinition } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Admin\IntegrationController::recipients
* @see app/Http/Controllers/Admin/IntegrationController.php:1108
* @route '/admin/integrations/whatsapp/broadcast/recipients'
*/
export const recipients = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: recipients.url(options),
    method: 'get',
})

recipients.definition = {
    methods: ["get","head"],
    url: '/admin/integrations/whatsapp/broadcast/recipients',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\IntegrationController::recipients
* @see app/Http/Controllers/Admin/IntegrationController.php:1108
* @route '/admin/integrations/whatsapp/broadcast/recipients'
*/
recipients.url = (options?: RouteQueryOptions) => {
    return recipients.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\IntegrationController::recipients
* @see app/Http/Controllers/Admin/IntegrationController.php:1108
* @route '/admin/integrations/whatsapp/broadcast/recipients'
*/
recipients.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: recipients.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\IntegrationController::recipients
* @see app/Http/Controllers/Admin/IntegrationController.php:1108
* @route '/admin/integrations/whatsapp/broadcast/recipients'
*/
recipients.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: recipients.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Admin\IntegrationController::send
* @see app/Http/Controllers/Admin/IntegrationController.php:1234
* @route '/admin/integrations/whatsapp/broadcast/send'
*/
export const send = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: send.url(options),
    method: 'post',
})

send.definition = {
    methods: ["post"],
    url: '/admin/integrations/whatsapp/broadcast/send',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\IntegrationController::send
* @see app/Http/Controllers/Admin/IntegrationController.php:1234
* @route '/admin/integrations/whatsapp/broadcast/send'
*/
send.url = (options?: RouteQueryOptions) => {
    return send.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\IntegrationController::send
* @see app/Http/Controllers/Admin/IntegrationController.php:1234
* @route '/admin/integrations/whatsapp/broadcast/send'
*/
send.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: send.url(options),
    method: 'post',
})

const broadcast = {
    recipients: Object.assign(recipients, recipients),
    send: Object.assign(send, send),
}

export default broadcast
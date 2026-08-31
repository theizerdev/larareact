import { queryParams, type RouteQueryOptions, type RouteDefinition } from './../../../../wayfinder'
import blacklist from './blacklist'
import messages4ba6e9 from './messages'
import templates from './templates'
import broadcast from './broadcast'
/**
* @see \App\Http\Controllers\Admin\IntegrationController::index
* @see app/Http/Controllers/Admin/IntegrationController.php:267
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
* @see app/Http/Controllers/Admin/IntegrationController.php:267
* @route '/admin/integrations/whatsapp'
*/
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\IntegrationController::index
* @see app/Http/Controllers/Admin/IntegrationController.php:267
* @route '/admin/integrations/whatsapp'
*/
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\IntegrationController::index
* @see app/Http/Controllers/Admin/IntegrationController.php:267
* @route '/admin/integrations/whatsapp'
*/
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Admin\IntegrationController::docs
* @see app/Http/Controllers/Admin/IntegrationController.php:244
* @route '/admin/integrations/whatsapp/docs'
*/
export const docs = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: docs.url(options),
    method: 'get',
})

docs.definition = {
    methods: ["get","head"],
    url: '/admin/integrations/whatsapp/docs',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\IntegrationController::docs
* @see app/Http/Controllers/Admin/IntegrationController.php:244
* @route '/admin/integrations/whatsapp/docs'
*/
docs.url = (options?: RouteQueryOptions) => {
    return docs.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\IntegrationController::docs
* @see app/Http/Controllers/Admin/IntegrationController.php:244
* @route '/admin/integrations/whatsapp/docs'
*/
docs.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: docs.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\IntegrationController::docs
* @see app/Http/Controllers/Admin/IntegrationController.php:244
* @route '/admin/integrations/whatsapp/docs'
*/
docs.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: docs.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Admin\IntegrationController::status
* @see app/Http/Controllers/Admin/IntegrationController.php:334
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
* @see app/Http/Controllers/Admin/IntegrationController.php:334
* @route '/admin/integrations/whatsapp/status'
*/
status.url = (options?: RouteQueryOptions) => {
    return status.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\IntegrationController::status
* @see app/Http/Controllers/Admin/IntegrationController.php:334
* @route '/admin/integrations/whatsapp/status'
*/
status.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: status.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\IntegrationController::status
* @see app/Http/Controllers/Admin/IntegrationController.php:334
* @route '/admin/integrations/whatsapp/status'
*/
status.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: status.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Admin\IntegrationController::queueStats
* @see app/Http/Controllers/Admin/IntegrationController.php:563
* @route '/admin/integrations/whatsapp/queue-stats'
*/
export const queueStats = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: queueStats.url(options),
    method: 'get',
})

queueStats.definition = {
    methods: ["get","head"],
    url: '/admin/integrations/whatsapp/queue-stats',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\IntegrationController::queueStats
* @see app/Http/Controllers/Admin/IntegrationController.php:563
* @route '/admin/integrations/whatsapp/queue-stats'
*/
queueStats.url = (options?: RouteQueryOptions) => {
    return queueStats.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\IntegrationController::queueStats
* @see app/Http/Controllers/Admin/IntegrationController.php:563
* @route '/admin/integrations/whatsapp/queue-stats'
*/
queueStats.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: queueStats.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\IntegrationController::queueStats
* @see app/Http/Controllers/Admin/IntegrationController.php:563
* @route '/admin/integrations/whatsapp/queue-stats'
*/
queueStats.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: queueStats.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Admin\IntegrationController::update
* @see app/Http/Controllers/Admin/IntegrationController.php:361
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
* @see app/Http/Controllers/Admin/IntegrationController.php:361
* @route '/admin/integrations/whatsapp/update'
*/
update.url = (options?: RouteQueryOptions) => {
    return update.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\IntegrationController::update
* @see app/Http/Controllers/Admin/IntegrationController.php:361
* @route '/admin/integrations/whatsapp/update'
*/
update.put = (options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(options),
    method: 'put',
})

/**
* @see \App\Http\Controllers\Admin\IntegrationController::antiban
* @see app/Http/Controllers/Admin/IntegrationController.php:637
* @route '/admin/integrations/whatsapp/antiban'
*/
export const antiban = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: antiban.url(options),
    method: 'post',
})

antiban.definition = {
    methods: ["post"],
    url: '/admin/integrations/whatsapp/antiban',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\IntegrationController::antiban
* @see app/Http/Controllers/Admin/IntegrationController.php:637
* @route '/admin/integrations/whatsapp/antiban'
*/
antiban.url = (options?: RouteQueryOptions) => {
    return antiban.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\IntegrationController::antiban
* @see app/Http/Controllers/Admin/IntegrationController.php:637
* @route '/admin/integrations/whatsapp/antiban'
*/
antiban.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: antiban.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\IntegrationController::generateToken
* @see app/Http/Controllers/Admin/IntegrationController.php:409
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
* @see app/Http/Controllers/Admin/IntegrationController.php:409
* @route '/admin/integrations/whatsapp/generate-token'
*/
generateToken.url = (options?: RouteQueryOptions) => {
    return generateToken.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\IntegrationController::generateToken
* @see app/Http/Controllers/Admin/IntegrationController.php:409
* @route '/admin/integrations/whatsapp/generate-token'
*/
generateToken.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: generateToken.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\IntegrationController::sync
* @see app/Http/Controllers/Admin/IntegrationController.php:436
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
* @see app/Http/Controllers/Admin/IntegrationController.php:436
* @route '/admin/integrations/whatsapp/sync'
*/
sync.url = (options?: RouteQueryOptions) => {
    return sync.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\IntegrationController::sync
* @see app/Http/Controllers/Admin/IntegrationController.php:436
* @route '/admin/integrations/whatsapp/sync'
*/
sync.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: sync.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\IntegrationController::connect
* @see app/Http/Controllers/Admin/IntegrationController.php:474
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
* @see app/Http/Controllers/Admin/IntegrationController.php:474
* @route '/admin/integrations/whatsapp/connect'
*/
connect.url = (options?: RouteQueryOptions) => {
    return connect.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\IntegrationController::connect
* @see app/Http/Controllers/Admin/IntegrationController.php:474
* @route '/admin/integrations/whatsapp/connect'
*/
connect.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: connect.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\IntegrationController::disconnect
* @see app/Http/Controllers/Admin/IntegrationController.php:511
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
* @see app/Http/Controllers/Admin/IntegrationController.php:511
* @route '/admin/integrations/whatsapp/disconnect'
*/
disconnect.url = (options?: RouteQueryOptions) => {
    return disconnect.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\IntegrationController::disconnect
* @see app/Http/Controllers/Admin/IntegrationController.php:511
* @route '/admin/integrations/whatsapp/disconnect'
*/
disconnect.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: disconnect.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\IntegrationController::reconnect
* @see app/Http/Controllers/Admin/IntegrationController.php:540
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
* @see app/Http/Controllers/Admin/IntegrationController.php:540
* @route '/admin/integrations/whatsapp/reconnect'
*/
reconnect.url = (options?: RouteQueryOptions) => {
    return reconnect.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\IntegrationController::reconnect
* @see app/Http/Controllers/Admin/IntegrationController.php:540
* @route '/admin/integrations/whatsapp/reconnect'
*/
reconnect.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: reconnect.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\IntegrationController::sendMessage
* @see app/Http/Controllers/Admin/IntegrationController.php:751
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
* @see app/Http/Controllers/Admin/IntegrationController.php:751
* @route '/admin/integrations/whatsapp/send-message'
*/
sendMessage.url = (options?: RouteQueryOptions) => {
    return sendMessage.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\IntegrationController::sendMessage
* @see app/Http/Controllers/Admin/IntegrationController.php:751
* @route '/admin/integrations/whatsapp/send-message'
*/
sendMessage.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: sendMessage.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\IntegrationController::checkNumber
* @see app/Http/Controllers/Admin/IntegrationController.php:583
* @route '/admin/integrations/whatsapp/check-number'
*/
export const checkNumber = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: checkNumber.url(options),
    method: 'post',
})

checkNumber.definition = {
    methods: ["post"],
    url: '/admin/integrations/whatsapp/check-number',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\IntegrationController::checkNumber
* @see app/Http/Controllers/Admin/IntegrationController.php:583
* @route '/admin/integrations/whatsapp/check-number'
*/
checkNumber.url = (options?: RouteQueryOptions) => {
    return checkNumber.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\IntegrationController::checkNumber
* @see app/Http/Controllers/Admin/IntegrationController.php:583
* @route '/admin/integrations/whatsapp/check-number'
*/
checkNumber.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: checkNumber.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\IntegrationController::previewSpintax
* @see app/Http/Controllers/Admin/IntegrationController.php:607
* @route '/admin/integrations/whatsapp/preview-spintax'
*/
export const previewSpintax = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: previewSpintax.url(options),
    method: 'post',
})

previewSpintax.definition = {
    methods: ["post"],
    url: '/admin/integrations/whatsapp/preview-spintax',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\IntegrationController::previewSpintax
* @see app/Http/Controllers/Admin/IntegrationController.php:607
* @route '/admin/integrations/whatsapp/preview-spintax'
*/
previewSpintax.url = (options?: RouteQueryOptions) => {
    return previewSpintax.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\IntegrationController::previewSpintax
* @see app/Http/Controllers/Admin/IntegrationController.php:607
* @route '/admin/integrations/whatsapp/preview-spintax'
*/
previewSpintax.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: previewSpintax.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\IntegrationController::diagnostic
* @see app/Http/Controllers/Admin/IntegrationController.php:915
* @route '/admin/integrations/whatsapp/diagnostic'
*/
export const diagnostic = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: diagnostic.url(options),
    method: 'get',
})

diagnostic.definition = {
    methods: ["get","head"],
    url: '/admin/integrations/whatsapp/diagnostic',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\IntegrationController::diagnostic
* @see app/Http/Controllers/Admin/IntegrationController.php:915
* @route '/admin/integrations/whatsapp/diagnostic'
*/
diagnostic.url = (options?: RouteQueryOptions) => {
    return diagnostic.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\IntegrationController::diagnostic
* @see app/Http/Controllers/Admin/IntegrationController.php:915
* @route '/admin/integrations/whatsapp/diagnostic'
*/
diagnostic.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: diagnostic.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\IntegrationController::diagnostic
* @see app/Http/Controllers/Admin/IntegrationController.php:915
* @route '/admin/integrations/whatsapp/diagnostic'
*/
diagnostic.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: diagnostic.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Admin\IntegrationController::messages
* @see app/Http/Controllers/Admin/IntegrationController.php:951
* @route '/admin/integrations/whatsapp/messages'
*/
export const messages = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: messages.url(options),
    method: 'get',
})

messages.definition = {
    methods: ["get","head"],
    url: '/admin/integrations/whatsapp/messages',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\IntegrationController::messages
* @see app/Http/Controllers/Admin/IntegrationController.php:951
* @route '/admin/integrations/whatsapp/messages'
*/
messages.url = (options?: RouteQueryOptions) => {
    return messages.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\IntegrationController::messages
* @see app/Http/Controllers/Admin/IntegrationController.php:951
* @route '/admin/integrations/whatsapp/messages'
*/
messages.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: messages.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\IntegrationController::messages
* @see app/Http/Controllers/Admin/IntegrationController.php:951
* @route '/admin/integrations/whatsapp/messages'
*/
messages.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: messages.url(options),
    method: 'head',
})

const whatsapp = {
    index: Object.assign(index, index),
    docs: Object.assign(docs, docs),
    status: Object.assign(status, status),
    queueStats: Object.assign(queueStats, queueStats),
    update: Object.assign(update, update),
    antiban: Object.assign(antiban, antiban),
    generateToken: Object.assign(generateToken, generateToken),
    sync: Object.assign(sync, sync),
    connect: Object.assign(connect, connect),
    disconnect: Object.assign(disconnect, disconnect),
    reconnect: Object.assign(reconnect, reconnect),
    sendMessage: Object.assign(sendMessage, sendMessage),
    checkNumber: Object.assign(checkNumber, checkNumber),
    previewSpintax: Object.assign(previewSpintax, previewSpintax),
    blacklist: Object.assign(blacklist, blacklist),
    diagnostic: Object.assign(diagnostic, diagnostic),
    messages: Object.assign(messages, messages4ba6e9),
    templates: Object.assign(templates, templates),
    broadcast: Object.assign(broadcast, broadcast),
}

export default whatsapp
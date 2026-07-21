import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\Admin\IntegrationController::index
 * @see app/Http/Controllers/Admin/IntegrationController.php:153
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
 * @see app/Http/Controllers/Admin/IntegrationController.php:153
 * @route '/admin/integrations/whatsapp'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\IntegrationController::index
 * @see app/Http/Controllers/Admin/IntegrationController.php:153
 * @route '/admin/integrations/whatsapp'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Admin\IntegrationController::index
 * @see app/Http/Controllers/Admin/IntegrationController.php:153
 * @route '/admin/integrations/whatsapp'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Admin\IntegrationController::index
 * @see app/Http/Controllers/Admin/IntegrationController.php:153
 * @route '/admin/integrations/whatsapp'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Admin\IntegrationController::index
 * @see app/Http/Controllers/Admin/IntegrationController.php:153
 * @route '/admin/integrations/whatsapp'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Admin\IntegrationController::index
 * @see app/Http/Controllers/Admin/IntegrationController.php:153
 * @route '/admin/integrations/whatsapp'
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
* @see \App\Http\Controllers\Admin\IntegrationController::status
 * @see app/Http/Controllers/Admin/IntegrationController.php:199
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
 * @see app/Http/Controllers/Admin/IntegrationController.php:199
 * @route '/admin/integrations/whatsapp/status'
 */
status.url = (options?: RouteQueryOptions) => {
    return status.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\IntegrationController::status
 * @see app/Http/Controllers/Admin/IntegrationController.php:199
 * @route '/admin/integrations/whatsapp/status'
 */
status.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: status.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Admin\IntegrationController::status
 * @see app/Http/Controllers/Admin/IntegrationController.php:199
 * @route '/admin/integrations/whatsapp/status'
 */
status.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: status.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Admin\IntegrationController::status
 * @see app/Http/Controllers/Admin/IntegrationController.php:199
 * @route '/admin/integrations/whatsapp/status'
 */
    const statusForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: status.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Admin\IntegrationController::status
 * @see app/Http/Controllers/Admin/IntegrationController.php:199
 * @route '/admin/integrations/whatsapp/status'
 */
        statusForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: status.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Admin\IntegrationController::status
 * @see app/Http/Controllers/Admin/IntegrationController.php:199
 * @route '/admin/integrations/whatsapp/status'
 */
        statusForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: status.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    status.form = statusForm
/**
* @see \App\Http\Controllers\Admin\IntegrationController::update
 * @see app/Http/Controllers/Admin/IntegrationController.php:224
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
 * @see app/Http/Controllers/Admin/IntegrationController.php:224
 * @route '/admin/integrations/whatsapp/update'
 */
update.url = (options?: RouteQueryOptions) => {
    return update.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\IntegrationController::update
 * @see app/Http/Controllers/Admin/IntegrationController.php:224
 * @route '/admin/integrations/whatsapp/update'
 */
update.put = (options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(options),
    method: 'put',
})

    /**
* @see \App\Http\Controllers\Admin\IntegrationController::update
 * @see app/Http/Controllers/Admin/IntegrationController.php:224
 * @route '/admin/integrations/whatsapp/update'
 */
    const updateForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: update.url({
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PUT',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\IntegrationController::update
 * @see app/Http/Controllers/Admin/IntegrationController.php:224
 * @route '/admin/integrations/whatsapp/update'
 */
        updateForm.put = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: update.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PUT',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    update.form = updateForm
/**
* @see \App\Http\Controllers\Admin\IntegrationController::generateToken
 * @see app/Http/Controllers/Admin/IntegrationController.php:256
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
 * @see app/Http/Controllers/Admin/IntegrationController.php:256
 * @route '/admin/integrations/whatsapp/generate-token'
 */
generateToken.url = (options?: RouteQueryOptions) => {
    return generateToken.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\IntegrationController::generateToken
 * @see app/Http/Controllers/Admin/IntegrationController.php:256
 * @route '/admin/integrations/whatsapp/generate-token'
 */
generateToken.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: generateToken.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Admin\IntegrationController::generateToken
 * @see app/Http/Controllers/Admin/IntegrationController.php:256
 * @route '/admin/integrations/whatsapp/generate-token'
 */
    const generateTokenForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: generateToken.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\IntegrationController::generateToken
 * @see app/Http/Controllers/Admin/IntegrationController.php:256
 * @route '/admin/integrations/whatsapp/generate-token'
 */
        generateTokenForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: generateToken.url(options),
            method: 'post',
        })
    
    generateToken.form = generateTokenForm
/**
* @see \App\Http\Controllers\Admin\IntegrationController::sync
 * @see app/Http/Controllers/Admin/IntegrationController.php:283
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
 * @see app/Http/Controllers/Admin/IntegrationController.php:283
 * @route '/admin/integrations/whatsapp/sync'
 */
sync.url = (options?: RouteQueryOptions) => {
    return sync.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\IntegrationController::sync
 * @see app/Http/Controllers/Admin/IntegrationController.php:283
 * @route '/admin/integrations/whatsapp/sync'
 */
sync.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: sync.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Admin\IntegrationController::sync
 * @see app/Http/Controllers/Admin/IntegrationController.php:283
 * @route '/admin/integrations/whatsapp/sync'
 */
    const syncForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: sync.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\IntegrationController::sync
 * @see app/Http/Controllers/Admin/IntegrationController.php:283
 * @route '/admin/integrations/whatsapp/sync'
 */
        syncForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: sync.url(options),
            method: 'post',
        })
    
    sync.form = syncForm
/**
* @see \App\Http\Controllers\Admin\IntegrationController::connect
 * @see app/Http/Controllers/Admin/IntegrationController.php:321
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
 * @see app/Http/Controllers/Admin/IntegrationController.php:321
 * @route '/admin/integrations/whatsapp/connect'
 */
connect.url = (options?: RouteQueryOptions) => {
    return connect.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\IntegrationController::connect
 * @see app/Http/Controllers/Admin/IntegrationController.php:321
 * @route '/admin/integrations/whatsapp/connect'
 */
connect.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: connect.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Admin\IntegrationController::connect
 * @see app/Http/Controllers/Admin/IntegrationController.php:321
 * @route '/admin/integrations/whatsapp/connect'
 */
    const connectForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: connect.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\IntegrationController::connect
 * @see app/Http/Controllers/Admin/IntegrationController.php:321
 * @route '/admin/integrations/whatsapp/connect'
 */
        connectForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: connect.url(options),
            method: 'post',
        })
    
    connect.form = connectForm
/**
* @see \App\Http\Controllers\Admin\IntegrationController::disconnect
 * @see app/Http/Controllers/Admin/IntegrationController.php:351
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
 * @see app/Http/Controllers/Admin/IntegrationController.php:351
 * @route '/admin/integrations/whatsapp/disconnect'
 */
disconnect.url = (options?: RouteQueryOptions) => {
    return disconnect.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\IntegrationController::disconnect
 * @see app/Http/Controllers/Admin/IntegrationController.php:351
 * @route '/admin/integrations/whatsapp/disconnect'
 */
disconnect.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: disconnect.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Admin\IntegrationController::disconnect
 * @see app/Http/Controllers/Admin/IntegrationController.php:351
 * @route '/admin/integrations/whatsapp/disconnect'
 */
    const disconnectForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: disconnect.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\IntegrationController::disconnect
 * @see app/Http/Controllers/Admin/IntegrationController.php:351
 * @route '/admin/integrations/whatsapp/disconnect'
 */
        disconnectForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: disconnect.url(options),
            method: 'post',
        })
    
    disconnect.form = disconnectForm
/**
* @see \App\Http\Controllers\Admin\IntegrationController::reconnect
 * @see app/Http/Controllers/Admin/IntegrationController.php:380
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
 * @see app/Http/Controllers/Admin/IntegrationController.php:380
 * @route '/admin/integrations/whatsapp/reconnect'
 */
reconnect.url = (options?: RouteQueryOptions) => {
    return reconnect.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\IntegrationController::reconnect
 * @see app/Http/Controllers/Admin/IntegrationController.php:380
 * @route '/admin/integrations/whatsapp/reconnect'
 */
reconnect.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: reconnect.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Admin\IntegrationController::reconnect
 * @see app/Http/Controllers/Admin/IntegrationController.php:380
 * @route '/admin/integrations/whatsapp/reconnect'
 */
    const reconnectForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: reconnect.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\IntegrationController::reconnect
 * @see app/Http/Controllers/Admin/IntegrationController.php:380
 * @route '/admin/integrations/whatsapp/reconnect'
 */
        reconnectForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: reconnect.url(options),
            method: 'post',
        })
    
    reconnect.form = reconnectForm
/**
* @see \App\Http\Controllers\Admin\IntegrationController::sendMessage
 * @see app/Http/Controllers/Admin/IntegrationController.php:403
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
 * @see app/Http/Controllers/Admin/IntegrationController.php:403
 * @route '/admin/integrations/whatsapp/send-message'
 */
sendMessage.url = (options?: RouteQueryOptions) => {
    return sendMessage.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\IntegrationController::sendMessage
 * @see app/Http/Controllers/Admin/IntegrationController.php:403
 * @route '/admin/integrations/whatsapp/send-message'
 */
sendMessage.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: sendMessage.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Admin\IntegrationController::sendMessage
 * @see app/Http/Controllers/Admin/IntegrationController.php:403
 * @route '/admin/integrations/whatsapp/send-message'
 */
    const sendMessageForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: sendMessage.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\IntegrationController::sendMessage
 * @see app/Http/Controllers/Admin/IntegrationController.php:403
 * @route '/admin/integrations/whatsapp/send-message'
 */
        sendMessageForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: sendMessage.url(options),
            method: 'post',
        })
    
    sendMessage.form = sendMessageForm
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
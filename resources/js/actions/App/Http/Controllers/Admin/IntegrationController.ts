import { queryParams, type RouteQueryOptions, type RouteDefinition } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Admin\IntegrationController::index
 * @see app/Http/Controllers/Admin/IntegrationController.php:19
 * @route '/admin/integrations'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/admin/integrations',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\IntegrationController::index
 * @see app/Http/Controllers/Admin/IntegrationController.php:19
 * @route '/admin/integrations'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\IntegrationController::index
 * @see app/Http/Controllers/Admin/IntegrationController.php:19
 * @route '/admin/integrations'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Admin\IntegrationController::index
 * @see app/Http/Controllers/Admin/IntegrationController.php:19
 * @route '/admin/integrations'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Admin\IntegrationController::mapboxMap
 * @see app/Http/Controllers/Admin/IntegrationController.php:55
 * @route '/admin/integrations/map'
 */
export const mapboxMap = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: mapboxMap.url(options),
    method: 'get',
})

mapboxMap.definition = {
    methods: ["get","head"],
    url: '/admin/integrations/map',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\IntegrationController::mapboxMap
 * @see app/Http/Controllers/Admin/IntegrationController.php:55
 * @route '/admin/integrations/map'
 */
mapboxMap.url = (options?: RouteQueryOptions) => {
    return mapboxMap.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\IntegrationController::mapboxMap
 * @see app/Http/Controllers/Admin/IntegrationController.php:55
 * @route '/admin/integrations/map'
 */
mapboxMap.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: mapboxMap.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Admin\IntegrationController::mapboxMap
 * @see app/Http/Controllers/Admin/IntegrationController.php:55
 * @route '/admin/integrations/map'
 */
mapboxMap.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: mapboxMap.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Admin\IntegrationController::mapboxNavigation
 * @see app/Http/Controllers/Admin/IntegrationController.php:77
 * @route '/admin/integrations/map/navigation'
 */
export const mapboxNavigation = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: mapboxNavigation.url(options),
    method: 'get',
})

mapboxNavigation.definition = {
    methods: ["get","head"],
    url: '/admin/integrations/map/navigation',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\IntegrationController::mapboxNavigation
 * @see app/Http/Controllers/Admin/IntegrationController.php:77
 * @route '/admin/integrations/map/navigation'
 */
mapboxNavigation.url = (options?: RouteQueryOptions) => {
    return mapboxNavigation.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\IntegrationController::mapboxNavigation
 * @see app/Http/Controllers/Admin/IntegrationController.php:77
 * @route '/admin/integrations/map/navigation'
 */
mapboxNavigation.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: mapboxNavigation.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Admin\IntegrationController::mapboxNavigation
 * @see app/Http/Controllers/Admin/IntegrationController.php:77
 * @route '/admin/integrations/map/navigation'
 */
mapboxNavigation.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: mapboxNavigation.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Admin\IntegrationController::updateMapbox
 * @see app/Http/Controllers/Admin/IntegrationController.php:99
 * @route '/admin/integrations/mapbox'
 */
export const updateMapbox = (options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: updateMapbox.url(options),
    method: 'put',
})

updateMapbox.definition = {
    methods: ["put"],
    url: '/admin/integrations/mapbox',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\Admin\IntegrationController::updateMapbox
 * @see app/Http/Controllers/Admin/IntegrationController.php:99
 * @route '/admin/integrations/mapbox'
 */
updateMapbox.url = (options?: RouteQueryOptions) => {
    return updateMapbox.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\IntegrationController::updateMapbox
 * @see app/Http/Controllers/Admin/IntegrationController.php:99
 * @route '/admin/integrations/mapbox'
 */
updateMapbox.put = (options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: updateMapbox.url(options),
    method: 'put',
})

/**
* @see \App\Http\Controllers\Admin\IntegrationController::updateGoogleMaps
 * @see app/Http/Controllers/Admin/IntegrationController.php:129
 * @route '/admin/integrations/google-maps'
 */
export const updateGoogleMaps = (options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: updateGoogleMaps.url(options),
    method: 'put',
})

updateGoogleMaps.definition = {
    methods: ["put"],
    url: '/admin/integrations/google-maps',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\Admin\IntegrationController::updateGoogleMaps
 * @see app/Http/Controllers/Admin/IntegrationController.php:129
 * @route '/admin/integrations/google-maps'
 */
updateGoogleMaps.url = (options?: RouteQueryOptions) => {
    return updateGoogleMaps.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\IntegrationController::updateGoogleMaps
 * @see app/Http/Controllers/Admin/IntegrationController.php:129
 * @route '/admin/integrations/google-maps'
 */
updateGoogleMaps.put = (options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: updateGoogleMaps.url(options),
    method: 'put',
})

/**
* @see \App\Http\Controllers\Admin\IntegrationController::updateControlAcceso
 * @see app/Http/Controllers/Admin/IntegrationController.php:159
 * @route '/admin/integrations/control-acceso'
 */
export const updateControlAcceso = (options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: updateControlAcceso.url(options),
    method: 'put',
})

updateControlAcceso.definition = {
    methods: ["put"],
    url: '/admin/integrations/control-acceso',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\Admin\IntegrationController::updateControlAcceso
 * @see app/Http/Controllers/Admin/IntegrationController.php:159
 * @route '/admin/integrations/control-acceso'
 */
updateControlAcceso.url = (options?: RouteQueryOptions) => {
    return updateControlAcceso.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\IntegrationController::updateControlAcceso
 * @see app/Http/Controllers/Admin/IntegrationController.php:159
 * @route '/admin/integrations/control-acceso'
 */
updateControlAcceso.put = (options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: updateControlAcceso.url(options),
    method: 'put',
})

/**
* @see \App\Http\Controllers\Admin\IntegrationController::controlAccesoTest
 * @see app/Http/Controllers/Admin/IntegrationController.php:193
 * @route '/admin/integrations/control-acceso/test'
 */
export const controlAccesoTest = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: controlAccesoTest.url(options),
    method: 'post',
})

controlAccesoTest.definition = {
    methods: ["post"],
    url: '/admin/integrations/control-acceso/test',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\IntegrationController::controlAccesoTest
 * @see app/Http/Controllers/Admin/IntegrationController.php:193
 * @route '/admin/integrations/control-acceso/test'
 */
controlAccesoTest.url = (options?: RouteQueryOptions) => {
    return controlAccesoTest.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\IntegrationController::controlAccesoTest
 * @see app/Http/Controllers/Admin/IntegrationController.php:193
 * @route '/admin/integrations/control-acceso/test'
 */
controlAccesoTest.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: controlAccesoTest.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\IntegrationController::whatsappIndex
 * @see app/Http/Controllers/Admin/IntegrationController.php:222
 * @route '/admin/integrations/whatsapp'
 */
export const whatsappIndex = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: whatsappIndex.url(options),
    method: 'get',
})

whatsappIndex.definition = {
    methods: ["get","head"],
    url: '/admin/integrations/whatsapp',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\IntegrationController::whatsappIndex
 * @see app/Http/Controllers/Admin/IntegrationController.php:222
 * @route '/admin/integrations/whatsapp'
 */
whatsappIndex.url = (options?: RouteQueryOptions) => {
    return whatsappIndex.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\IntegrationController::whatsappIndex
 * @see app/Http/Controllers/Admin/IntegrationController.php:222
 * @route '/admin/integrations/whatsapp'
 */
whatsappIndex.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: whatsappIndex.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Admin\IntegrationController::whatsappIndex
 * @see app/Http/Controllers/Admin/IntegrationController.php:222
 * @route '/admin/integrations/whatsapp'
 */
whatsappIndex.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: whatsappIndex.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Admin\IntegrationController::whatsappStatus
 * @see app/Http/Controllers/Admin/IntegrationController.php:269
 * @route '/admin/integrations/whatsapp/status'
 */
export const whatsappStatus = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: whatsappStatus.url(options),
    method: 'get',
})

whatsappStatus.definition = {
    methods: ["get","head"],
    url: '/admin/integrations/whatsapp/status',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\IntegrationController::whatsappStatus
 * @see app/Http/Controllers/Admin/IntegrationController.php:269
 * @route '/admin/integrations/whatsapp/status'
 */
whatsappStatus.url = (options?: RouteQueryOptions) => {
    return whatsappStatus.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\IntegrationController::whatsappStatus
 * @see app/Http/Controllers/Admin/IntegrationController.php:269
 * @route '/admin/integrations/whatsapp/status'
 */
whatsappStatus.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: whatsappStatus.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Admin\IntegrationController::whatsappStatus
 * @see app/Http/Controllers/Admin/IntegrationController.php:269
 * @route '/admin/integrations/whatsapp/status'
 */
whatsappStatus.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: whatsappStatus.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Admin\IntegrationController::whatsappUpdate
 * @see app/Http/Controllers/Admin/IntegrationController.php:294
 * @route '/admin/integrations/whatsapp/update'
 */
export const whatsappUpdate = (options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: whatsappUpdate.url(options),
    method: 'put',
})

whatsappUpdate.definition = {
    methods: ["put"],
    url: '/admin/integrations/whatsapp/update',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\Admin\IntegrationController::whatsappUpdate
 * @see app/Http/Controllers/Admin/IntegrationController.php:294
 * @route '/admin/integrations/whatsapp/update'
 */
whatsappUpdate.url = (options?: RouteQueryOptions) => {
    return whatsappUpdate.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\IntegrationController::whatsappUpdate
 * @see app/Http/Controllers/Admin/IntegrationController.php:294
 * @route '/admin/integrations/whatsapp/update'
 */
whatsappUpdate.put = (options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: whatsappUpdate.url(options),
    method: 'put',
})

/**
* @see \App\Http\Controllers\Admin\IntegrationController::whatsappGenerateToken
 * @see app/Http/Controllers/Admin/IntegrationController.php:342
 * @route '/admin/integrations/whatsapp/generate-token'
 */
export const whatsappGenerateToken = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: whatsappGenerateToken.url(options),
    method: 'post',
})

whatsappGenerateToken.definition = {
    methods: ["post"],
    url: '/admin/integrations/whatsapp/generate-token',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\IntegrationController::whatsappGenerateToken
 * @see app/Http/Controllers/Admin/IntegrationController.php:342
 * @route '/admin/integrations/whatsapp/generate-token'
 */
whatsappGenerateToken.url = (options?: RouteQueryOptions) => {
    return whatsappGenerateToken.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\IntegrationController::whatsappGenerateToken
 * @see app/Http/Controllers/Admin/IntegrationController.php:342
 * @route '/admin/integrations/whatsapp/generate-token'
 */
whatsappGenerateToken.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: whatsappGenerateToken.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\IntegrationController::whatsappSync
 * @see app/Http/Controllers/Admin/IntegrationController.php:369
 * @route '/admin/integrations/whatsapp/sync'
 */
export const whatsappSync = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: whatsappSync.url(options),
    method: 'post',
})

whatsappSync.definition = {
    methods: ["post"],
    url: '/admin/integrations/whatsapp/sync',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\IntegrationController::whatsappSync
 * @see app/Http/Controllers/Admin/IntegrationController.php:369
 * @route '/admin/integrations/whatsapp/sync'
 */
whatsappSync.url = (options?: RouteQueryOptions) => {
    return whatsappSync.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\IntegrationController::whatsappSync
 * @see app/Http/Controllers/Admin/IntegrationController.php:369
 * @route '/admin/integrations/whatsapp/sync'
 */
whatsappSync.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: whatsappSync.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\IntegrationController::whatsappConnect
 * @see app/Http/Controllers/Admin/IntegrationController.php:407
 * @route '/admin/integrations/whatsapp/connect'
 */
export const whatsappConnect = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: whatsappConnect.url(options),
    method: 'post',
})

whatsappConnect.definition = {
    methods: ["post"],
    url: '/admin/integrations/whatsapp/connect',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\IntegrationController::whatsappConnect
 * @see app/Http/Controllers/Admin/IntegrationController.php:407
 * @route '/admin/integrations/whatsapp/connect'
 */
whatsappConnect.url = (options?: RouteQueryOptions) => {
    return whatsappConnect.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\IntegrationController::whatsappConnect
 * @see app/Http/Controllers/Admin/IntegrationController.php:407
 * @route '/admin/integrations/whatsapp/connect'
 */
whatsappConnect.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: whatsappConnect.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\IntegrationController::whatsappDisconnect
 * @see app/Http/Controllers/Admin/IntegrationController.php:444
 * @route '/admin/integrations/whatsapp/disconnect'
 */
export const whatsappDisconnect = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: whatsappDisconnect.url(options),
    method: 'post',
})

whatsappDisconnect.definition = {
    methods: ["post"],
    url: '/admin/integrations/whatsapp/disconnect',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\IntegrationController::whatsappDisconnect
 * @see app/Http/Controllers/Admin/IntegrationController.php:444
 * @route '/admin/integrations/whatsapp/disconnect'
 */
whatsappDisconnect.url = (options?: RouteQueryOptions) => {
    return whatsappDisconnect.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\IntegrationController::whatsappDisconnect
 * @see app/Http/Controllers/Admin/IntegrationController.php:444
 * @route '/admin/integrations/whatsapp/disconnect'
 */
whatsappDisconnect.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: whatsappDisconnect.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\IntegrationController::whatsappReconnect
 * @see app/Http/Controllers/Admin/IntegrationController.php:473
 * @route '/admin/integrations/whatsapp/reconnect'
 */
export const whatsappReconnect = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: whatsappReconnect.url(options),
    method: 'post',
})

whatsappReconnect.definition = {
    methods: ["post"],
    url: '/admin/integrations/whatsapp/reconnect',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\IntegrationController::whatsappReconnect
 * @see app/Http/Controllers/Admin/IntegrationController.php:473
 * @route '/admin/integrations/whatsapp/reconnect'
 */
whatsappReconnect.url = (options?: RouteQueryOptions) => {
    return whatsappReconnect.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\IntegrationController::whatsappReconnect
 * @see app/Http/Controllers/Admin/IntegrationController.php:473
 * @route '/admin/integrations/whatsapp/reconnect'
 */
whatsappReconnect.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: whatsappReconnect.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\IntegrationController::whatsappSendMessage
 * @see app/Http/Controllers/Admin/IntegrationController.php:496
 * @route '/admin/integrations/whatsapp/send-message'
 */
export const whatsappSendMessage = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: whatsappSendMessage.url(options),
    method: 'post',
})

whatsappSendMessage.definition = {
    methods: ["post"],
    url: '/admin/integrations/whatsapp/send-message',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\IntegrationController::whatsappSendMessage
 * @see app/Http/Controllers/Admin/IntegrationController.php:496
 * @route '/admin/integrations/whatsapp/send-message'
 */
whatsappSendMessage.url = (options?: RouteQueryOptions) => {
    return whatsappSendMessage.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\IntegrationController::whatsappSendMessage
 * @see app/Http/Controllers/Admin/IntegrationController.php:496
 * @route '/admin/integrations/whatsapp/send-message'
 */
whatsappSendMessage.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: whatsappSendMessage.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\IntegrationController::validacionesIndex
 * @see app/Http/Controllers/Admin/IntegrationController.php:535
 * @route '/admin/integrations/validaciones'
 */
export const validacionesIndex = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: validacionesIndex.url(options),
    method: 'get',
})

validacionesIndex.definition = {
    methods: ["get","head"],
    url: '/admin/integrations/validaciones',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\IntegrationController::validacionesIndex
 * @see app/Http/Controllers/Admin/IntegrationController.php:535
 * @route '/admin/integrations/validaciones'
 */
validacionesIndex.url = (options?: RouteQueryOptions) => {
    return validacionesIndex.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\IntegrationController::validacionesIndex
 * @see app/Http/Controllers/Admin/IntegrationController.php:535
 * @route '/admin/integrations/validaciones'
 */
validacionesIndex.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: validacionesIndex.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Admin\IntegrationController::validacionesIndex
 * @see app/Http/Controllers/Admin/IntegrationController.php:535
 * @route '/admin/integrations/validaciones'
 */
validacionesIndex.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: validacionesIndex.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Admin\IntegrationController::updateJaak
 * @see app/Http/Controllers/Admin/IntegrationController.php:556
 * @route '/admin/integrations/jaak'
 */
export const updateJaak = (options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: updateJaak.url(options),
    method: 'put',
})

updateJaak.definition = {
    methods: ["put"],
    url: '/admin/integrations/jaak',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\Admin\IntegrationController::updateJaak
 * @see app/Http/Controllers/Admin/IntegrationController.php:556
 * @route '/admin/integrations/jaak'
 */
updateJaak.url = (options?: RouteQueryOptions) => {
    return updateJaak.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\IntegrationController::updateJaak
 * @see app/Http/Controllers/Admin/IntegrationController.php:556
 * @route '/admin/integrations/jaak'
 */
updateJaak.put = (options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: updateJaak.url(options),
    method: 'put',
})

/**
* @see \App\Http\Controllers\Admin\IntegrationController::jaakTest
 * @see app/Http/Controllers/Admin/IntegrationController.php:588
 * @route '/admin/integrations/jaak/test'
 */
export const jaakTest = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: jaakTest.url(options),
    method: 'post',
})

jaakTest.definition = {
    methods: ["post"],
    url: '/admin/integrations/jaak/test',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\IntegrationController::jaakTest
 * @see app/Http/Controllers/Admin/IntegrationController.php:588
 * @route '/admin/integrations/jaak/test'
 */
jaakTest.url = (options?: RouteQueryOptions) => {
    return jaakTest.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\IntegrationController::jaakTest
 * @see app/Http/Controllers/Admin/IntegrationController.php:588
 * @route '/admin/integrations/jaak/test'
 */
jaakTest.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: jaakTest.url(options),
    method: 'post',
})
const IntegrationController = { index, mapboxMap, mapboxNavigation, updateMapbox, updateGoogleMaps, updateControlAcceso, controlAccesoTest, whatsappIndex, whatsappStatus, whatsappUpdate, whatsappGenerateToken, whatsappSync, whatsappConnect, whatsappDisconnect, whatsappReconnect, whatsappSendMessage, validacionesIndex, updateJaak, jaakTest }

export default IntegrationController
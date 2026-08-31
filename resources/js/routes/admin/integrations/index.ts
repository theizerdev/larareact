import { queryParams, type RouteQueryOptions, type RouteDefinition } from './../../../wayfinder'
import mapbox from './mapbox'
import googleMaps from './google-maps'
import controlAcceso from './control-acceso'
import whatsapp from './whatsapp'
import validaciones from './validaciones'
import jaak from './jaak'
/**
* @see \App\Http\Controllers\Admin\IntegrationController::index
* @see app/Http/Controllers/Admin/IntegrationController.php:23
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
* @see app/Http/Controllers/Admin/IntegrationController.php:23
* @route '/admin/integrations'
*/
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\IntegrationController::index
* @see app/Http/Controllers/Admin/IntegrationController.php:23
* @route '/admin/integrations'
*/
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\IntegrationController::index
* @see app/Http/Controllers/Admin/IntegrationController.php:23
* @route '/admin/integrations'
*/
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

const integrations = {
    index: Object.assign(index, index),
    mapbox: Object.assign(mapbox, mapbox),
    googleMaps: Object.assign(googleMaps, googleMaps),
    controlAcceso: Object.assign(controlAcceso, controlAcceso),
    whatsapp: Object.assign(whatsapp, whatsapp),
    validaciones: Object.assign(validaciones, validaciones),
    jaak: Object.assign(jaak, jaak),
}

export default integrations
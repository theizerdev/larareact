import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Admin\IntegrationController::index
 * @see app/Http/Controllers/Admin/IntegrationController.php:17
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
 * @see app/Http/Controllers/Admin/IntegrationController.php:17
 * @route '/admin/integrations'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\IntegrationController::index
 * @see app/Http/Controllers/Admin/IntegrationController.php:17
 * @route '/admin/integrations'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Admin\IntegrationController::index
 * @see app/Http/Controllers/Admin/IntegrationController.php:17
 * @route '/admin/integrations'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Admin\IntegrationController::index
 * @see app/Http/Controllers/Admin/IntegrationController.php:17
 * @route '/admin/integrations'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Admin\IntegrationController::index
 * @see app/Http/Controllers/Admin/IntegrationController.php:17
 * @route '/admin/integrations'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Admin\IntegrationController::index
 * @see app/Http/Controllers/Admin/IntegrationController.php:17
 * @route '/admin/integrations'
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
* @see \App\Http\Controllers\Admin\IntegrationController::mapboxMap
 * @see app/Http/Controllers/Admin/IntegrationController.php:49
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
 * @see app/Http/Controllers/Admin/IntegrationController.php:49
 * @route '/admin/integrations/map'
 */
mapboxMap.url = (options?: RouteQueryOptions) => {
    return mapboxMap.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\IntegrationController::mapboxMap
 * @see app/Http/Controllers/Admin/IntegrationController.php:49
 * @route '/admin/integrations/map'
 */
mapboxMap.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: mapboxMap.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Admin\IntegrationController::mapboxMap
 * @see app/Http/Controllers/Admin/IntegrationController.php:49
 * @route '/admin/integrations/map'
 */
mapboxMap.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: mapboxMap.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Admin\IntegrationController::mapboxMap
 * @see app/Http/Controllers/Admin/IntegrationController.php:49
 * @route '/admin/integrations/map'
 */
    const mapboxMapForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: mapboxMap.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Admin\IntegrationController::mapboxMap
 * @see app/Http/Controllers/Admin/IntegrationController.php:49
 * @route '/admin/integrations/map'
 */
        mapboxMapForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: mapboxMap.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Admin\IntegrationController::mapboxMap
 * @see app/Http/Controllers/Admin/IntegrationController.php:49
 * @route '/admin/integrations/map'
 */
        mapboxMapForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: mapboxMap.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    mapboxMap.form = mapboxMapForm
/**
* @see \App\Http\Controllers\Admin\IntegrationController::mapboxNavigation
 * @see app/Http/Controllers/Admin/IntegrationController.php:71
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
 * @see app/Http/Controllers/Admin/IntegrationController.php:71
 * @route '/admin/integrations/map/navigation'
 */
mapboxNavigation.url = (options?: RouteQueryOptions) => {
    return mapboxNavigation.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\IntegrationController::mapboxNavigation
 * @see app/Http/Controllers/Admin/IntegrationController.php:71
 * @route '/admin/integrations/map/navigation'
 */
mapboxNavigation.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: mapboxNavigation.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Admin\IntegrationController::mapboxNavigation
 * @see app/Http/Controllers/Admin/IntegrationController.php:71
 * @route '/admin/integrations/map/navigation'
 */
mapboxNavigation.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: mapboxNavigation.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Admin\IntegrationController::mapboxNavigation
 * @see app/Http/Controllers/Admin/IntegrationController.php:71
 * @route '/admin/integrations/map/navigation'
 */
    const mapboxNavigationForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: mapboxNavigation.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Admin\IntegrationController::mapboxNavigation
 * @see app/Http/Controllers/Admin/IntegrationController.php:71
 * @route '/admin/integrations/map/navigation'
 */
        mapboxNavigationForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: mapboxNavigation.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Admin\IntegrationController::mapboxNavigation
 * @see app/Http/Controllers/Admin/IntegrationController.php:71
 * @route '/admin/integrations/map/navigation'
 */
        mapboxNavigationForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: mapboxNavigation.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    mapboxNavigation.form = mapboxNavigationForm
/**
* @see \App\Http\Controllers\Admin\IntegrationController::updateMapbox
 * @see app/Http/Controllers/Admin/IntegrationController.php:93
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
 * @see app/Http/Controllers/Admin/IntegrationController.php:93
 * @route '/admin/integrations/mapbox'
 */
updateMapbox.url = (options?: RouteQueryOptions) => {
    return updateMapbox.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\IntegrationController::updateMapbox
 * @see app/Http/Controllers/Admin/IntegrationController.php:93
 * @route '/admin/integrations/mapbox'
 */
updateMapbox.put = (options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: updateMapbox.url(options),
    method: 'put',
})

    /**
* @see \App\Http\Controllers\Admin\IntegrationController::updateMapbox
 * @see app/Http/Controllers/Admin/IntegrationController.php:93
 * @route '/admin/integrations/mapbox'
 */
    const updateMapboxForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: updateMapbox.url({
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PUT',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\IntegrationController::updateMapbox
 * @see app/Http/Controllers/Admin/IntegrationController.php:93
 * @route '/admin/integrations/mapbox'
 */
        updateMapboxForm.put = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: updateMapbox.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PUT',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    updateMapbox.form = updateMapboxForm
/**
* @see \App\Http\Controllers\Admin\IntegrationController::updateGoogleMaps
 * @see app/Http/Controllers/Admin/IntegrationController.php:123
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
 * @see app/Http/Controllers/Admin/IntegrationController.php:123
 * @route '/admin/integrations/google-maps'
 */
updateGoogleMaps.url = (options?: RouteQueryOptions) => {
    return updateGoogleMaps.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\IntegrationController::updateGoogleMaps
 * @see app/Http/Controllers/Admin/IntegrationController.php:123
 * @route '/admin/integrations/google-maps'
 */
updateGoogleMaps.put = (options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: updateGoogleMaps.url(options),
    method: 'put',
})

    /**
* @see \App\Http\Controllers\Admin\IntegrationController::updateGoogleMaps
 * @see app/Http/Controllers/Admin/IntegrationController.php:123
 * @route '/admin/integrations/google-maps'
 */
    const updateGoogleMapsForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: updateGoogleMaps.url({
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PUT',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\IntegrationController::updateGoogleMaps
 * @see app/Http/Controllers/Admin/IntegrationController.php:123
 * @route '/admin/integrations/google-maps'
 */
        updateGoogleMapsForm.put = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: updateGoogleMaps.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PUT',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    updateGoogleMaps.form = updateGoogleMapsForm
/**
* @see \App\Http\Controllers\Admin\IntegrationController::whatsappIndex
 * @see app/Http/Controllers/Admin/IntegrationController.php:153
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
 * @see app/Http/Controllers/Admin/IntegrationController.php:153
 * @route '/admin/integrations/whatsapp'
 */
whatsappIndex.url = (options?: RouteQueryOptions) => {
    return whatsappIndex.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\IntegrationController::whatsappIndex
 * @see app/Http/Controllers/Admin/IntegrationController.php:153
 * @route '/admin/integrations/whatsapp'
 */
whatsappIndex.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: whatsappIndex.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Admin\IntegrationController::whatsappIndex
 * @see app/Http/Controllers/Admin/IntegrationController.php:153
 * @route '/admin/integrations/whatsapp'
 */
whatsappIndex.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: whatsappIndex.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Admin\IntegrationController::whatsappIndex
 * @see app/Http/Controllers/Admin/IntegrationController.php:153
 * @route '/admin/integrations/whatsapp'
 */
    const whatsappIndexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: whatsappIndex.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Admin\IntegrationController::whatsappIndex
 * @see app/Http/Controllers/Admin/IntegrationController.php:153
 * @route '/admin/integrations/whatsapp'
 */
        whatsappIndexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: whatsappIndex.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Admin\IntegrationController::whatsappIndex
 * @see app/Http/Controllers/Admin/IntegrationController.php:153
 * @route '/admin/integrations/whatsapp'
 */
        whatsappIndexForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: whatsappIndex.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    whatsappIndex.form = whatsappIndexForm
/**
* @see \App\Http\Controllers\Admin\IntegrationController::whatsappStatus
 * @see app/Http/Controllers/Admin/IntegrationController.php:199
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
 * @see app/Http/Controllers/Admin/IntegrationController.php:199
 * @route '/admin/integrations/whatsapp/status'
 */
whatsappStatus.url = (options?: RouteQueryOptions) => {
    return whatsappStatus.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\IntegrationController::whatsappStatus
 * @see app/Http/Controllers/Admin/IntegrationController.php:199
 * @route '/admin/integrations/whatsapp/status'
 */
whatsappStatus.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: whatsappStatus.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Admin\IntegrationController::whatsappStatus
 * @see app/Http/Controllers/Admin/IntegrationController.php:199
 * @route '/admin/integrations/whatsapp/status'
 */
whatsappStatus.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: whatsappStatus.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Admin\IntegrationController::whatsappStatus
 * @see app/Http/Controllers/Admin/IntegrationController.php:199
 * @route '/admin/integrations/whatsapp/status'
 */
    const whatsappStatusForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: whatsappStatus.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Admin\IntegrationController::whatsappStatus
 * @see app/Http/Controllers/Admin/IntegrationController.php:199
 * @route '/admin/integrations/whatsapp/status'
 */
        whatsappStatusForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: whatsappStatus.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Admin\IntegrationController::whatsappStatus
 * @see app/Http/Controllers/Admin/IntegrationController.php:199
 * @route '/admin/integrations/whatsapp/status'
 */
        whatsappStatusForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: whatsappStatus.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    whatsappStatus.form = whatsappStatusForm
/**
* @see \App\Http\Controllers\Admin\IntegrationController::whatsappUpdate
 * @see app/Http/Controllers/Admin/IntegrationController.php:224
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
 * @see app/Http/Controllers/Admin/IntegrationController.php:224
 * @route '/admin/integrations/whatsapp/update'
 */
whatsappUpdate.url = (options?: RouteQueryOptions) => {
    return whatsappUpdate.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\IntegrationController::whatsappUpdate
 * @see app/Http/Controllers/Admin/IntegrationController.php:224
 * @route '/admin/integrations/whatsapp/update'
 */
whatsappUpdate.put = (options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: whatsappUpdate.url(options),
    method: 'put',
})

    /**
* @see \App\Http\Controllers\Admin\IntegrationController::whatsappUpdate
 * @see app/Http/Controllers/Admin/IntegrationController.php:224
 * @route '/admin/integrations/whatsapp/update'
 */
    const whatsappUpdateForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: whatsappUpdate.url({
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PUT',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\IntegrationController::whatsappUpdate
 * @see app/Http/Controllers/Admin/IntegrationController.php:224
 * @route '/admin/integrations/whatsapp/update'
 */
        whatsappUpdateForm.put = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: whatsappUpdate.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PUT',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    whatsappUpdate.form = whatsappUpdateForm
/**
* @see \App\Http\Controllers\Admin\IntegrationController::whatsappGenerateToken
 * @see app/Http/Controllers/Admin/IntegrationController.php:256
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
 * @see app/Http/Controllers/Admin/IntegrationController.php:256
 * @route '/admin/integrations/whatsapp/generate-token'
 */
whatsappGenerateToken.url = (options?: RouteQueryOptions) => {
    return whatsappGenerateToken.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\IntegrationController::whatsappGenerateToken
 * @see app/Http/Controllers/Admin/IntegrationController.php:256
 * @route '/admin/integrations/whatsapp/generate-token'
 */
whatsappGenerateToken.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: whatsappGenerateToken.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Admin\IntegrationController::whatsappGenerateToken
 * @see app/Http/Controllers/Admin/IntegrationController.php:256
 * @route '/admin/integrations/whatsapp/generate-token'
 */
    const whatsappGenerateTokenForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: whatsappGenerateToken.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\IntegrationController::whatsappGenerateToken
 * @see app/Http/Controllers/Admin/IntegrationController.php:256
 * @route '/admin/integrations/whatsapp/generate-token'
 */
        whatsappGenerateTokenForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: whatsappGenerateToken.url(options),
            method: 'post',
        })
    
    whatsappGenerateToken.form = whatsappGenerateTokenForm
/**
* @see \App\Http\Controllers\Admin\IntegrationController::whatsappSync
 * @see app/Http/Controllers/Admin/IntegrationController.php:283
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
 * @see app/Http/Controllers/Admin/IntegrationController.php:283
 * @route '/admin/integrations/whatsapp/sync'
 */
whatsappSync.url = (options?: RouteQueryOptions) => {
    return whatsappSync.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\IntegrationController::whatsappSync
 * @see app/Http/Controllers/Admin/IntegrationController.php:283
 * @route '/admin/integrations/whatsapp/sync'
 */
whatsappSync.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: whatsappSync.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Admin\IntegrationController::whatsappSync
 * @see app/Http/Controllers/Admin/IntegrationController.php:283
 * @route '/admin/integrations/whatsapp/sync'
 */
    const whatsappSyncForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: whatsappSync.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\IntegrationController::whatsappSync
 * @see app/Http/Controllers/Admin/IntegrationController.php:283
 * @route '/admin/integrations/whatsapp/sync'
 */
        whatsappSyncForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: whatsappSync.url(options),
            method: 'post',
        })
    
    whatsappSync.form = whatsappSyncForm
/**
* @see \App\Http\Controllers\Admin\IntegrationController::whatsappConnect
 * @see app/Http/Controllers/Admin/IntegrationController.php:321
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
 * @see app/Http/Controllers/Admin/IntegrationController.php:321
 * @route '/admin/integrations/whatsapp/connect'
 */
whatsappConnect.url = (options?: RouteQueryOptions) => {
    return whatsappConnect.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\IntegrationController::whatsappConnect
 * @see app/Http/Controllers/Admin/IntegrationController.php:321
 * @route '/admin/integrations/whatsapp/connect'
 */
whatsappConnect.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: whatsappConnect.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Admin\IntegrationController::whatsappConnect
 * @see app/Http/Controllers/Admin/IntegrationController.php:321
 * @route '/admin/integrations/whatsapp/connect'
 */
    const whatsappConnectForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: whatsappConnect.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\IntegrationController::whatsappConnect
 * @see app/Http/Controllers/Admin/IntegrationController.php:321
 * @route '/admin/integrations/whatsapp/connect'
 */
        whatsappConnectForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: whatsappConnect.url(options),
            method: 'post',
        })
    
    whatsappConnect.form = whatsappConnectForm
/**
* @see \App\Http\Controllers\Admin\IntegrationController::whatsappDisconnect
 * @see app/Http/Controllers/Admin/IntegrationController.php:351
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
 * @see app/Http/Controllers/Admin/IntegrationController.php:351
 * @route '/admin/integrations/whatsapp/disconnect'
 */
whatsappDisconnect.url = (options?: RouteQueryOptions) => {
    return whatsappDisconnect.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\IntegrationController::whatsappDisconnect
 * @see app/Http/Controllers/Admin/IntegrationController.php:351
 * @route '/admin/integrations/whatsapp/disconnect'
 */
whatsappDisconnect.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: whatsappDisconnect.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Admin\IntegrationController::whatsappDisconnect
 * @see app/Http/Controllers/Admin/IntegrationController.php:351
 * @route '/admin/integrations/whatsapp/disconnect'
 */
    const whatsappDisconnectForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: whatsappDisconnect.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\IntegrationController::whatsappDisconnect
 * @see app/Http/Controllers/Admin/IntegrationController.php:351
 * @route '/admin/integrations/whatsapp/disconnect'
 */
        whatsappDisconnectForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: whatsappDisconnect.url(options),
            method: 'post',
        })
    
    whatsappDisconnect.form = whatsappDisconnectForm
/**
* @see \App\Http\Controllers\Admin\IntegrationController::whatsappReconnect
 * @see app/Http/Controllers/Admin/IntegrationController.php:380
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
 * @see app/Http/Controllers/Admin/IntegrationController.php:380
 * @route '/admin/integrations/whatsapp/reconnect'
 */
whatsappReconnect.url = (options?: RouteQueryOptions) => {
    return whatsappReconnect.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\IntegrationController::whatsappReconnect
 * @see app/Http/Controllers/Admin/IntegrationController.php:380
 * @route '/admin/integrations/whatsapp/reconnect'
 */
whatsappReconnect.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: whatsappReconnect.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Admin\IntegrationController::whatsappReconnect
 * @see app/Http/Controllers/Admin/IntegrationController.php:380
 * @route '/admin/integrations/whatsapp/reconnect'
 */
    const whatsappReconnectForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: whatsappReconnect.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\IntegrationController::whatsappReconnect
 * @see app/Http/Controllers/Admin/IntegrationController.php:380
 * @route '/admin/integrations/whatsapp/reconnect'
 */
        whatsappReconnectForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: whatsappReconnect.url(options),
            method: 'post',
        })
    
    whatsappReconnect.form = whatsappReconnectForm
/**
* @see \App\Http\Controllers\Admin\IntegrationController::whatsappSendMessage
 * @see app/Http/Controllers/Admin/IntegrationController.php:403
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
 * @see app/Http/Controllers/Admin/IntegrationController.php:403
 * @route '/admin/integrations/whatsapp/send-message'
 */
whatsappSendMessage.url = (options?: RouteQueryOptions) => {
    return whatsappSendMessage.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\IntegrationController::whatsappSendMessage
 * @see app/Http/Controllers/Admin/IntegrationController.php:403
 * @route '/admin/integrations/whatsapp/send-message'
 */
whatsappSendMessage.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: whatsappSendMessage.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Admin\IntegrationController::whatsappSendMessage
 * @see app/Http/Controllers/Admin/IntegrationController.php:403
 * @route '/admin/integrations/whatsapp/send-message'
 */
    const whatsappSendMessageForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: whatsappSendMessage.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\IntegrationController::whatsappSendMessage
 * @see app/Http/Controllers/Admin/IntegrationController.php:403
 * @route '/admin/integrations/whatsapp/send-message'
 */
        whatsappSendMessageForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: whatsappSendMessage.url(options),
            method: 'post',
        })
    
    whatsappSendMessage.form = whatsappSendMessageForm
const IntegrationController = { index, mapboxMap, mapboxNavigation, updateMapbox, updateGoogleMaps, whatsappIndex, whatsappStatus, whatsappUpdate, whatsappGenerateToken, whatsappSync, whatsappConnect, whatsappDisconnect, whatsappReconnect, whatsappSendMessage }

export default IntegrationController
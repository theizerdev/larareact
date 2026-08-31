import { queryParams, type RouteQueryOptions, type RouteDefinition } from './../../wayfinder'
/**
* @see routes/larareact-settings.php:30
* @route '/.well-known/passkey-endpoints'
*/
export const passkeys = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: passkeys.url(options),
    method: 'get',
})

passkeys.definition = {
    methods: ["get","head"],
    url: '/.well-known/passkey-endpoints',
} satisfies RouteDefinition<["get","head"]>

/**
* @see routes/larareact-settings.php:30
* @route '/.well-known/passkey-endpoints'
*/
passkeys.url = (options?: RouteQueryOptions) => {
    return passkeys.definition.url + queryParams(options)
}

/**
* @see routes/larareact-settings.php:30
* @route '/.well-known/passkey-endpoints'
*/
passkeys.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: passkeys.url(options),
    method: 'get',
})

/**
* @see routes/larareact-settings.php:30
* @route '/.well-known/passkey-endpoints'
*/
passkeys.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: passkeys.url(options),
    method: 'head',
})

const wellKnown = {
    passkeys: Object.assign(passkeys, passkeys),
}

export default wellKnown
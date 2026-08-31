import { queryParams, type RouteQueryOptions, type RouteDefinition } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Admin\ContabilidadController::setupIndex
* @see app/Http/Controllers/Admin/ContabilidadController.php:28
* @route '/admin/contabilidad/setup'
*/
export const setupIndex = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: setupIndex.url(options),
    method: 'get',
})

setupIndex.definition = {
    methods: ["get","head"],
    url: '/admin/contabilidad/setup',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\ContabilidadController::setupIndex
* @see app/Http/Controllers/Admin/ContabilidadController.php:28
* @route '/admin/contabilidad/setup'
*/
setupIndex.url = (options?: RouteQueryOptions) => {
    return setupIndex.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ContabilidadController::setupIndex
* @see app/Http/Controllers/Admin/ContabilidadController.php:28
* @route '/admin/contabilidad/setup'
*/
setupIndex.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: setupIndex.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\ContabilidadController::setupIndex
* @see app/Http/Controllers/Admin/ContabilidadController.php:28
* @route '/admin/contabilidad/setup'
*/
setupIndex.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: setupIndex.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Admin\ContabilidadController::setupStore
* @see app/Http/Controllers/Admin/ContabilidadController.php:49
* @route '/admin/contabilidad/setup'
*/
export const setupStore = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: setupStore.url(options),
    method: 'post',
})

setupStore.definition = {
    methods: ["post"],
    url: '/admin/contabilidad/setup',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\ContabilidadController::setupStore
* @see app/Http/Controllers/Admin/ContabilidadController.php:49
* @route '/admin/contabilidad/setup'
*/
setupStore.url = (options?: RouteQueryOptions) => {
    return setupStore.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ContabilidadController::setupStore
* @see app/Http/Controllers/Admin/ContabilidadController.php:49
* @route '/admin/contabilidad/setup'
*/
setupStore.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: setupStore.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\ContabilidadController::planCuentas
* @see app/Http/Controllers/Admin/ContabilidadController.php:73
* @route '/admin/contabilidad/plan-cuentas'
*/
export const planCuentas = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: planCuentas.url(options),
    method: 'get',
})

planCuentas.definition = {
    methods: ["get","head"],
    url: '/admin/contabilidad/plan-cuentas',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\ContabilidadController::planCuentas
* @see app/Http/Controllers/Admin/ContabilidadController.php:73
* @route '/admin/contabilidad/plan-cuentas'
*/
planCuentas.url = (options?: RouteQueryOptions) => {
    return planCuentas.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ContabilidadController::planCuentas
* @see app/Http/Controllers/Admin/ContabilidadController.php:73
* @route '/admin/contabilidad/plan-cuentas'
*/
planCuentas.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: planCuentas.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\ContabilidadController::planCuentas
* @see app/Http/Controllers/Admin/ContabilidadController.php:73
* @route '/admin/contabilidad/plan-cuentas'
*/
planCuentas.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: planCuentas.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Admin\ContabilidadController::storeCuenta
* @see app/Http/Controllers/Admin/ContabilidadController.php:98
* @route '/admin/contabilidad/plan-cuentas'
*/
export const storeCuenta = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: storeCuenta.url(options),
    method: 'post',
})

storeCuenta.definition = {
    methods: ["post"],
    url: '/admin/contabilidad/plan-cuentas',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\ContabilidadController::storeCuenta
* @see app/Http/Controllers/Admin/ContabilidadController.php:98
* @route '/admin/contabilidad/plan-cuentas'
*/
storeCuenta.url = (options?: RouteQueryOptions) => {
    return storeCuenta.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ContabilidadController::storeCuenta
* @see app/Http/Controllers/Admin/ContabilidadController.php:98
* @route '/admin/contabilidad/plan-cuentas'
*/
storeCuenta.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: storeCuenta.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\ContabilidadController::asientos
* @see app/Http/Controllers/Admin/ContabilidadController.php:125
* @route '/admin/contabilidad/asientos'
*/
export const asientos = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: asientos.url(options),
    method: 'get',
})

asientos.definition = {
    methods: ["get","head"],
    url: '/admin/contabilidad/asientos',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\ContabilidadController::asientos
* @see app/Http/Controllers/Admin/ContabilidadController.php:125
* @route '/admin/contabilidad/asientos'
*/
asientos.url = (options?: RouteQueryOptions) => {
    return asientos.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ContabilidadController::asientos
* @see app/Http/Controllers/Admin/ContabilidadController.php:125
* @route '/admin/contabilidad/asientos'
*/
asientos.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: asientos.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\ContabilidadController::asientos
* @see app/Http/Controllers/Admin/ContabilidadController.php:125
* @route '/admin/contabilidad/asientos'
*/
asientos.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: asientos.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Admin\ContabilidadController::storeAsientoManual
* @see app/Http/Controllers/Admin/ContabilidadController.php:171
* @route '/admin/contabilidad/asientos'
*/
export const storeAsientoManual = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: storeAsientoManual.url(options),
    method: 'post',
})

storeAsientoManual.definition = {
    methods: ["post"],
    url: '/admin/contabilidad/asientos',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\ContabilidadController::storeAsientoManual
* @see app/Http/Controllers/Admin/ContabilidadController.php:171
* @route '/admin/contabilidad/asientos'
*/
storeAsientoManual.url = (options?: RouteQueryOptions) => {
    return storeAsientoManual.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ContabilidadController::storeAsientoManual
* @see app/Http/Controllers/Admin/ContabilidadController.php:171
* @route '/admin/contabilidad/asientos'
*/
storeAsientoManual.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: storeAsientoManual.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\ContabilidadController::mayor
* @see app/Http/Controllers/Admin/ContabilidadController.php:235
* @route '/admin/contabilidad/mayor'
*/
export const mayor = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: mayor.url(options),
    method: 'get',
})

mayor.definition = {
    methods: ["get","head"],
    url: '/admin/contabilidad/mayor',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\ContabilidadController::mayor
* @see app/Http/Controllers/Admin/ContabilidadController.php:235
* @route '/admin/contabilidad/mayor'
*/
mayor.url = (options?: RouteQueryOptions) => {
    return mayor.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ContabilidadController::mayor
* @see app/Http/Controllers/Admin/ContabilidadController.php:235
* @route '/admin/contabilidad/mayor'
*/
mayor.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: mayor.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\ContabilidadController::mayor
* @see app/Http/Controllers/Admin/ContabilidadController.php:235
* @route '/admin/contabilidad/mayor'
*/
mayor.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: mayor.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Admin\ContabilidadController::reportes
* @see app/Http/Controllers/Admin/ContabilidadController.php:267
* @route '/admin/contabilidad/reportes'
*/
export const reportes = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: reportes.url(options),
    method: 'get',
})

reportes.definition = {
    methods: ["get","head"],
    url: '/admin/contabilidad/reportes',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\ContabilidadController::reportes
* @see app/Http/Controllers/Admin/ContabilidadController.php:267
* @route '/admin/contabilidad/reportes'
*/
reportes.url = (options?: RouteQueryOptions) => {
    return reportes.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ContabilidadController::reportes
* @see app/Http/Controllers/Admin/ContabilidadController.php:267
* @route '/admin/contabilidad/reportes'
*/
reportes.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: reportes.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\ContabilidadController::reportes
* @see app/Http/Controllers/Admin/ContabilidadController.php:267
* @route '/admin/contabilidad/reportes'
*/
reportes.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: reportes.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Admin\ContabilidadController::impuestos
* @see app/Http/Controllers/Admin/ContabilidadController.php:366
* @route '/admin/contabilidad/impuestos'
*/
export const impuestos = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: impuestos.url(options),
    method: 'get',
})

impuestos.definition = {
    methods: ["get","head"],
    url: '/admin/contabilidad/impuestos',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\ContabilidadController::impuestos
* @see app/Http/Controllers/Admin/ContabilidadController.php:366
* @route '/admin/contabilidad/impuestos'
*/
impuestos.url = (options?: RouteQueryOptions) => {
    return impuestos.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ContabilidadController::impuestos
* @see app/Http/Controllers/Admin/ContabilidadController.php:366
* @route '/admin/contabilidad/impuestos'
*/
impuestos.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: impuestos.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\ContabilidadController::impuestos
* @see app/Http/Controllers/Admin/ContabilidadController.php:366
* @route '/admin/contabilidad/impuestos'
*/
impuestos.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: impuestos.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Admin\ContabilidadController::cierreEjercicio
* @see app/Http/Controllers/Admin/ContabilidadController.php:210
* @route '/admin/contabilidad/cierre-ejercicio'
*/
export const cierreEjercicio = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: cierreEjercicio.url(options),
    method: 'post',
})

cierreEjercicio.definition = {
    methods: ["post"],
    url: '/admin/contabilidad/cierre-ejercicio',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\ContabilidadController::cierreEjercicio
* @see app/Http/Controllers/Admin/ContabilidadController.php:210
* @route '/admin/contabilidad/cierre-ejercicio'
*/
cierreEjercicio.url = (options?: RouteQueryOptions) => {
    return cierreEjercicio.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ContabilidadController::cierreEjercicio
* @see app/Http/Controllers/Admin/ContabilidadController.php:210
* @route '/admin/contabilidad/cierre-ejercicio'
*/
cierreEjercicio.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: cierreEjercicio.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\ContabilidadController::exportarExcelCompleto
* @see app/Http/Controllers/Admin/ContabilidadController.php:492
* @route '/admin/contabilidad/exportar-excel'
*/
export const exportarExcelCompleto = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: exportarExcelCompleto.url(options),
    method: 'get',
})

exportarExcelCompleto.definition = {
    methods: ["get","head"],
    url: '/admin/contabilidad/exportar-excel',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\ContabilidadController::exportarExcelCompleto
* @see app/Http/Controllers/Admin/ContabilidadController.php:492
* @route '/admin/contabilidad/exportar-excel'
*/
exportarExcelCompleto.url = (options?: RouteQueryOptions) => {
    return exportarExcelCompleto.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ContabilidadController::exportarExcelCompleto
* @see app/Http/Controllers/Admin/ContabilidadController.php:492
* @route '/admin/contabilidad/exportar-excel'
*/
exportarExcelCompleto.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: exportarExcelCompleto.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\ContabilidadController::exportarExcelCompleto
* @see app/Http/Controllers/Admin/ContabilidadController.php:492
* @route '/admin/contabilidad/exportar-excel'
*/
exportarExcelCompleto.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: exportarExcelCompleto.url(options),
    method: 'head',
})

const ContabilidadController = { setupIndex, setupStore, planCuentas, storeCuenta, asientos, storeAsientoManual, mayor, reportes, impuestos, cierreEjercicio, exportarExcelCompleto }

export default ContabilidadController
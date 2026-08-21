import garita from './garita'
import visitasAccesos from './visitas-accesos'
import cargos from './cargos'
import monitoring from './monitoring'
import departamentos from './departamentos'
import empleados from './empleados'
import empresas from './empresas'
import integrations from './integrations'
import paises from './paises'
import productores from './productores'
import proveedores from './proveedores'
import responsables from './responsables'
import roles from './roles'
import sucursales from './sucursales'
import usuarios from './usuarios'
import visitasTemporales from './visitas-temporales'
import tipoServicios from './tipo-servicios'
const admin = {
    garita: Object.assign(garita, garita),
visitasAccesos: Object.assign(visitasAccesos, visitasAccesos),
cargos: Object.assign(cargos, cargos),
monitoring: Object.assign(monitoring, monitoring),
departamentos: Object.assign(departamentos, departamentos),
empleados: Object.assign(empleados, empleados),
empresas: Object.assign(empresas, empresas),
integrations: Object.assign(integrations, integrations),
paises: Object.assign(paises, paises),
productores: Object.assign(productores, productores),
proveedores: Object.assign(proveedores, proveedores),
responsables: Object.assign(responsables, responsables),
roles: Object.assign(roles, roles),
sucursales: Object.assign(sucursales, sucursales),
usuarios: Object.assign(usuarios, usuarios),
visitasTemporales: Object.assign(visitasTemporales, visitasTemporales),
tipoServicios: Object.assign(tipoServicios, tipoServicios),
}

export default admin
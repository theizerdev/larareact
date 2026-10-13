import monitoring from './monitoring'
import empresas from './empresas'
import integrations from './integrations'
import paises from './paises'
import roles from './roles'
import sucursales from './sucursales'
import usuarios from './usuarios'
const admin = {
    monitoring: Object.assign(monitoring, monitoring),
    empresas: Object.assign(empresas, empresas),
    integrations: Object.assign(integrations, integrations),
    paises: Object.assign(paises, paises),
    roles: Object.assign(roles, roles),
    sucursales: Object.assign(sucursales, sucursales),
    usuarios: Object.assign(usuarios, usuarios),
}

export default admin
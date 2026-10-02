import Auth from './Auth'
import Admin from './Admin'
import ProveedorPreRegistroController from './ProveedorPreRegistroController'
import ProductorPreRegistroController from './ProductorPreRegistroController'
import EmpleadoPreRegistroController from './EmpleadoPreRegistroController'
import VisitaTemporalPreRegistroController from './VisitaTemporalPreRegistroController'
import VisitaAccesoAutorizacionController from './VisitaAccesoAutorizacionController'
import Settings from './Settings'
const Controllers = {
    Auth: Object.assign(Auth, Auth),
Admin: Object.assign(Admin, Admin),
ProveedorPreRegistroController: Object.assign(ProveedorPreRegistroController, ProveedorPreRegistroController),
ProductorPreRegistroController: Object.assign(ProductorPreRegistroController, ProductorPreRegistroController),
EmpleadoPreRegistroController: Object.assign(EmpleadoPreRegistroController, EmpleadoPreRegistroController),
VisitaTemporalPreRegistroController: Object.assign(VisitaTemporalPreRegistroController, VisitaTemporalPreRegistroController),
VisitaAccesoAutorizacionController: Object.assign(VisitaAccesoAutorizacionController, VisitaAccesoAutorizacionController),
Settings: Object.assign(Settings, Settings),
}

export default Controllers
import Auth from './Auth'
import Admin from './Admin'
import ProveedorPreRegistroController from './ProveedorPreRegistroController'
import EmpleadoPreRegistroController from './EmpleadoPreRegistroController'
import VisitaTemporalPreRegistroController from './VisitaTemporalPreRegistroController'
import Settings from './Settings'
const Controllers = {
    Auth: Object.assign(Auth, Auth),
Admin: Object.assign(Admin, Admin),
ProveedorPreRegistroController: Object.assign(ProveedorPreRegistroController, ProveedorPreRegistroController),
EmpleadoPreRegistroController: Object.assign(EmpleadoPreRegistroController, EmpleadoPreRegistroController),
VisitaTemporalPreRegistroController: Object.assign(VisitaTemporalPreRegistroController, VisitaTemporalPreRegistroController),
Settings: Object.assign(Settings, Settings),
}

export default Controllers
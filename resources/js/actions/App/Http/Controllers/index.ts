import Auth from './Auth'
import Publico from './Publico'
import Admin from './Admin'
import Settings from './Settings'
const Controllers = {
    Auth: Object.assign(Auth, Auth),
Publico: Object.assign(Publico, Publico),
Admin: Object.assign(Admin, Admin),
Settings: Object.assign(Settings, Settings),
}

export default Controllers
import {NivelActividad} from './nivel-actividad';
import {User} from './user';

export class UsuarioInformacion {
 usuarioId: User = new User();
 fechaNacimiento: Date = new Date();
 alturaCm: number = 0;
 pesoKg: number = 0;
 nivelActividad: NivelActividad = new NivelActividad();
}

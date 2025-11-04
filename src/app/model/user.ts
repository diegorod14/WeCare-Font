export class User {
  id: number = 0;
  username: String = "";
  password?: string; // Opcional, solo para registro/login
  correo: String = "";
  celular: number = 0;
  nombres: string = "";
  apellido: string = "";
  fecha_creacion: Date = new Date();
  fecha_actualizacion: Date = new Date();
}



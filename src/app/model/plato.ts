import { User } from './user';

export class Plato {
  id: number;
  nombre: string;
  informacion: string;
  esFavorito: boolean;
  User: User = new User();
}


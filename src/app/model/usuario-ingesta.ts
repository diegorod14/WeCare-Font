import {User} from './user';

export class UsuarioIngesta {
  usuarioId: User = new User();
  pesoIdeal: number = 0;
  imc: number = 0;
  ingestaDiariaCalorias : number = 0;
  ingestaDiariaProteina: number = 0;
  ingestaDiariaCarbohidrato: number = 0;
  ingestaDiariaGrasa: number = 0;
}

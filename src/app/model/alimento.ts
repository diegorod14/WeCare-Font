import { Categoria } from './categoria';

export class Alimento {
  id: number = 0;
  nombre: string = '';
  proteina: number = 0;
  carbohidrato: number = 0;
  grasa: number = 0;
  calorias: number = 0;
  fibra: number = 0;
  categoria: Categoria = new Categoria();
}

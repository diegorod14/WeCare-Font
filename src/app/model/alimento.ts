import { Categoria } from './categoria';

export class Alimento {
  idAlimento: number = 0;
  nombre: string = '';
  proteinas: number = 0;
  carbohidratos: number = 0;
  grasas: number = 0;
  calorias: number = 0;
  fibra: number = 0;
  categoria: Categoria = new Categoria();
}

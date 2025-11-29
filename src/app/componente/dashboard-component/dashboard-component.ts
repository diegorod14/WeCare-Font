import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { UsuarioInformacion } from '../../model/usuario-informacion';
import { UsuarioIngesta } from '../../model/usuario-ingesta';
import { Objetivo } from '../../model/objetivo';
import { UsuarioService } from '../../services/user-service';
import { UsuarioInformacionService } from '../../services/usuario-informacion-service';
import { UsuarioIngestaService } from '../../services/usuario-ingesta-service';
import { UsuarioObjetivoServices } from '../../services/usuario-objetivo-services';
import { ObjetivoServices } from '../../services/objetivo-services';

interface MacroItem {
  label: string;
  value: number;
  percent: number; // Agregamos el porcentaje numérico
  color: string;
}

@Component({
  selector: 'app-dashboard-component',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  templateUrl: './dashboard-component.html',
  styleUrl: './dashboard-component.css'
})
export class DashboardComponent implements OnInit {
  usuarioInformacion: UsuarioInformacion = new UsuarioInformacion();
  usuarioIngesta: UsuarioIngesta = new UsuarioIngesta();
  objetivo: Objetivo = new Objetivo();

  nombreUsuario = 'Usuario';
  pesoActual = 0;
  pesoIdeal = 0;
  imc = 0;
  pesoMensaje = '';

  totalCalorias = 0;
  macros: MacroItem[] = [];
  macroPieGradient = '';

  // Colores (Extraídos de tu imagen referencia)
  readonly COLORS = {
    pro: '#66bb6a', // Verde
    carb: '#ffca28', // Amarillo
    fat: '#ef5350'   // Rojo
  };

  private usuarioService = inject(UsuarioService);
  private usuarioInfoService = inject(UsuarioInformacionService);
  private usuarioIngestaService = inject(UsuarioIngestaService);
  private usuarioObjService = inject(UsuarioObjetivoServices);
  private objetivoService = inject(ObjetivoServices);

  ngOnInit(): void {
    this.cargarDatosCompletos();
  }

  cargarDatosCompletos(): void {
    const token = localStorage.getItem('token');
    const userId = this.extractUserIdFromToken(token);
    if (userId) {
      this.cargarDatos(userId);
    } else {
      const userIdFromStorage = Number(localStorage.getItem('userId'));
      if (userIdFromStorage) {
        this.cargarDatos(userIdFromStorage);
      }
    }
  }

  private cargarDatos(userId: number): void {
    this.usuarioService.listId(userId).subscribe({
      next: (u: any) => this.nombreUsuario = u.nombres || 'Usuario',
      error: (err: any) => console.error('Error cargando usuario', err)
    });

    this.usuarioInfoService.listId(userId).subscribe({
      next: (info: any) => {
        this.usuarioInformacion = info;
        this.pesoActual = info.pesoKg;
        this.calcularDerivados();
      },
      error: (err: any) => console.error('Error cargando información usuario', err)
    });

    this.usuarioIngestaService.update(userId).subscribe({
      next: (ingesta: any) => {
        this.usuarioIngesta = ingesta;
        this.pesoIdeal = ingesta.pesoIdeal;
        this.imc = ingesta.imc;
        this.calcularDerivados();
        console.log('Datos de ingesta recalculados desde el servidor:', ingesta);
      },
      error: (err: any) => console.error('Error actualizando ingesta usuario', err)
    });

    this.usuarioObjService.findByUsuarioId(userId).subscribe({
      next: (objs: any) => {
        if (objs && objs.length > 0) {
          this.objetivoService.findById(objs[objs.length - 1].objetivo_id).subscribe({
            next: (obj: any) => this.objetivo = obj,
            error: (err: any) => console.error('Error cargando objetivo', err)
          });
        }
      },
      error: (err: any) => console.error('Error cargando objetivos usuario', err)
    });
  }

  private calcularDerivados(): void {
    // 1. Peso y Mensajes
    const diff = Math.abs(this.pesoActual - this.pesoIdeal);
    if (diff <= 1) this.pesoMensaje = 'Mantén el enfoque, ¡estás excelente!';
    else if (diff <= 3) this.pesoMensaje = '¡Estás muy cerca, un último esfuerzo!';
    else this.pesoMensaje = 'Tienes camino por recorrer, ¡tú puedes!';

    // 2. Datos Macros
    this.totalCalorias = this.usuarioIngesta.ingestaDiariaCalorias || 0;

    const pro = this.usuarioIngesta.ingestaDiariaProteina || 0;
    const carb = this.usuarioIngesta.ingestaDiariaCarbohidrato || 0;
    const fat = this.usuarioIngesta.ingestaDiariaGrasa || 0;

    // Calcular porcentajes reales basados en gramos totales (para la leyenda y gráfico)
    const totalGrams = (pro + carb + fat) || 1;

    const pPro = (pro / totalGrams) * 100;
    const pCarb = (carb / totalGrams) * 100;
    const pFat = (fat / totalGrams) * 100;

    this.macros = [
      { label: 'Proteína', value: pro, percent: pPro, color: this.COLORS.pro },
      { label: 'Carbohidratos', value: carb, percent: pCarb, color: this.COLORS.carb },
      { label: 'Grasas', value: fat, percent: pFat, color: this.COLORS.fat }
    ];

    // 3. Gradiente Gráfico (Lógica acumulativa para conic-gradient)
    // El gráfico empieza en 0. Proteína va de 0 a X. Carbo de X a Y. Grasa de Y a 100.
    this.macroPieGradient = `conic-gradient(
      ${this.COLORS.pro} 0% ${pPro}%,
      ${this.COLORS.carb} ${pPro}% ${pPro + pCarb}%,
      ${this.COLORS.fat} ${pPro + pCarb}% 100%
    )`;
  }

  private extractUserIdFromToken(token: string | null): number | null {
    if (!token) return null;
    try {
      return JSON.parse(atob(token.split('.')[1]))?.userId || null;
    } catch { return null; }
  }
}

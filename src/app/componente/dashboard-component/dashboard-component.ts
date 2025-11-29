import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatButtonModule } from '@angular/material/button';
import { Objetivo } from '../../model/objetivo';
import { UsuarioInformacion } from '../../model/usuario-informacion';
import { UsuarioIngesta } from '../../model/usuario-ingesta';
import { UsuarioInformacionService } from '../../services/usuario-informacion-service';
import { UsuarioIngestaService } from '../../services/usuario-ingesta-service';
import { UsuarioObjetivoServices } from '../../services/usuario-objetivo-services';
import { ObjetivoServices } from '../../services/objetivo-services';
import { UsuarioService } from '../../services/user-service';

interface MacroRow {
  key: string;
  label: string;
  value: number;
  percent: number;
  color: string; // Agregamos color para vincular barra con gráfico
}

@Component({
  selector: 'app-dashboard-component',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatProgressBarModule,
    MatDividerModule,
    MatButtonModule
  ],
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

  pesoProgress = 0;
  pesoMensaje = '';

  macros: MacroRow[] = [];
  macroPieGradient = '';

  // Colores para: Calorías(Azul), Proteína(Verde), Carbos(Amarillo), Grasas(Rojo)
  readonly COLORES_MACROS = ['#42a5f5', '#66bb6a', '#ffca28', '#ef5350'];

  private usuarioInformacionService = inject(UsuarioInformacionService);
  private usuarioIngestaService = inject(UsuarioIngestaService);
  private usuarioObjetivoService = inject(UsuarioObjetivoServices);
  private objetivoService = inject(ObjetivoServices);
  private usuarioService = inject(UsuarioService);

  ngOnInit(): void {
    const token = localStorage.getItem('token');
    const userId = this.extractUserIdFromToken(token);

    if (!userId) {
      console.error('No se pudo obtener userId del token');
      return;
    }

    this.cargarDatos(userId);
  }

  private cargarDatos(userId: number): void {
    // Cargar Usuario (Nombre)
    this.usuarioService.listId(userId).subscribe({
      next: (user) => { this.nombreUsuario = user.nombres || 'Usuario'; },
      error: (err) => console.error(err)
    });

    // Cargar Info (Peso actual)
    this.usuarioInformacionService.listId(userId).subscribe({
      next: (info) => {
        this.usuarioInformacion = info;
        this.pesoActual = info.pesoKg;
        this.checkDataLoaded();
      },
      error: (err) => console.error(err)
    });

    // Cargar Ingesta (Metas, IMC)
    this.usuarioIngestaService.listId(userId).subscribe({
      next: (ingesta) => {
        this.usuarioIngesta = ingesta;
        this.pesoIdeal = ingesta.pesoIdeal;
        this.imc = ingesta.imc;
        this.checkDataLoaded();
      },
      error: (err) => console.error(err)
    });

    // Cargar Objetivo
    this.usuarioObjetivoService.findByUsuarioId(userId).subscribe({
      next: (objetivos) => {
        if (objetivos && objetivos.length > 0) {
          const ultimoObjetivo = objetivos[objetivos.length - 1];
          this.objetivoService.findById(ultimoObjetivo.objetivo_id).subscribe({
            next: (obj) => {
              this.objetivo = obj;
              this.checkDataLoaded();
            },
            error: (err) => console.error(err)
          });
        }
      },
      error: (err) => console.error(err)
    });
  }

  private checkDataLoaded(): void {
    if (this.pesoActual > 0 || this.pesoIdeal > 0) {
      this.calcularDerivados();
    }
  }

  private extractUserIdFromToken(token: string | null): number | null {
    if (!token) return null;
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const payload = JSON.parse(atob(parts[1]));
      return payload?.userId || null;
    } catch (e) {
      return null;
    }
  }

  private calcularDerivados(): void {
    // Recalcular valores locales
    this.pesoActual = this.usuarioInformacion.pesoKg || 0;
    this.pesoIdeal = this.usuarioIngesta.pesoIdeal || 0;
    this.imc = this.usuarioIngesta.imc || 0;

    // 1. Mensaje de Peso
    const diff = Math.abs(this.pesoActual - this.pesoIdeal);
    if (diff <= 1) {
      this.pesoMensaje = '¡Estás en tu peso ideal, excelente trabajo!';
    } else if (diff <= 3) {
      this.pesoMensaje = '¡Estás muy cerca, un último esfuerzo!';
    } else {
      this.pesoMensaje = 'Tienes camino por recorrer, ¡tú puedes!';
    }

    // 2. Progreso de Peso (Lógica visual)
    if (this.pesoIdeal > 0) {
      if (this.pesoActual <= this.pesoIdeal) {
        // Si ya llegaste o pesas menos (para perdida de peso)
        // Ojo: Si el objetivo es subir, la lógica seria inversa.
        // Asumiremos lógica general de "acercamiento"
        this.pesoProgress = 100;
      } else {
        // Ejemplo: Peso 100, Ideal 70. Max esperado visual 120.
        const baseVisual = this.pesoIdeal * 1.5;
        const totalRange = baseVisual - this.pesoIdeal;
        const currentPosition = baseVisual - this.pesoActual;
        this.pesoProgress = Math.max(0, Math.min(100, (currentPosition / totalRange) * 100));
      }
    }

    // 3. Macros
    const cal = this.usuarioIngesta.ingestaDiariaCalorias || 0;
    const pro = this.usuarioIngesta.ingestaDiariaProteina || 0;
    const carb = this.usuarioIngesta.ingestaDiariaCarbohidrato || 0;
    const fat = this.usuarioIngesta.ingestaDiariaGrasa || 0;

    const totalMass = pro + carb + fat || 1; // Para porcentajes relativos de macros (excluyendo calorias de la suma de masa)
    // O usamos el total calórico, pero visualmente suele ser masa g.
    // Usaremos la lógica de tu código anterior:
    const totalCalc = cal + pro + carb + fat || 1;

    this.macros = [
      { key: 'calorias', label: 'Calorías', value: cal, percent: 100, color: this.COLORES_MACROS[0] }, // Calorias siempre barra llena o ref
      { key: 'proteina', label: 'Proteína', value: pro, percent: (pro * 100) / totalCalc * 4, color: this.COLORES_MACROS[1] }, // *4 visual fix
      { key: 'carbohidratos', label: 'Carbohidratos', value: carb, percent: (carb * 100) / totalCalc * 4, color: this.COLORES_MACROS[2] },
      { key: 'grasas', label: 'Grasas', value: fat, percent: (fat * 100) / totalCalc * 4, color: this.COLORES_MACROS[3] }
    ];

    // Ajuste porcentual para el gráfico de torta (solo macros, sin calorias)
    const pieTotal = pro + carb + fat || 1;
    const pieData = [
      { percent: 0, color: this.COLORES_MACROS[0] }, // Skip calorias en pie chart visualmente o usarlo de fondo
      { percent: (pro / pieTotal), color: this.COLORES_MACROS[1] },
      { percent: (carb / pieTotal), color: this.COLORES_MACROS[2] },
      { percent: (fat / pieTotal), color: this.COLORES_MACROS[3] }
    ];

    this.macroPieGradient = this.buildMacroPieGradient(pieData);
  }

  private buildMacroPieGradient(data: { percent: number, color: string }[]): string {
    let currentAngle = 0;
    const stops: string[] = [];

    // Ignoramos el indice 0 (calorias) para el pie chart de macros
    for(let i = 1; i < data.length; i++) {
      const start = currentAngle;
      const end = currentAngle + (data[i].percent * 100);
      currentAngle = end;
      stops.push(`${data[i].color} ${start}% ${end}%`);
    }

    // Rellenar resto si falta (por redondeo)
    if (currentAngle < 100) {
      stops.push(`${data[data.length-1].color} ${currentAngle}% 100%`);
    }

    return `conic-gradient(${stops.join(', ')})`;
  }
}

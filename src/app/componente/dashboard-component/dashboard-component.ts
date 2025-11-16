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
    this.usuarioService.listId(userId).subscribe({
      next: (user) => {
        this.nombreUsuario = user.nombres || 'Usuario';
      },
      error: (err) => console.error('Error cargando usuario:', err)
    });

    this.usuarioInformacionService.listId(userId).subscribe({
      next: (info) => {
        this.usuarioInformacion = info;
        this.pesoActual = info.pesoKg;
        this.checkDataLoaded();
      },
      error: (err) => console.error('Error cargando usuario-informacion:', err)
    });

    this.usuarioIngestaService.listId(userId).subscribe({
      next: (ingesta) => {
        this.usuarioIngesta = ingesta;
        this.pesoIdeal = ingesta.pesoIdeal;
        this.imc = ingesta.imc;
        this.checkDataLoaded();
      },
      error: (err) => console.error('Error cargando usuario-ingesta:', err)
    });

    this.usuarioObjetivoService.findByUsuarioId(userId).subscribe({
      next: (objetivos) => {
        if (objetivos && objetivos.length > 0) {
          const ultimoObjetivo = objetivos[objetivos.length - 1];
          const objetivoId = ultimoObjetivo.objetivo_id;

          this.objetivoService.findById(objetivoId).subscribe({
            next: (obj) => {
              this.objetivo = obj;
              this.checkDataLoaded();
            },
            error: (err) => console.error('Error cargando objetivo:', err)
          });
        }
      },
      error: (err) => console.error('Error cargando usuario-objetivo:', err)
    });
  }

  private checkDataLoaded(): void {
    if (this.pesoActual > 0 && this.pesoIdeal > 0 && this.imc > 0) {
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
      console.error('Error decodificando token:', e);
      return null;
    }
  }

  private calcularDerivados(): void {
    this.pesoActual = this.usuarioInformacion.pesoKg;
    this.pesoIdeal = this.usuarioIngesta.pesoIdeal;
    this.imc = this.usuarioIngesta.imc;

    const diff = Math.abs(this.pesoActual - this.pesoIdeal);
    if (diff <= 3) {
      this.pesoMensaje = '¡Estás muy cerca!';
    } else if (diff <= 8) {
      this.pesoMensaje = 'Estás cerca, sigue así';
    } else {
      this.pesoMensaje = 'Tienes camino por recorrer, ¡tú puedes!';
    }

    if (this.pesoActual <= this.pesoIdeal) {
      this.pesoProgress = 100;
    } else {
      const pesoMaximoEsperado = this.pesoIdeal * 1.5;

      if (this.pesoActual >= pesoMaximoEsperado) {
        this.pesoProgress = 0;
      } else {
        const rangoTotal = pesoMaximoEsperado - this.pesoIdeal;
        const avance = pesoMaximoEsperado - this.pesoActual;
        this.pesoProgress = (avance / rangoTotal) * 100;
      }
    }

    console.log('=== CÁLCULO DE PROGRESO ===');
    console.log('Peso actual:', this.pesoActual, 'kg');
    console.log('Peso ideal:', this.pesoIdeal, 'kg');
    console.log('Peso máximo esperado:', this.pesoIdeal * 1.5, 'kg');
    console.log('Falta por perder:', Math.max(0, this.pesoActual - this.pesoIdeal), 'kg');
    console.log('Progreso calculado:', this.pesoProgress.toFixed(2), '%');
    console.log('===========================');

    const calorias = this.usuarioIngesta.ingestaDiariaCalorias;
    const proteina = this.usuarioIngesta.ingestaDiariaProteina;
    const carbohidratos = this.usuarioIngesta.ingestaDiariaCarbohidrato;
    const grasas = this.usuarioIngesta.ingestaDiariaGrasa;

    const total = calorias + proteina + carbohidratos + grasas || 1;

    this.macros = [
      { key: 'calorias', label: 'Calorías', value: calorias, percent: (calorias * 100) / total },
      { key: 'proteina', label: 'Proteína', value: proteina, percent: (proteina * 100) / total },
      { key: 'carbohidratos', label: 'Carbohidratos', value: carbohidratos, percent: (carbohidratos * 100) / total },
      { key: 'grasas', label: 'Grasas', value: grasas, percent: (grasas * 100) / total }
    ];

    this.macroPieGradient = this.buildMacroPieGradient(this.macros);
  }

  private buildMacroPieGradient(data: MacroRow[]): string {
    const totalPercent = data.reduce((acc, m) => acc + m.percent, 0) || 1;
    let current = 0;
    const colores = ['#42a5f5', '#66bb6a', '#ffca28', '#ef5350'];

    const stops: string[] = data.map((m, index) => {
      const start = current;
      const end = current + (m.percent * 100) / totalPercent;
      current = end;
      const color = colores[index] || '#ccc';
      return `${color} ${start}% ${end}%`;
    });

    return `conic-gradient(${stops.join(', ')})`;
  }
}

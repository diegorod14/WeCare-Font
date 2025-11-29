import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UsuarioInformacion } from '../../model/usuario-informacion';
import { UsuarioIngesta } from '../../model/usuario-ingesta';
import { UsuarioObjetivo } from '../../model/usuario-objetivo';
import { Objetivo } from '../../model/objetivo';
import { User } from '../../model/user';
import { NivelActividad } from '../../model/nivel-actividad';
import { UsuarioInformacionService } from '../../services/usuario-informacion-service';
import { UsuarioIngestaService } from '../../services/usuario-ingesta-service';
import { UsuarioObjetivoServices } from '../../services/usuario-objetivo-services';
import { ObjetivoServices } from '../../services/objetivo-services';
import { MatCard, MatCardContent, MatCardSubtitle, MatCardTitle } from '@angular/material/card';
import { CommonModule, NgIf } from '@angular/common';
import { NivelActividadService } from '../../services/nivel-actividad-service';
import { UsuarioService } from '../../services/user-service';
import { CitaService } from '../../services/cita-service';

@Component({
  selector: 'app-usuario-info',
  standalone: true,
  templateUrl: './usuario-info-component.html',
  styleUrls: ['./usuario-info-component.css'],
  imports: [
    CommonModule,
    MatCardContent,
    MatCardTitle,
    MatCard,
    MatCardSubtitle,
    NgIf
  ]
})
export class UsuarioInfoComponent implements OnInit {
  usuarioId!: number;

  info?: UsuarioInformacion;
  ingesta?: UsuarioIngesta;
  usuarioObjetivo?: UsuarioObjetivo;
  objetivoDetalle?: Objetivo;

  usuario?: User;
  nivelActividad?: NivelActividad;

  citasUsuario: any[] = [];
  nutricionistaId?: number;

  edad?: number;

  macrosTotal = 0;
  macrosPercent = {
    proteina: 0,
    carbohidrato: 0,
    grasa: 0,
  };

  chartGradient: string = '';

  pesoDifference = 0;

  isLoading = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private infoService: UsuarioInformacionService,
    private ingestaService: UsuarioIngestaService,
    private usuarioObjetivoService: UsuarioObjetivoServices,
    private objetivoService: ObjetivoServices,
    private nivelActividadService: NivelActividadService,
    private usuarioService: UsuarioService,
    private citaService: CitaService
  ) {}

  ngOnInit(): void {
    this.usuarioId = Number(this.route.snapshot.paramMap.get('id'));
    this.nutricionistaId = this.extractNutricionistaIdFromToken();
    this.cargarDatos();
  }

  private extractNutricionistaIdFromToken(): number | undefined {
    const token = localStorage.getItem('token');
    if (!token) return undefined;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.nutricionistaId || payload.userId;
    } catch {
      return undefined;
    }
  }

  private cargarDatos(): void {
    this.isLoading = true;

    // reset de datos dependientes para evitar "memoria" entre usuarios
    this.info = undefined;
    this.ingesta = undefined;
    this.usuario = undefined;
    this.nivelActividad = undefined;
    this.usuarioObjetivo = undefined;
    this.objetivoDetalle = undefined;
    this.pesoDifference = 0;

    this.infoService.listId(this.usuarioId).subscribe((info: UsuarioInformacion) => {
      this.info = info;
      console.log('UsuarioInformacion cargada:', info);
      this.edad = this.calcularEdad(info.fechaNacimiento);

      // cargar datos del usuario
      const uid = info.usuarioId;
      if (uid) {
        this.usuarioService.listId(uid).subscribe((user: User) => {
          this.usuario = user;
          console.log('Usuario cargado:', user);
        });
      }

      // cargar nivel de actividad por id
      const nivelId = info.nivelActividadId;
      if (nivelId) {
        this.nivelActividadService.listId(nivelId).subscribe((nivel) => {
          this.nivelActividad = nivel;
        });
      }
    });

    this.ingestaService.listId(this.usuarioId).subscribe((ingesta: UsuarioIngesta) => {
      this.ingesta = ingesta;
      this.calcularMacros(ingesta);
    });

    this.usuarioObjetivoService
      .findByUsuarioId(this.usuarioId)
      .subscribe((uoArray: any[]) => {
        if (uoArray && uoArray.length > 0) {
          this.usuarioObjetivo = uoArray[0];

          if (this.usuarioObjetivo && this.usuarioObjetivo.objetivo_id) {
            this.objetivoService
              .findById(this.usuarioObjetivo.objetivo_id)
              .subscribe((obj: Objetivo) => (this.objetivoDetalle = obj));
          }
        }
      });

    if (this.nutricionistaId) {
      this.citaService.findByNutricionistaIdAndUsuarioId(this.nutricionistaId, this.usuarioId).subscribe({
        next: (citas: any[]) => {
          this.citasUsuario = citas;
          console.log('Citas cargadas entre nutricionista y usuario:', this.citasUsuario);
        },
        error: (err: any) => console.error('Error cargando citas', err)
      });
    }

    this.isLoading = false;
  }

  private calcularEdad(fechaNacimiento: Date | string): number {
    if (!fechaNacimiento) return 0;
    const fn = new Date(fechaNacimiento);
    const hoy = new Date();
    let edad = hoy.getFullYear() - fn.getFullYear();
    const m = hoy.getMonth() - fn.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < fn.getDate())) {
      edad--;
    }
    return edad;
  }

  private calcularMacros(ingesta: UsuarioIngesta): void {
    const p = Number(ingesta.ingestaDiariaProteina) || 0;
    const c = Number(ingesta.ingestaDiariaCarbohidrato) || 0;
    const g = Number(ingesta.ingestaDiariaGrasa) || 0;

    this.macrosTotal = p + c + g || 1; // evitar división entre 0

    this.macrosPercent.proteina = Number(((p * 100) / this.macrosTotal).toFixed(2));
    this.macrosPercent.carbohidrato = Number(((c * 100) / this.macrosTotal).toFixed(2));
    this.macrosPercent.grasa = Number(((g * 100) / this.macrosTotal).toFixed(2));

    const pesoActual = Number(this.info?.pesoKg) || 0;
    const pesoIdeal = Number(ingesta.pesoIdeal) || 0;
    this.pesoDifference = Number((pesoActual - pesoIdeal).toFixed(2));

    // gradiente para gráfico circular (donut)
    const pctP = this.macrosPercent.proteina;
    const pctC = this.macrosPercent.carbohidrato;
    this.chartGradient = `conic-gradient(
      #4caf50 0% ${pctP}%,
      #ff9800 ${pctP}% ${pctP + pctC}%,
      #f44336 ${pctP + pctC}% 100%
    )`;
  }

  getImcCategoria(): string {
    const imc = this.ingesta?.imc ?? 0;
    if (imc < 18.5) return 'Peso bajo';
    if (imc >= 18.5 && imc <= 24.99) return 'Peso normal';
    if (imc >= 25 && imc <= 29.99) return 'Sobrepeso';
    if (imc >= 30 && imc <= 34.99) return 'Obesidad leve';
    if (imc >= 35 && imc <= 39.99) return 'Obesidad media';
    if (imc >= 40) return 'Obesidad mórbida';
    return '';
  }

  onBack(): void {
    this.router.navigate(['/usuarios']);
  }
}

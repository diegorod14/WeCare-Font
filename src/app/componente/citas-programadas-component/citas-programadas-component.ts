import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { CitaService } from '../../services/cita-service';
import { Cita } from '../../model/cita';
import { LoginService } from '../../services/login-service';
import { UsuarioService } from '../../services/user-service';
import { User } from '../../model/user';
import { forkJoin } from 'rxjs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';

interface CitasPorFecha {
  fecha: Date;
  fechaFormateada: string;
  citas: Cita[];
}

interface CitasPorUsuario {
  usuario: User;
  citasPorFecha: CitasPorFecha[];
}

@Component({
  selector: 'app-citas-programadas',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatExpansionModule, MatIconModule, MatFormFieldModule, MatInputModule],
  templateUrl: './citas-programadas-component.html',
  styleUrls: ['./citas-programadas-component.css']
})
export class CitasProgramadasComponent implements OnInit {
  citasPorUsuario: CitasPorUsuario[] = [];
  // Lista filtrada por búsqueda del usuario (nombres/apellidos)
  filteredCitasPorUsuario: CitasPorUsuario[] = [];
  isLoading = true;

  constructor(
    private citaService: CitaService,
    private loginService: LoginService,
    private usuarioService: UsuarioService
  ) {}

  ngOnInit(): void {
    const token = this.loginService.getToken();
    const nutricionistaId = this.extractUserIdFromToken(token);

    if (!nutricionistaId) {
      console.error('No se pudo obtener el ID del nutricionista del token');
      this.isLoading = false;
      return;
    }

    this.citaService.findByNutricionistaId(nutricionistaId).subscribe(
      (data: Cita[]) => {
        // Ordenar citas por fecha y hora
        const citasOrdenadas = data.sort((a, b) => {
          const fechaA = new Date(a.fecha).getTime();
          const fechaB = new Date(b.fecha).getTime();
          if (fechaA !== fechaB) {
            return fechaA - fechaB;
          }
          return a.hora.localeCompare(b.hora);
        });

        // Agrupar citas por usuarioId
        const citasAgrupadas = this.agruparCitasPorUsuario(citasOrdenadas);

        // Obtener información de cada usuario
        const userIds = Array.from(citasAgrupadas.keys());
        const userObservables = userIds.map(userId => this.usuarioService.listId(userId));

        forkJoin(userObservables).subscribe({
          next: (usuarios: User[]) => {
            // Obtener username para cada usuario
            const usernameObservables = usuarios.map(user =>
              this.usuarioService.findUsername(user.id!)
            );

            forkJoin(usernameObservables).subscribe({
              next: (usernames: string[]) => {
                this.citasPorUsuario = usuarios.map((usuario, index) => {
                  usuario.username = usernames[index];
                  const citasUsuario = citasAgrupadas.get(usuario.id!) || [];
                  return {
                    usuario,
                    citasPorFecha: this.agruparCitasPorFecha(citasUsuario)
                  };
                });
                // Inicializar la lista filtrada
                this.filteredCitasPorUsuario = [...this.citasPorUsuario];
                this.isLoading = false;
              },
              error: (err) => {
                console.error('Error obteniendo usernames:', err);
                this.isLoading = false;
              }
            });
          },
          error: (err) => {
            console.error('Error obteniendo usuarios:', err);
            this.isLoading = false;
          }
        });
      },
      (error: any) => {
        console.error('Error fetching citas:', error);
        this.isLoading = false;
      }
    );
  }

  private agruparCitasPorUsuario(citas: Cita[]): Map<number, Cita[]> {
    const mapa = new Map<number, Cita[]>();
    citas.forEach(cita => {
      if (!mapa.has(cita.usuarioId)) {
        mapa.set(cita.usuarioId, []);
      }
      mapa.get(cita.usuarioId)!.push(cita);
    });
    return mapa;
  }

  private agruparCitasPorFecha(citas: Cita[]): CitasPorFecha[] {
    const citasPorFechaMap = new Map<string, Cita[]>();

    citas.forEach(cita => {
      const fecha = new Date(cita.fecha);
      const fechaKey = fecha.toISOString().split('T')[0]; // YYYY-MM-DD

      if (!citasPorFechaMap.has(fechaKey)) {
        citasPorFechaMap.set(fechaKey, []);
      }
      citasPorFechaMap.get(fechaKey)!.push(cita);
    });

    // Convertir el mapa a array y ordenar por fecha
    const resultado: CitasPorFecha[] = [];
    citasPorFechaMap.forEach((citasDelDia, fechaKey) => {
      const fecha = new Date(fechaKey);
      resultado.push({
        fecha: fecha,
        fechaFormateada: this.formatearFecha(fecha),
        citas: citasDelDia.sort((a, b) => a.hora.localeCompare(b.hora)) // Ordenar por hora
      });
    });

    // Ordenar grupos por fecha
    return resultado.sort((a, b) => a.fecha.getTime() - b.fecha.getTime());
  }

  private formatearFecha(fecha: Date): string {
    const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

    const diaSemana = dias[fecha.getDay()];
    const dia = fecha.getDate();
    const mes = meses[fecha.getMonth()];
    const anio = fecha.getFullYear();

    return `${diaSemana}, ${dia} de ${mes} de ${anio}`;
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

  onBuscar(event: Event): void {
    const valor = (event.target as HTMLInputElement).value.toLowerCase().trim();
    if (!valor) {
      this.filteredCitasPorUsuario = [...this.citasPorUsuario];
      return;
    }
    this.filteredCitasPorUsuario = this.citasPorUsuario.filter(grupo => {
      const texto = `${grupo.usuario.nombres} ${grupo.usuario.apellidos}`.toLowerCase();
      return texto.includes(valor);
    });
  }
}

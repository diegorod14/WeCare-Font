import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { User } from '../../model/user';
import { UsuarioInformacion } from '../../model/usuario-informacion';
import { UsuarioIngesta } from '../../model/usuario-ingesta';
import { UsuarioObjetivo } from '../../model/usuario-objetivo';
import { Objetivo } from '../../model/objetivo';
import { NivelActividad } from '../../model/nivel-actividad';

import { UsuarioService } from '../../services/user-service';
import { UsuarioInformacionService } from '../../services/usuario-informacion-service';
import { UsuarioIngestaService } from '../../services/usuario-ingesta-service';
import { UsuarioObjetivoServices } from '../../services/usuario-objetivo-services';
import { ObjetivoServices } from '../../services/objetivo-services';
import { NivelActividadService } from '../../services/nivel-actividad-service';

@Component({
  selector: 'app-configuracion-component',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    MatSnackBarModule
  ],
  templateUrl: './configuracion-component.html',
  styleUrls: ['./configuracion-component.css'],
})
export class ConfiguracionComponent implements OnInit {
  private userService = inject(UsuarioService);
  private usuarioInfoService = inject(UsuarioInformacionService);
  private usuarioIngestaService = inject(UsuarioIngestaService);
  private usuarioObjetivoService = inject(UsuarioObjetivoServices);
  private objetivoService = inject(ObjetivoServices);
  private nivelActividadService = inject(NivelActividadService);
  private snackBar = inject(MatSnackBar);

  user: User = new User();
  usuarioInfo: UsuarioInformacion = new UsuarioInformacion();
  usuarioIngesta: UsuarioIngesta = new UsuarioIngesta();
  objetivoSeleccionado: number = 0;

  objetivos: Objetivo[] = [];
  nivelesActividad: NivelActividad[] = [];

  isEditing: boolean = false;

  ngOnInit(): void {
    const userId = Number(localStorage.getItem('userId'));
    if (userId) {
      this.cargarDatos(userId);
    } else {
      this.showMessage('Error: No se encontró el usuario en sesión', 'error');
    }
  }


  cargarDatos(userId: number): void {
    this.userService.listId(userId).subscribe({
      next: (data: any) => {
        this.user = data;
      },
      error: (err: any) => console.error('Error cargando usuario', err)
    });

    this.usuarioInfoService.listId(userId).subscribe({
      next: (data: any) => {
        this.usuarioInfo = data;
      },
      error: (err: any) => console.error('Error cargando información del usuario', err)
    });

    this.usuarioIngestaService.listId(userId).subscribe({
      next: (data: any) => {
        this.usuarioIngesta = data;
      },
      error: (err: any) => console.error('Error cargando ingesta del usuario', err)
    });

    this.usuarioObjetivoService.findByUsuarioId(userId).subscribe({
      next: (data: any) => {
        if (data && data.length > 0) {
          this.objetivoSeleccionado = data[data.length - 1].objetivo_id;
        }
      },
      error: (err: any) => console.error('Error cargando objetivos del usuario', err)
    });

    this.objetivoService.findAll().subscribe({
      next: (data: any) => {
        this.objetivos = data;
      },
      error: (err: any) => console.error('Error cargando objetivos', err)
    });

    this.nivelActividadService.list().subscribe({
      next: (data: any) => {
        this.nivelesActividad = data;
      },
      error: (err: any) => console.error('Error cargando niveles de actividad', err)
    });
  }

  toggleEdit(): void {
    if (this.isEditing) {
      const userId = Number(localStorage.getItem('userId'));
      if (userId) this.cargarDatos(userId);
    }
    this.isEditing = !this.isEditing;
  }

  guardarTodo(): void {
    const userId = Number(localStorage.getItem('userId'));
    if (!userId) {
      this.showMessage('Error: No se pudo identificar al usuario', 'error');
      return;
    }

    const userPayload: User = {
      id: this.user.id,
      username: this.user.username,
      nombres: this.user.nombres,
      apellidos: this.user.apellidos,
      genero: this.user.genero,
      correo: this.user.correo,
      celular: this.user.celular,
      fecha_creacion: this.user.fecha_creacion
    };

    this.userService.update(userPayload).subscribe({
      next: () => {
        this.usuarioInfoService.update(this.usuarioInfo).subscribe({
          next: () => {
            const usuarioObjetivo: UsuarioObjetivo = {
              usuario_id: userId,
              objetivo_id: this.objetivoSeleccionado
            };
            this.usuarioObjetivoService.insert(usuarioObjetivo).subscribe({
              next: () => {
                this.usuarioIngestaService.update(userId).subscribe({
                  next: (data: any) => {
                    this.usuarioIngesta = data;
                    this.showMessage('Perfil actualizado correctamente', 'success');
                    this.isEditing = false;
                  },
                  error: (err: any) => {
                    console.error('Error actualizando ingesta', err);
                    this.showMessage('Perfil actualizado, pero hubo un error al actualizar la ingesta', 'error');
                  }
                });
              },
              error: (err: any) => {
                console.error('Error guardando objetivo', err);
                this.showMessage('Error al guardar el objetivo', 'error');
              }
            });
          },
          error: (err: any) => {
            console.error('Error guardando información', err);
            this.showMessage('Error al guardar la información personal', 'error');
          }
        });
      },
      error: (err: any) => {
        console.error('Error actualizando usuario', err);
        this.showMessage('Error al actualizar el usuario', 'error');
      }
    });
  }

  private showMessage(msg: string, type: 'success' | 'error'): void {
    this.snackBar.open(msg, 'Cerrar', {
      duration: 3000,
      panelClass: type === 'error' ? ['snack-error'] : ['snack-success'],
      horizontalPosition: 'center',
      verticalPosition: 'bottom'
    });
  }

  get edad(): number {
    if (!this.usuarioInfo.fechaNacimiento) return 0;
    const hoy = new Date();
    const nacimiento = new Date(this.usuarioInfo.fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const m = hoy.getMonth() - nacimiento.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) edad--;
    return edad;
  }

  get imc(): string {
    return this.usuarioIngesta.imc ? this.usuarioIngesta.imc.toFixed(1) : '0.0';
  }
}


import {Component, inject, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Router} from '@angular/router';

import {MatGridListModule} from '@angular/material/grid-list';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatDialog, MatDialogModule, MAT_DIALOG_DATA} from '@angular/material/dialog';

import {ObjetivoServices} from '../../services/objetivo-services';
import {UsuarioObjetivoServices} from '../../services/usuario-objetivo-services';
import {UsuarioIngestaService} from '../../services/usuario-ingesta-service';
import {Objetivo} from '../../model/objetivo';

@Component({
  selector: 'app-elegir-objetivos-component',
  standalone: true,
  imports: [
    CommonModule,
    MatGridListModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule
  ],
  templateUrl: './elegir-objetivos-component.html',
  styleUrl: './elegir-objetivos-component.css',
})
export class ElegirObjetivosComponent implements OnInit {
  listaObjetivos: Objetivo[] = [];
  seleccionado: Objetivo | null = null;

  isSaving: boolean = false;
  mensajeExito: string = '';
  mensajeError: string = '';

  private objetivoService = inject(ObjetivoServices);
  private usuarioObjetivoService = inject(UsuarioObjetivoServices);
  private usuarioIngestaService = inject(UsuarioIngestaService);
  private router = inject(Router);
  private dialog = inject(MatDialog);

  ngOnInit() {
    this.objetivoService.findAll().subscribe({
      next: (data) => {
        this.listaObjetivos = data;
      },
      error: (err) => {
        console.error('Error al cargar objetivos', err);
        this.mensajeError = 'No se pudieron cargar los objetivos.';
      }
    });
  }

  seleccionarObjetivo(objetivo: Objetivo) {
    this.seleccionado = objetivo;

    this.dialog.open(ObjetivoDescripcionDialog, {
      data: {
        nombre: objetivo.nombre,
        descripcion: objetivo.descripcion || 'Este objetivo te ayudará a alcanzar tus metas de salud.'
      },
      width: '400px'
    });
  }

  guardarObjetivo() {
    if (!this.seleccionado) {
      this.mensajeError = 'Debes seleccionar un objetivo.';
      return;
    }

    const token = localStorage.getItem('token');
    const userId = this.extractUserIdFromToken(token);

    if (!userId) {
      this.mensajeError = 'No se pudo obtener el usuario del token. Inicia sesión nuevamente.';
      return;
    }

    this.isSaving = true;
    this.mensajeError = '';
    this.mensajeExito = '';

    const payload = {
      usuario_id: userId,
      objetivo_id: this.seleccionado.id
    };

    console.log('Objetivo seleccionado:', this.seleccionado);
    console.log('Payload a enviar:', payload);

    this.usuarioObjetivoService.insert(payload).subscribe({
      next: (response) => {
        console.log('Usuario-objetivo guardado:', response);

        // Ahora crear usuario-ingesta con camelCase (backend espera dto.getUsuarioId)
        const ingestaPayload = {
          usuarioId: userId
        };

        console.log('Creando usuario-ingesta con payload:', ingestaPayload);

        this.usuarioIngestaService.insert(ingestaPayload as any).subscribe({
          next: (ingestaResponse) => {
            this.isSaving = false;
            this.mensajeExito = 'Objetivo e ingesta guardados correctamente. Redirigiendo...';
            console.log('Usuario-ingesta creado:', ingestaResponse);
            setTimeout(() => {
              this.router.navigate(['/dashboard']);
            }, 1500);
          },
          error: (errIngesta) => {
            this.isSaving = false;
            console.error('Error al crear usuario-ingesta:', errIngesta);
            // Aunque falle la ingesta, igual redirigimos (el usuario ya tiene objetivo)
            this.mensajeExito = 'Objetivo guardado. Redirigiendo...';
            setTimeout(() => {
              this.router.navigate(['/dashboard']);
            }, 1500);
          }
        });
      },
      error: (err) => {
        this.isSaving = false;
        console.error('Error al guardar objetivo:', err);
        console.error('Payload enviado:', payload);
        console.error('Status:', err?.status);
        console.error('Error completo:', err?.error);
        this.mensajeError = 'Ocurrió un error al guardar el objetivo: ' + (err?.error?.message || err?.message || 'Error desconocido');
      }
    });
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

  getIconForObjetivo(objetivo: Objetivo): string {
    const nombre = objetivo.nombre?.toLowerCase() || '';
    if (nombre.includes('sedentario') || nombre.includes('perder')) {
      return 'event_seat';
    } else if (nombre.includes('ligero') || nombre.includes('mantener')) {
      return 'directions_walk';
    } else if (nombre.includes('intenso') || nombre.includes('ganar') || nombre.includes('aumentar')) {
      return 'fitness_center';
    }
    return 'flag';
  }
}

@Component({
  selector: 'objetivo-descripcion-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ data.nombre }}</h2>
    <mat-dialog-content>
      <p>{{ data.descripcion }}</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cerrar</button>
    </mat-dialog-actions>
  `,
  styles: [`
    mat-dialog-content {
      padding: 20px 0;
    }
  `]
})
export class ObjetivoDescripcionDialog {
  data = inject(MAT_DIALOG_DATA);
}

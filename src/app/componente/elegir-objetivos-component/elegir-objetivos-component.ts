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
  styleUrls: ['./elegir-objetivos-component.css']
})
export class ElegirObjetivosComponent implements OnInit {
  listaObjetivos: Objetivo[] = [];
  seleccionado: Objetivo | null = null;
  descripcionSeleccionada = '';

  isSaving = false;
  mensajeExito = '';
  mensajeError = '';

  private objetivoService = inject(ObjetivoServices);
  private usuarioObjetivoService = inject(UsuarioObjetivoServices);
  private usuarioIngestaService = inject(UsuarioIngestaService);
  private router = inject(Router);
  private dialog = inject(MatDialog);

  ngOnInit() {
    this.loadObjetivos();
  }

  private loadObjetivos() {
    this.objetivoService.findAll().subscribe({
      next: (data) => this.listaObjetivos = data || [],
      error: (err) => {
        console.error('Error al cargar objetivos', err);
        this.mensajeError = 'No se pudieron cargar los objetivos.';
      }
    });
  }

  seleccionarObjetivo(objetivo: Objetivo) {
    this.seleccionado = objetivo;
    this.mensajeError = '';
    this.mensajeExito = '';

    this.objetivoService.findById(objetivo.id).subscribe({
      next: (detail) => {
        const descripcion = this.obtenerDescripcion(detail);
        if (!descripcion) {
          this.mensajeError = 'No se encontró la descripción del objetivo en el servidor.';
          return;
        }
        this.descripcionSeleccionada = descripcion;
        this.openDescripcionDialog(objetivo.nombre);
      },
      error: (err) => {
        console.error('Error obteniendo descripción del objetivo:', err);
        this.mensajeError = 'No se pudo cargar la descripción del objetivo.';
      }
    });
  }

  private openDescripcionDialog(nombre: string) {
    this.dialog.open(ObjetivoDescripcionDialog, {
      data: {
        nombre,
        descripcion: this.descripcionSeleccionada
      },
      width: '400px'
    });
  }

  guardarObjetivo() {
    if (!this.seleccionado) {
      this.mensajeError = 'Debes seleccionar un objetivo.';
      return;
    }

    const userId = this.extractUserIdFromToken(localStorage.getItem('token'));

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

    this.usuarioObjetivoService.insert(payload).subscribe({
      next: () => this.crearUsuarioIngesta(userId),
      error: (err) => {
        this.isSaving = false;
        console.error('Error al guardar objetivo:', err);
        this.mensajeError = 'Ocurrió un error al guardar el objetivo: ' + (err?.error?.message || err?.message || 'Error desconocido');
      }
    });
  }

  private crearUsuarioIngesta(userId: number) {
    const ingestaPayload = {usuarioId: userId};

    this.usuarioIngestaService.insert(ingestaPayload as any).subscribe({
      next: () => {
        this.isSaving = false;
        this.mensajeExito = 'Objetivo e ingesta guardados correctamente. Redirigiendo...';
        setTimeout(() => this.router.navigate(['/dashboard']), 1500);
      },
      error: (errIngesta) => {
        this.isSaving = false;
        console.error('Error al crear usuario-ingesta:', errIngesta);
        this.mensajeExito = 'Objetivo guardado. Redirigiendo...';
        setTimeout(() => this.router.navigate(['/dashboard']), 1500);
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

  private obtenerDescripcion(data: Partial<Objetivo> | undefined | null): string {
    return data?.descripcion || (data as any)?.informacion || (data as any)?.descripcionObjetivo || '';
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

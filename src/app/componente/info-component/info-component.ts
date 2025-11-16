import {Component, inject, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, FormGroup, Validators, ReactiveFormsModule} from '@angular/forms';
import {Router} from '@angular/router';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatCardModule} from '@angular/material/card';
import {MatButtonModule} from '@angular/material/button';
import {MatSelectModule} from '@angular/material/select';

import {NivelActividad} from '../../model/nivel-actividad';
import {NivelActividadService} from '../../services/nivel-actividad-service';
import {UsuarioInformacionService} from '../../services/usuario-informacion-service';

@Component({
  selector: 'app-info-component',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    MatButtonModule,
    MatSelectModule
  ],
  templateUrl: './info-component.html',
  styleUrls: ['./info-component.css']
})
export class InfoComponent implements OnInit {
  infoForm!: FormGroup;
  listaNiveles: NivelActividad[] = [];
  loading = false;
  error: string | null = null;
  success: string | null = null;

  private fb = inject(FormBuilder);
  private router = inject(Router);
  private nivelActividadService = inject(NivelActividadService);
  private usuarioInformacionService = inject(UsuarioInformacionService);

  ngOnInit() {
    this.buildForm();
    this.loadNiveles();
  }

  private buildForm() {
    this.infoForm = this.fb.group({
      fechaNacimiento: ['', Validators.required],
      alturaCm: [0, [Validators.required, Validators.min(1)]],
      pesoKg: [0, [Validators.required, Validators.min(1)]],
      nivelActividadId: [null, Validators.required]
    });
  }

  private loadNiveles() {
    this.nivelActividadService.list().subscribe({
      next: (data) => this.listaNiveles = data || [],
      error: () => this.error = 'No se pudieron cargar los niveles de actividad.'
    });
  }

  onSubmit() {
    if (!this.infoForm || this.infoForm.invalid) {
      this.infoForm?.markAllAsTouched();
      this.error = 'Completa todos los campos correctamente';
      return;
    }

    const v = this.infoForm.value;

    // Extraer userId del JWT
    const token = localStorage.getItem('token');
    const userId = token ? this.extractUserIdFromToken(token) : null;

    if (!userId) {
      this.error = 'No se pudo obtener el ID de usuario del token. Inicia sesión nuevamente.';
      return;
    }

    const payload = {
      usuarioId: userId,
      fechaNacimiento: v.fechaNacimiento,
      alturaCm: Number(v.alturaCm),
      pesoKg: Number(v.pesoKg),
      nivelActividadId: Number(v.nivelActividadId)
    };

    console.log('Payload a enviar:', payload);

    this.loading = true;
    this.error = null;
    this.success = null;

    this.usuarioInformacionService.insert(payload as any).subscribe({
      next: () => {
        this.loading = false;
        this.success = 'Información guardada. Redirigiendo...';
        setTimeout(() => this.router.navigate(['/objetivos']), 1000);
      },
      error: (err) => {
        console.error('Error completo:', err);
        let msg = 'Error al guardar la información';
        if (err?.status === 403) msg = 'No tienes permisos. Inicia sesión nuevamente.';
        else if (err?.status === 400) msg = 'Datos inválidos. ' + (err?.error?.message || 'Verifica los campos.');
        else if (err?.error?.message) msg = err.error.message;
        this.error = msg;
        this.loading = false;
      }
    });
  }

  private extractUserIdFromToken(token: string): number | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const payload = JSON.parse(atob(parts[1]));
      console.log('JWT payload decodificado:', payload);
      return payload?.userId || null;
    } catch (e) {
      console.error('Error decodificando token:', e);
      return null;
    }
  }
}

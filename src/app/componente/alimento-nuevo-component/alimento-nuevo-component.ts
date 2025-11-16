import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
// Módulos oficiales de Angular Material
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';

import { AlimentoService } from '../../services/alimento-service';
import { CategoriaService } from '../../services/categoria-service';
import { Categoria } from '../../model/categoria';

@Component({
  selector: 'app-alimento-nuevo-component',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    MatButtonModule,
    MatSelectModule
  ],
  templateUrl: './alimento-nuevo-component.html',
  styleUrl: './alimento-nuevo-component.css',
})
export class AlimentoNuevoComponent implements OnInit {
  alimentoForm!: FormGroup;
  categorias: Categoria[] = [];
  loading = false;
  error: string | null = null;

  private fb = inject(FormBuilder);
  private router = inject(Router);
  private alimentoService = inject(AlimentoService);
  private categoriaService = inject(CategoriaService);

  ngOnInit(): void {
    this.buildForm();
    this.loadCategorias();
  }

  private buildForm() {
    this.alimentoForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(200)]],
      proteina: [0, [Validators.min(0)]],
      carbohidrato: [0, [Validators.min(0)]],
      grasa: [0, [Validators.min(0)]],
      calorias: [0, [Validators.min(0)]],
      fibra: [0, [Validators.min(0)]],
      categoriaId: [null, Validators.required]
    });
  }

  private loadCategorias() {
    this.categoriaService.findAll().subscribe({
      next: (cats) => {
        console.log(' Categorías recibidas de la API:', cats);
        const list = cats ?? [];
        this.categorias = list
          .map((c: any) => {
            const id = c?.idCategoria ?? c?.categoria_id ?? c?.categoriaId ?? c?.id ?? null;
            return {
              ...c,
              idCategoria: id !== null && id !== undefined ? Number(id) : null
            } as Categoria;
          })
          .filter((c: Categoria) => c.idCategoria != null);
        console.log(' Categorías procesadas:', this.categorias);
      },
      error: (err) => {
        console.error(' Error cargando categorías', err);
        this.categorias = [];
      }
    });
  }

  onSubmit() {
    if (!this.alimentoForm) return;
    if (this.alimentoForm.invalid) {
      this.alimentoForm.markAllAsTouched();
      return;
    }

    const v = this.alimentoForm.value;
    // Construir el payload para la API (sin id, será autogenerado)
    const payload: any = {
      nombre: v.nombre?.trim() ?? '',
      proteina: Number(v.proteina) || 0,
      carbohidrato: Number(v.carbohidrato) || 0,
      grasa: Number(v.grasa) || 0,
      fibra: Number(v.fibra) || 0,
      calorias: Number(v.calorias) || 0,
      categoriaId: Number(v.categoriaId) || 0
    };

    console.log(' Enviando payload a la API:', JSON.stringify(payload, null, 2));
    console.log(' Categoría seleccionada ID:', v.categoriaId);

    this.loading = true;
    this.error = null;

    this.alimentoService.save(payload).subscribe({
      next: (response) => {
        console.log(' Alimento guardado exitosamente:', response);
        this.loading = false;
        // Navegar al listado de alimentos (ruta definida en `app.routes.ts` como 'Alimento')
        try { this.router.navigate(['/Alimento']); } catch (e) { console.log('navegación tras guardar', e); }
      },
      error: (err) => {
        console.error(' Error guardando alimento:', err);
        console.error('Status:', err?.status);
        console.error('Error completo:', err?.error);

        let errorMsg = 'Error al guardar el alimento';
        if (err?.status === 500) {
          errorMsg = 'Error del servidor (500). Verifica que el backend esté funcionando correctamente y que la categoría exista.';
          if (err?.error?.message) {
            errorMsg += ' Detalle: ' + err.error.message;
          }
        } else if (err?.status === 400) {
          errorMsg = 'Datos inválidos (400). ' + (err?.error?.message || 'Verifica los campos del formulario');
        } else if (err?.error?.message) {
          errorMsg = err.error.message;
        }

        this.error = errorMsg;
        this.loading = false;
      }
    });
  }
}

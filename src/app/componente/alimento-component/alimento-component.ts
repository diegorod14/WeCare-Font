import { Component, ViewChild, inject, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { Alimento } from '../../model/alimento';
import { AlimentoService } from '../../services/alimento-service';
import { CategoriaService } from '../../services/categoria-service';

@Component({
  selector: 'app-alimento-component',
  standalone: true,
  imports: [CommonModule, NgIf, MatTableModule, MatPaginatorModule],
  templateUrl: './alimento-component.html',
  styleUrls: ['./alimento-component.css'],
})
export class AlimentoComponent implements OnInit, AfterViewInit {
  // Columnas: nombre del alimento, nombre de categoría y macronutrientes + calorías
  displayedColumns: string[] = ['nombre', 'categoria', 'proteina', 'carbohidrato', 'grasa', 'fibra', 'calorias'];
  dataSource = new MatTableDataSource<Alimento>();

  loading = false;
  error: string | null = null;

  private readonly alimentoService = inject(AlimentoService);
  private readonly categoriaService = inject(CategoriaService);

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  ngOnInit() {
    this.cargarAlimentos();
  }

  private cargarAlimentos() {
    this.loading = true;
    this.error = null;
    this.alimentoService.findAll().subscribe({
      next: (lista: Alimento[]) => {
        // Enriquecer con nombres de categorías si faltan
        const faltaNombreCategoria = lista.some(a => !a.categoria?.nombre && (a.categoria?.idCategoria || (a as any).idCategoria));
        if (!faltaNombreCategoria) {
          this.dataSource.data = lista ?? [];
          return;
        }
        this.categoriaService.findAll().subscribe({
          next: (cats) => {
            const byId = new Map<number, string>(cats.map(c => [c.idCategoria, c.nombre]));
            this.dataSource.data = lista.map(a => {
              const id = a.categoria?.idCategoria ?? (a as any).idCategoria;
              if (id && (!a.categoria || !a.categoria.nombre)) {
                a.categoria = a.categoria ?? { idCategoria: id, nombre: '', informacion: '' } as any;
                a.categoria.nombre = byId.get(Number(id)) ?? a.categoria.nombre;
              }
              return a;
            });
          },
          error: () => {
            // Si falla, al menos mostramos la lista tal cual
            this.dataSource.data = lista ?? [];
          },
          complete: () => this.loading = false
        });
      },
      error: (err) => {
        console.error('Error cargando alimentos', err);
        this.error = this.humanizarError(err);
        this.dataSource.data = [];
        this.loading = false;
      }
    });
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }

  private humanizarError(err: any): string {
    if (!err) return 'Error desconocido';
    if (err.status === 0) return 'No se pudo conectar con la API. ¿Está encendida y con CORS habilitado?';
    if (err.status) return `Error ${err.status}: ${err.statusText || 'Solicitud fallida'}`;
    return typeof err === 'string' ? err : 'Error al cargar los datos';
  }
}

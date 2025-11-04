import {Component, ViewChild, inject} from '@angular/core';
import { NgIf } from '@angular/common';
import {
  MatCell,
  MatCellDef,
  MatColumnDef,
  MatHeaderCell,
  MatHeaderCellDef,
  MatHeaderRow, MatHeaderRowDef, MatRow, MatRowDef,
  MatTable, MatTableDataSource
} from '@angular/material/table';
import {MatPaginator} from '@angular/material/paginator';
import {Alimento} from '../../model/alimento';
import {AlimentoService} from '../../services/alimento-service';
import {CategoriaService} from '../../services/categoria-service';

@Component({
  selector: 'app-alimento-component',
  imports: [
    NgIf,
    MatHeaderCell,
    MatTable,
    MatColumnDef,
    MatCell,
    MatCellDef,
    MatHeaderCellDef,
    MatHeaderRow,
    MatHeaderRowDef,
    MatRowDef,
    MatRow,
    MatPaginator
  ],
  templateUrl: './alimento-component.html',
  styleUrl: './alimento-component.css',
})
export class AlimentoComponent {
  // Columnas: nombre del alimento, nombre de categoría y macronutrientes + calorías
  displayedColumns: string[] = ['nombre', 'categoria', 'proteinas', 'carbohidratos', 'grasas', 'calorias'];
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
            const enriquecida = lista.map(a => {
              const id = a.categoria?.idCategoria ?? (a as any).idCategoria;
              if (id && (!a.categoria || !a.categoria.nombre)) {
                a.categoria = a.categoria ?? { idCategoria: id, nombre: '', informacion: '' } as any;
                a.categoria.nombre = byId.get(Number(id)) ?? a.categoria.nombre;
              }
              return a;
            });
            this.dataSource.data = enriquecida;
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

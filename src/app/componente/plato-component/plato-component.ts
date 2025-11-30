import { Component, inject, ViewChild } from '@angular/core';
import { MatSort, MatSortHeader } from '@angular/material/sort';
import {
  MatCell,
  MatCellDef,
  MatColumnDef,
  MatHeaderCell,
  MatHeaderCellDef,
  MatHeaderRow,
  MatHeaderRowDef,
  MatRow,
  MatRowDef,
  MatTable,
  MatTableDataSource
} from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { Router, RouterLink } from '@angular/router';
import { Plato } from '../../model/plato';
import { PlatoService } from '../../services/plato-service';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogo } from './confirm-dialogo/confirm-dialogo';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-plato-component',
  standalone: true,
  imports: [
    MatSort,
    MatSortHeader,
    MatTable,
    MatPaginator,
    MatCell,
    MatColumnDef,
    MatHeaderRow,
    MatRow,
    MatHeaderCell,
    MatCellDef,
    MatRowDef,
    MatHeaderRowDef,
    MatHeaderCellDef,
    RouterLink,
    MatButton,
    MatCard,
    MatCardContent,
    MatIcon,
    MatIconButton,
  ],
  templateUrl: './plato-component.html',
  styleUrl: './plato-component.css',
})
export class PlatoComponent {
  lista: Plato[];
  displayedColumns: string[] = ['id', 'nombre', 'informacion', 'acciones'];
  dataSource: MatTableDataSource<Plato> = new MatTableDataSource<Plato>();

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  platoService: PlatoService = inject(PlatoService);
  route: Router = inject(Router);
  dialog = inject(MatDialog);

  constructor() {}

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
  }

  ngOnInit() {
    this.cargaDatos();
  }

  cargaDatos(): void {
    this.platoService.list().subscribe({
      next: (data) => {
        this.dataSource.data = data;
        this.dataSource._updateChangeSubscription();
      },
    });
  }

  // 👉 Botón "Nuevo Plato" del header
  nuevoPlato() {
    // Ajusta la ruta si tu componente de creación tiene otro path
    this.route.navigate(['/nuevo-edit']);
  }

  // 👉 Botón de editar (icono lápiz)
  editar(element: any) {
    this.route.navigate(['/nuevo-edit', element.id]);
  }

  // 👉 Botón de eliminar (icono tacho)
  openDialog(id: number) {
    const dialogRef = this.dialog.open(ConfirmDialogo);
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.platoService.delete(id).subscribe({
          next: () => this.cargaDatos(),
          error: (err) => console.log(err)
        });
      }
    });
  }
}

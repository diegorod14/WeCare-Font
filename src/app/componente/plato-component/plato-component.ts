import {Component, inject, ViewChild} from '@angular/core';
import {MatSort} from '@angular/material/sort';
import {
  MatCell,
  MatCellDef,
  MatColumnDef,
  MatHeaderCell, MatHeaderCellDef,
  MatHeaderRow, MatHeaderRowDef,
  MatRow, MatRowDef,
  MatTable, MatTableDataSource
} from '@angular/material/table';
import {MatPaginator} from '@angular/material/paginator';
import {Router, RouterLink} from '@angular/router';
import {Plato} from '../../model/plato';
import {PlatoService} from '../../services/plato-service';
import {MatButton} from '@angular/material/button';
import {MatDialog} from '@angular/material/dialog';
import {ConfirmDialogo} from './confirm-dialogo/confirm-dialogo';


@Component({
  selector: 'app-plato-component',
  imports: [
    MatSort,
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
  ],
  templateUrl: './plato-component.html',
  styleUrl: './plato-component.css',
  standalone: true
})
export class PlatoComponent {
  lista: Plato[];
  displayedColumns: string[] = ['id', 'nombre', 'informacion','accion1', 'accion2'];
  dataSource: MatTableDataSource<Plato> = new MatTableDataSource<Plato>();
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  platoService: PlatoService = inject(PlatoService);
  route: Router = inject(Router);
  dialog = inject(MatDialog);

  constructor() {
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
  }

  ngOnInit() {
    console.log('Component ngOnInit llamando al API Get');
    this.cargaDatos();
  }

  cargaDatos(): void {
    this.platoService.list().subscribe({
      next: (data) => {
        console.log("Data traida:", data);
        this.dataSource.data = data;
        this.dataSource._updateChangeSubscription();
      },
    })
  }

  openDialog(id: number) {
    const dialogRef = this.dialog.open(ConfirmDialogo);
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.platoService.delete(id).subscribe({
          next: () => {
            console.log("Plato eliminado, actualizando lista");
            this.cargaDatos();
          },
          error: (err) => console.log(err)
        });
      } else {
        console.log("Eliminación cancelada");
      }
    });
  } //fin del openDialog
}




import {Component, inject, OnInit} from '@angular/core';
import {MatCard, MatCardContent, MatCardTitle} from '@angular/material/card';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {MatInputModule} from '@angular/material/input';
import {
  MatDatepickerModule,
} from '@angular/material/datepicker';
import {MatButton} from '@angular/material/button';
import {MatNativeDateModule} from '@angular/material/core';
import {PlatoService} from '../../services/plato-service';
import {ActivatedRoute, Router} from '@angular/router';

@Component({
  selector: 'app-plato-nuevo-edit-component',
  imports: [
    ReactiveFormsModule,
    MatInputModule,//add
    MatDatepickerModule, // add
    MatNativeDateModule,
    MatButton,
    MatCardContent,
    MatCardTitle,
    MatCard,
    // add
  ],
  templateUrl: './plato-nuevo-edit-component.html',
  styleUrl: './plato-nuevo-edit-component.css'
})
export class PlatoNuevoEditComponent implements OnInit {
  platoForm : FormGroup;
  fb : FormBuilder = inject(FormBuilder)
  platoService = inject(PlatoService);
  router = inject(Router);
  edicion : boolean = false;
  route : ActivatedRoute = inject(ActivatedRoute);
  id: number = 0;
  constructor() {
    this.platoForm = this.fb.group({
      id: [''],
      nombre: ['', Validators.required],
      informacion: ['', Validators.required]
    });
  }
  ngOnInit() {
    this.route.params.subscribe(data  => {
      this.id = data['id'];
      console.log("ID recibido:", this.id);
      this.edicion = data['id']!=null;
      this.cargaForm();
    })
  }
  cargaForm(){
    if(this.edicion){
      this.platoService.listId(this.id).subscribe({
        next: data => {
          this.platoForm.patchValue({
            id:data.id,
            nombre:data.nombre,
            informacion:data.informacion
          })
        }
      })
    }
  }
  onSubmit(){
    if(this.platoForm.valid){
      let plato = this.platoForm.value;
      if(!this.edicion){
        this.platoService.insert(plato).subscribe({
          next: () => {
            this.router.navigate(['/Plato']); // redirige a PlatoComponent
          },
          error: err => {
            alert('Error al crear el plato: ' + (err?.error?.message || 'Error desconocido'));
          }
        });
      } else{
        this.platoService.update(plato).subscribe({
          next: () => {
            this.router.navigate(['/Plato']); // redirige a PlatoComponent
          },
          error: err => {
            alert('Error al actualizar el plato: ' + (err?.error?.message || 'Error desconocido'));
          }
        });
      }
    }
  }
}

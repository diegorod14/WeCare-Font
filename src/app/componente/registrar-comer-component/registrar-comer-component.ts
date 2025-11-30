import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { Alimento } from '../../model/alimento';
import { ComerRequest } from '../../model/comer';
import { ComerService } from '../../services/comer-service';
import { AlimentoService } from '../../services/alimento-service';

@Component({
  selector: 'app-registrar-comer-component',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatSnackBarModule
  ],
  templateUrl: './registrar-comer-component.html',
  styleUrl: './registrar-comer-component.css'
})
export class RegistrarComerComponent implements OnInit {
  alimento?: Alimento;

  consumoRequest: ComerRequest = {
    alimentoId: 0,
    cantidad: 100,
    unidad: 'g',
    fechaConsumo: new Date().toISOString().split('T')[0],
    horaConsumo: new Date().toTimeString().split(' ')[0].substring(0, 5),
    nota: ''
  };

  cargando: boolean = false;
  usuarioId: number = 1; // TODO: Obtener del LoginService

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private comerService: ComerService,
    private alimentoService: AlimentoService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    // Obtener el ID del alimento desde la ruta
    const alimentoId = this.route.snapshot.queryParams['alimentoId'];

    if (alimentoId) {
      this.cargarAlimento(+alimentoId);
    } else {
      this.mostrarMensaje('⚠️ No se especificó el alimento', 'warning');
      this.router.navigate(['/Alimento']);
    }
  }

  /**
   * Carga la información del alimento
   */
  cargarAlimento(id: number): void {
    this.cargando = true;
    this.alimentoService.findById(id).subscribe({
      next: (alimento) => {
        this.alimento = alimento;
        this.consumoRequest.alimentoId = alimento.id!;
        this.cargando = false;
      },
      error: (error) => {
        this.mostrarMensaje('❌ Error al cargar el alimento', 'error');
        console.error('Error:', error);
        this.cargando = false;
        this.router.navigate(['/Alimento']);
      }
    });
  }

  /**
   * Registra el consumo del alimento
   */
  registrarConsumo(): void {
    if (!this.validarFormulario()) {
      return;
    }

    this.cargando = true;
    this.comerService.registrarConsumo(this.usuarioId, this.consumoRequest).subscribe({
      next: (response) => {
        this.mostrarMensaje(
          `✅ Consumo registrado: ${this.alimento?.nombre} - ${response.caloriasCalculadas?.toFixed(1)} kcal`,
          'success'
        );
        this.cargando = false;

        // Redirigir al dashboard después de 1.5 segundos
        setTimeout(() => {
          this.router.navigate(['/dashboard']);
        }, 1500);
      },
      error: (error) => {
        this.mostrarMensaje('❌ Error al registrar el consumo', 'error');
        console.error('Error:', error);
        this.cargando = false;
      }
    });
  }

  /**
   * Valida el formulario antes de enviar
   */
  validarFormulario(): boolean {
    if (!this.consumoRequest.cantidad || this.consumoRequest.cantidad <= 0) {
      this.mostrarMensaje('⚠️ La cantidad debe ser mayor a 0', 'warning');
      return false;
    }

    if (!this.consumoRequest.unidad) {
      this.mostrarMensaje('⚠️ Debe seleccionar una unidad', 'warning');
      return false;
    }

    return true;
  }

  /**
   * Calcula las calorías estimadas según la cantidad
   */
  calcularCaloriasEstimadas(): number {
    if (!this.alimento || !this.consumoRequest.cantidad) {
      return 0;
    }

    const factor = this.calcularFactorConversion();
    return (this.alimento.calorias || 0) * factor;
  }

  /**
   * Calcula los macros estimados
   */
  calcularProteinaEstimada(): number {
    if (!this.alimento) return 0;
    const factor = this.calcularFactorConversion();
    return (this.alimento.proteina || 0) * factor;
  }

  calcularCarbohidratoEstimado(): number {
    if (!this.alimento) return 0;
    const factor = this.calcularFactorConversion();
    return (this.alimento.carbohidrato || 0) * factor;
  }

  calcularGrasaEstimada(): number {
    if (!this.alimento) return 0;
    const factor = this.calcularFactorConversion();
    return (this.alimento.grasa || 0) * factor;
  }

  /**
   * Calcula el factor de conversión según la unidad
   */
  calcularFactorConversion(): number {
    const cantidad = this.consumoRequest.cantidad || 0;
    const unidad = this.consumoRequest.unidad?.toLowerCase() || 'g';

    switch (unidad) {
      case 'g':
      case 'gr':
      case 'gramos':
        return cantidad / 100.0;
      case 'kg':
      case 'kilogramos':
        return (cantidad * 1000) / 100.0;
      case 'porcion':
      case 'porción':
        return cantidad;
      case 'ml':
      case 'mililitros':
        return cantidad / 100.0;
      case 'l':
      case 'litros':
        return (cantidad * 1000) / 100.0;
      default:
        return cantidad / 100.0;
    }
  }

  /**
   * Cancela y vuelve a la lista de alimentos
   */
  cancelar(): void {
    this.router.navigate(['/Alimento']);
  }

  /**
   * Muestra un mensaje al usuario
   */
  mostrarMensaje(mensaje: string, tipo: 'success' | 'error' | 'warning'): void {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: [`snackbar-${tipo}`]
    });
  }
}


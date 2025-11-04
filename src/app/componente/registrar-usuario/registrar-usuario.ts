import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UsuarioService } from '../../services/user-service';
import { User } from '../../model/user';

@Component({
  selector: 'app-registrar-usuario',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './registrar-usuario.html',
  styleUrl: './registrar-usuario.css',
})
export class RegistrarUsuario {
  private usuarioService = inject(UsuarioService);
  private router = inject(Router);

  user: User = new User();
  confirmPassword: string = '';
  errorMessage: string = '';
  successMessage: string = '';
  loading: boolean = false;

  onRegister(): void {
    // Validaciones
    if (!this.validateForm()) {
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    // Establecer fechas
    this.user.fecha_creacion = new Date();
    this.user.fecha_actualizacion = new Date();

    // Guardar usuario
    this.usuarioService.save(this.user).subscribe({
      next: (savedUser: User) => {
        this.loading = false;
        this.successMessage = 'Usuario registrado exitosamente';

        // Redirigir al login después de 2 segundos
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
      },
      error: (error) => {
        this.loading = false;
        if (error?.status === 409) {
          this.errorMessage = 'El usuario o correo ya existe';
        } else {
          this.errorMessage = 'Error al registrar usuario. Intente nuevamente';
        }
        console.error('Error en registro:', error);
      }
    });
  }

  validateForm(): boolean {
    // Validar campos vacíos
    if (!this.user.username || !this.user.correo || !this.user.nombres ||
        !this.user.apellido || !this.user.celular) {
      this.errorMessage = 'Todos los campos son obligatorios';
      return false;
    }

    // Validar contraseña
    if (!this.user.password || this.user.password.length < 6) {
      this.errorMessage = 'La contraseña debe tener al menos 6 caracteres';
      return false;
    }

    // Validar confirmación de contraseña
    if (this.user.password !== this.confirmPassword) {
      this.errorMessage = 'Las contraseñas no coinciden';
      return false;
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.user.correo.toString())) {
      this.errorMessage = 'Ingrese un correo válido';
      return false;
    }

    // Validar celular
    if (this.user.celular <= 0) {
      this.errorMessage = 'Ingrese un número de celular válido';
      return false;
    }

    // Validar username
    if (this.user.username.length < 3) {
      this.errorMessage = 'El usuario debe tener al menos 3 caracteres';
      return false;
    }

    return true;
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }
}

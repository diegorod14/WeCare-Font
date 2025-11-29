import { Component, inject } from '@angular/core';
import {CommonModule} from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UsuarioService } from '../../services/user-service';
import { User } from '../../model/user';

@Component({
  selector: 'app-registrar-usuario',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './registrar-usuario.html',
  styleUrls: ['./registrar-usuario.css'],
})
export class RegistrarUsuario {
  private usuarioService = inject(UsuarioService);
  private router = inject(Router);

  user: User = new User();
  errorMessage: string = '';
  successMessage: string = '';
  loading: boolean = false;

  onRegister(): void {
    if (!this.validateForm()) {
      return;
    }

    this.loading = true;
    // Clear any existing messages
    this.errorMessage = '';
    this.successMessage = '';

    // Preparar el objeto según el RegistrarUsuarioDTO del backend
    const nuevoUsuario = {
      username: this.user.username,
      password: this.user.password,
      nombres: this.user.nombres,
      apellidos: this.user.apellidos,
      genero: this.user.genero,
      correo: this.user.correo,
      celular: this.user.celular
    };

    console.log('Enviando datos de registro:', nuevoUsuario);

    this.usuarioService.registrar(nuevoUsuario).subscribe({
      next: (response) => {
        this.loading = false;
        this.successMessage = 'Usuario registrado exitosamente';
        console.log('Usuario registrado:', response);

        // Siempre dirigir a login después del registro para flujo de autenticación
        this.router.navigate(['/login']);
      },
      error: (error) => {
        this.loading = false;
        console.error('Error al registrar usuario:', error);
        console.error('Error completo:', JSON.stringify(error, null, 2));

        // Manejar los errores específicos del backend
        if (error?.status === 400) {
          const errorMsg = error?.error || '';

          if (typeof errorMsg === 'string' && errorMsg.includes('ModelMapper')) {
            this.errorMessage = 'Error de configuración en el servidor. Contacte al administrador.';
            console.error('Error de ModelMapper:', errorMsg);
          } else if (typeof errorMsg === 'string' && errorMsg.includes('username ya existe')) {
            this.errorMessage = 'El nombre de usuario ya está en uso';
          } else if (typeof errorMsg === 'string' && errorMsg.includes('correo ya existe')) {
            this.errorMessage = 'Este correo electrónico ya está registrado';
          } else {
            this.errorMessage = typeof errorMsg === 'string' ? errorMsg : 'Datos inválidos. Verifica el formulario.';
          }
        } else if (error?.status === 409) {
          this.errorMessage = 'El usuario o correo ya existe';
        } else if (error?.status === 500) {
          this.errorMessage = 'Error en el servidor. Intente nuevamente';
        } else {
          this.errorMessage = 'Error al registrar usuario. Intente nuevamente';
        }
      }
    });
  }

  validateForm(): boolean {
    // Validar campos vacíos
    if (!this.user.username || !this.user.correo || !this.user.nombres ||
        !this.user.apellidos || !this.user.celular || !this.user.genero) {
      this.errorMessage = 'Todos los campos son obligatorios';
      return false;
    }

    // Validar género
    if (this.user.genero !== 'M' && this.user.genero !== 'F') {
      this.errorMessage = 'Seleccione un género válido';
      return false;
    }

    // Validar contraseña
    if (!this.user.password || this.user.password.length < 6) {
      this.errorMessage = 'La contraseña debe tener al menos 6 caracteres';
      return false;
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.user.correo.toString())) {
      this.errorMessage = 'Ingrese un correo válido';
      return false;
    }

    // Validar celular (ahora es string)
    if (!this.user.celular || this.user.celular.trim().length === 0) {
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
}

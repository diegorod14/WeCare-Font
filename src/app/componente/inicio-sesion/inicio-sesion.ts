import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UsuarioService } from '../../services/user-service';
import { User } from '../../model/user';

@Component({
  selector: 'app-inicio-sesion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './inicio-sesion.html',
  styleUrl: './inicio-sesion.css',
})
export class InicioSesion {
  private usuarioService = inject(UsuarioService);
  private router = inject(Router);

  username: string = '';
  password: string = '';
  errorMessage: string = '';
  loading: boolean = false;

  onLogin(): void {
    // Validación de campos vacíos
    if (!this.username || !this.password) {
      this.errorMessage = 'Por favor ingrese usuario y contraseña';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    // Buscar usuario por username
    this.usuarioService.findByUsername(this.username).subscribe({
      next: (user: User) => {
        this.loading = false;

        // IMPORTANTE: En producción, la validación de contraseña debe hacerse en el backend
        // Este es solo un ejemplo básico. Deberías tener un endpoint /api/auth/login
        if (user && this.password) {
          // Guardar datos del usuario en localStorage
          localStorage.setItem('currentUser', JSON.stringify(user));
          localStorage.setItem('isLoggedIn', 'true');

          // Redirigir a la página principal
          this.router.navigate(['/']);
        } else {
          this.errorMessage = 'Usuario o contraseña incorrectos';
        }
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = 'Usuario o contraseña incorrectos';
        console.error('Error en login:', error);
      }
    });
  }

  onRegister(): void {
    // Redirigir a la página de registro
    this.router.navigate(['/registro']);
  }

  clearError(): void {
    this.errorMessage = '';
  }
}

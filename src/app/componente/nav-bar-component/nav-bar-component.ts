import {Component, inject} from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import {Router, RouterLink, RouterLinkActive} from '@angular/router';
import {LoginService} from '../../services/login-service';
import {Plato} from '../../model/plato';
import {NgOptimizedImage} from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { GeminiComponent } from './gemini-component/gemini-component';

@Component({
  selector: 'app-nav-bar-component',
  standalone: true,
  imports: [MatToolbarModule, MatButtonModule, RouterLink, NgOptimizedImage, RouterLinkActive, MatIconModule, MatMenuModule, GeminiComponent],
  templateUrl: './nav-bar-component.html',
  styleUrls: ['./nav-bar-component.css'],
})
export class NavBarComponent {
    router: Router = inject(Router);
    rol: any;
    isSidebarOpen = false;
  private loginService = inject(LoginService);
    esNutricionista(): boolean {
      this.rol = localStorage.getItem('rol');
      return this.rol === 'ROLE_NUTRICIONISTA';
    }
    esUsuario(): boolean {
      this.rol = localStorage.getItem('rol');
      return this.rol === 'ROLE_USER';
    }
    onLogout(): void {
      this.loginService.logout();
      this.rol = null;
    }

    toggleSidebar(): void {
      this.isSidebarOpen = !this.isSidebarOpen;
    }

    closeSidebar(): void {
      this.isSidebarOpen = false;
    }

  protected readonly Plato = Plato;
}

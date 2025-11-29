import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CitaService } from '../../services/cita-service';
import { Cita } from '../../model/cita';
import { LoginService } from '../../services/login-service';

@Component({
  selector: 'app-citas-programadas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './citas-programadas-component.html',
  styleUrls: ['./citas-programadas-component.css']
})
export class CitasProgramadasComponent implements OnInit {
  citas: Cita[] = [];

  constructor(private citaService: CitaService, private loginService: LoginService) {}

  ngOnInit(): void {
    const token = this.loginService.getToken();
    const nutricionistaId = this.extractUserIdFromToken(token);

    if (!nutricionistaId) {
      console.error('No se pudo obtener el ID del nutricionista del token');
      return;
    }

    this.citaService.findByNutricionistaId(nutricionistaId).subscribe(
      (data: Cita[]) => {
        this.citas = data;
      },
      (error: any) => {
        console.error('Error fetching citas:', error);
      }
    );
  }

  private extractUserIdFromToken(token: string | null): number | null {
    if (!token) return null;
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const payload = JSON.parse(atob(parts[1]));
      return payload?.userId || null;
    } catch (e) {
      console.error('Error decodificando token:', e);
      return null;
    }
  }
}

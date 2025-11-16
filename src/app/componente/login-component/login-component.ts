import {Component, inject, OnInit} from '@angular/core';
import {MatCard, MatCardContent, MatCardTitle} from '@angular/material/card';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {MatFormField, MatInput, MatLabel} from '@angular/material/input';
import {MatButton} from '@angular/material/button';
import {RequestDto} from '../../model/request-dto';
import {ResponseDto} from '../../model/response-dto';
import {Router} from '@angular/router';
import {LoginService} from '../../services/login-service';
import {UsuarioInformacionService} from '../../services/usuario-informacion-service';
import {catchError, of} from 'rxjs';

@Component({
  selector: 'app-login-component',
  imports: [
    MatCard,
    MatCardTitle,
    MatCardContent,
    ReactiveFormsModule,
    MatFormField,
    MatLabel,
    MatInput,
    MatButton
  ],
  templateUrl: './login-component.html',
  styleUrl: './login-component.css'
})
export class LoginComponent implements OnInit {
  router: Router = inject(Router);
  loginForm: FormGroup;
  fb = inject(FormBuilder);
  loginService: LoginService = inject(LoginService);
  private usuarioInformacionService = inject(UsuarioInformacionService);

  constructor() {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
    })
  }

  ngOnInit() {
    if (localStorage.getItem('token')) localStorage.clear();
  }

  onSubmit() {
    if (!this.loginForm.valid) { alert('Formulario no válido'); return; }

    const req = new RequestDto();
    req.username = this.loginForm.value.username;
    req.password = this.loginForm.value.password;

    this.loginService.login(req).subscribe({
      next: (data: ResponseDto): void => {
        if (data?.roles?.[0]) localStorage.setItem('rol', data.roles[0]);

        const token = localStorage.getItem('token');
        if (!token) { this.router.navigate(['/info']); return; }

        // Extraer userId del JWT
        const userId = this.extractUserIdFromToken(token);
        if (!userId) { this.router.navigate(['/info']); return; }

        localStorage.setItem('userId', String(userId));
        console.log('UserId extraído del JWT:', userId);

        // Verificar si existe usuario-informacion para este userId
        this.usuarioInformacionService.listId(userId).pipe(
          catchError((err) => {
            console.log('Error al buscar usuario-informacion:', err.status);
            return of(null);
          })
        ).subscribe(info => {
          console.log('Usuario-informacion encontrado:', info);
          if (!info) {
            console.log('No existe usuario-informacion, redirigiendo a /info');
            this.router.navigate(['/info']);
          } else {
            console.log('Usuario-informacion existe, redirigiendo a /home');
            this.router.navigate(['/dashboard']);
          }
        });
      },
      error: () => this.router.navigate(['/login'])
    });
  }

  private extractUserIdFromToken(token: string): number | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const payload = JSON.parse(atob(parts[1]));
      console.log('JWT payload:', payload);
      return payload?.userId || null;
    } catch (e) {
      console.error('Error decodificando token:', e);
      return null;
    }
  }
}

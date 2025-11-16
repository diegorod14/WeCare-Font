import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UsuarioObjetivoServices {
  private url = environment.apiUrl;
  private http: HttpClient = inject(HttpClient);

  constructor() {}

  // POST /usuario-objetivo
  insert(usuarioObjetivo: any): Observable<any> {
    return this.http.post<any>(this.url + '/usuario-objetivo', usuarioObjetivo);
  }

  // alias para mantener consistencia con otros servicios
  save(usuarioObjetivo: any): Observable<any> {
    return this.insert(usuarioObjetivo);
  }

  // GET /usuario-objetivo/usuario/{usuarioId}
  findByUsuarioId(usuarioId: number): Observable<any[]> {
    return this.http.get<any[]>(this.url + '/usuario-objetivo/usuario/' + usuarioId);
  }
}

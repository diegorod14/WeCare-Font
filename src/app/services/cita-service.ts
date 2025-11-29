import { Injectable, inject } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CitaService {
  private url = environment.apiUrl;
  private http: HttpClient = inject(HttpClient);
  private listaCambio = new Subject<any[]>();

  constructor() {}

  list(): Observable<any> {
    return this.http.get<any[]>(this.url + '/citas');
  }

  listId(id: number): Observable<any> {
    return this.http.get<any>(`${this.url}/cita/${id}`);
  }

  insert(cita: any): Observable<any> {
    console.log('Insert cita:', cita);
    return this.http.post(this.url + '/cita', cita);
  }

  update(cita: any): Observable<any> {
    console.log('Update enviando:', cita);
    return this.http.put(this.url + '/cita', cita);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.url}/cita/${id}`);
  }

  setList(listaNueva: any[]) {
    this.listaCambio.next(listaNueva);
  }

  getListaCambio(): Observable<any[]> {
    return this.listaCambio.asObservable();
  }

  actualizarLista(): void {
    this.list().subscribe({
      next: (data) => this.setList(data),
      error: (err) => console.error('Error actualizando lista citas', err),
    });
  }

  findByNutricionistaId(nutricionistaId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.url}/nutricionista/${nutricionistaId}/citas`);
  }

  findByUsuarioId(usuarioId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.url}/usuario/${usuarioId}/citas`);
  }

  findByNutricionistaIdAndUsuarioId(nutricionistaId: number, usuarioId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.url}/nutricionista/${nutricionistaId}/usuario/${usuarioId}/citas`);
  }
}

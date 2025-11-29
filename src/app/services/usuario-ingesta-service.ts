import {inject, Injectable} from '@angular/core';
import {environment} from '../../environments/environment';
import {UsuarioIngesta} from '../model/usuario-ingesta';
import {Observable, Subject} from 'rxjs';
import {HttpClient} from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class UsuarioIngestaService {
  private url = environment.apiUrl;
  private http = inject(HttpClient);
  private listaCambio = new Subject<UsuarioIngesta[]>();

  constructor() { }

  list(): Observable<UsuarioIngesta[]>{
    return this.http.get<UsuarioIngesta[]>(this.url + "/usuario-ingesta");
  }

  listId(usuarioId: number): Observable<UsuarioIngesta>{
    return this.http.get<UsuarioIngesta>(this.url + "/usuario-ingesta/" + usuarioId);
  }

  insert(usuarioIngesta: UsuarioIngesta): Observable<UsuarioIngesta>{
    return this.http.post<UsuarioIngesta>(this.url + "/usuario-ingesta", usuarioIngesta);
  }

  update(usuarioId: number): Observable<UsuarioIngesta>{
    return this.http.put<UsuarioIngesta>(this.url + "/usuario-ingesta/" + usuarioId, {});
  }

  delete(usuarioId: number): Observable<any> {
    return this.http.delete(this.url + "/usuario-ingesta/" + usuarioId);
  }

  listByRangoIMC(minImc: number, maxImc: number): Observable<UsuarioIngesta[]>{
    return this.http.get<UsuarioIngesta[]>(
      this.url + "/usuario-ingesta/imc?minImc=" + minImc + "&maxImc=" + maxImc
    );
  }

  setList(listaNueva: UsuarioIngesta[]){
    this.listaCambio.next(listaNueva); //enviar la nueva lista a los suscriptores
  }

  getListaCambio(): Observable<UsuarioIngesta[]>{
    return this.listaCambio.asObservable();
  }

  actualizarLista(): void {
    this.list().subscribe({
      next: (data) => this.setList(data),   //envia la nueva lista a los suscriptores
      error: (err) => console.error('Error actualizando lista usuarios ingesta', err)
    });
  }
}

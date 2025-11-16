import {inject, Injectable} from '@angular/core';
import {environment} from '../../environments/environment';
import {UsuarioInformacion} from '../model/usuario-informacion';
import {Observable, Subject} from 'rxjs';
import {HttpClient} from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class UsuarioInformacionService {
  private url = environment.apiUrl;
  private http = inject(HttpClient);
  private listaCambio = new Subject<UsuarioInformacion[]>();

  constructor() { }

  list(): Observable<UsuarioInformacion[]>{
    return this.http.get<UsuarioInformacion[]>(this.url + "/usuarios-informacion");
  }

  listId(id: number): Observable<UsuarioInformacion>{
    return this.http.get<UsuarioInformacion>(this.url + "/usuario-informacion/" + id);
  }

  insert(usuarioInformacion: UsuarioInformacion): Observable<UsuarioInformacion>{
    return this.http.post<UsuarioInformacion>(this.url + "/usuario-informacion", usuarioInformacion);
  }

  // backward-compatible alias used by some components
  save(usuarioInformacion: UsuarioInformacion): Observable<UsuarioInformacion>{
    return this.insert(usuarioInformacion);
  }

  update(usuarioInformacion: UsuarioInformacion): Observable<UsuarioInformacion>{
    return this.http.put<UsuarioInformacion>(this.url + "/usuario-informacion", usuarioInformacion);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(this.url + "/usuario-informacion/" + id);
  }

  setList(listaNueva: UsuarioInformacion[]){
    this.listaCambio.next(listaNueva); //enviar la nueva lista a los suscriptores
  }

  getListaCambio(): Observable<UsuarioInformacion[]>{
    return this.listaCambio.asObservable();
  }

  actualizarLista(): void {
    this.list().subscribe({
      next: (data) => this.setList(data),   //envia la nueva lista a los suscriptores
      error: (err) => console.error('Error actualizando lista usuarios información', err)
    });
  }
}

import {inject, Injectable} from '@angular/core';
import {environment} from '../../environments/environment';
import {HttpClient} from '@angular/common/http';
import {Observable, Subject} from 'rxjs';
import {User} from '../model/user';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  private url = environment.apiUrl;
  private http: HttpClient = inject(HttpClient);
  private listaCambio = new Subject<User[]>();

  constructor() { }

  list(): Observable<any>{
    return this.http.get<User[]>(this.url + "/usuarios");
  }
  listId(id: number): Observable<any>{
    console.log(this.url + "/usuario/" + id)
    return this.http.get<User>(this.url + "/usuario/" + id);
  }
  insert(user: User): Observable<any>{
    return this.http.post(this.url + "/usuario", user);
  }
  // backward-compatible alias used by some components
  save(user: User): Observable<any>{
    return this.insert(user);
  }
  update(user: User): Observable<any>{
    return this.http.put(this.url + "/usuario", user);
  }
  delete(id: number) {
    return this.http.delete(this.url + "/usuario/" + id);
  }

  registrar(usuario: any): Observable<any> {
    // Asegurar que no se envíe el id al backend
    const { id, fecha_creacion, ...usuarioSinId } = usuario;
    console.log('Service - Usuario a enviar (sin id):', usuarioSinId);
    return this.http.post(this.url + "/registrar", usuarioSinId);
  }

  setList(listaNueva : User[]){
    this.listaCambio.next(listaNueva);//enviar la nueva lista a los suscriptores
  }
  getListaCambio(): Observable<User[]>{
    return this.listaCambio.asObservable();
  }
  actualizarLista(): void {
    this.list().subscribe({
      next: (data) => this.setList(data),   //envia la nueva lista a los suscriptores
      error: (err) => console.error('Error actualizando lista usuarios', err)
    });
  }
}

import {inject, Injectable} from '@angular/core';
import {environment} from '../../environments/environment';
import {HttpClient} from '@angular/common/http';
import {Observable, Subject} from 'rxjs';
import {Plato} from '../model/plato';

@Injectable({
  providedIn: 'root'
})
export class PlatoService {
  private url = environment.apiUrl;
  private httpClient: HttpClient = inject(HttpClient);
  private listaCambio: Subject<Plato[]> = new Subject();
  constructor(){
  }
  list(): Observable<any> {
    return this.httpClient.get<Plato[]>(this.url+"/platos")
  }
  listId(id: number): Observable<any>{
    return this.httpClient.get<any>(`${this.url}/plato/${id}`)
  }
  insert(plato: Plato){
    console.log(plato);
    return this.httpClient.post(this.url+"/plato", plato);
  }
  update(plato: Plato){
    console.log("Update enviando:", plato);
    return this.httpClient.put(this.url+"/plato", plato);
  }
  delete(id: number){
    return this.httpClient.delete(`${this.url}/plato/${id}`);
  }
  setList(listaNueva: Plato[]){
    this.listaCambio.next(listaNueva);
  }
  getListaCambio(){
    return this.listaCambio.asObservable();
  }
  actualizarLista() :void {
    this.list().subscribe({
      next: (data) => { this.setList(data);
        error: (err: any) => console.log(err)}
    })
  }
}


import {inject, Injectable} from '@angular/core';
import {environment} from '../../environments/environment';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {NivelActividad} from '../model/nivel-actividad';

@Injectable({
  providedIn: 'root',
})
export class NivelActividadService {
  private url = environment.apiUrl;
  private http: HttpClient = inject(HttpClient);

  constructor() { }

  list(): Observable<NivelActividad[]>{
    return this.http.get<NivelActividad[]>(this.url + "/nivel_actividades");
  }

  listId(id: number): Observable<NivelActividad>{
    return this.http.get<NivelActividad>(this.url + "/nivel_actividad/" + id);
  }
}

import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ObjetivoServices {
  private url = environment.apiUrl;
  private http: HttpClient = inject(HttpClient);

  constructor() {}

  // GET /objetivos
  findAll(): Observable<any[]> {
    return this.http.get<any[]>(this.url + '/objetivos');
  }

  // GET /objetivo/{id}
  findById(id: number): Observable<any> {
    return this.http.get<any>(this.url + '/objetivo/' + id);
  }
}

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, throwError } from 'rxjs';
import { Categoria } from '../model/categoria';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class CategoriaService {
  private http = inject(HttpClient);
  private api = environment.apiUrl;

  findAll(): Observable<Categoria[]> {
    const urlPlural = `${this.api}/categorias`;
    const urlSingular = `${this.api}/categoria`;
    return this.http.get<any>(urlPlural).pipe(
      map(this.normalizeList),
      map((arr) => arr.map(this.adaptCategoria)),
      catchError((err) => {
        if (err?.status === 404) {
          return this.http.get<any>(urlSingular).pipe(
            map(this.normalizeList),
            map((arr) => arr.map(this.adaptCategoria))
          );
        }
        return throwError(() => err);
      })
    );
  }

  findById(id: number): Observable<Categoria> {
    return this.http.get<Categoria>(`${this.api}/categoria/${id}`);
  }

  private normalizeList = (resp: any): any[] => {
    if (Array.isArray(resp)) return resp;
    if (!resp || typeof resp !== 'object') return [];
    const candidates = [
      resp.content,
      resp.items,
      resp.data,
      resp.results,
      resp.rows,
      resp.categorias,
      resp.categories,
      resp.list,
      resp.categoryList,
      resp.dataList,
    ];
    for (const c of candidates) if (Array.isArray(c)) return c;
    const nested = [resp?.data?.items, resp?.data?.content, resp?.data?.results, resp?.payload?.items];
    for (const n of nested) if (Array.isArray(n)) return n;
    return [];
  };

  private adaptCategoria = (raw: any): Categoria => {
    const c = new Categoria();
    if (!raw || typeof raw !== 'object') return c;
    c.idCategoria = raw.idCategoria ?? raw.id ?? raw.categoriaId ?? raw.categoryId ?? raw.id_categoria ?? 0;
    c.nombre = raw.nombre ?? raw.name ?? raw.nombreCategoria ?? raw.categoryName ?? '';
    c.informacion = raw.informacion ?? raw.info ?? '';
    return c;
  };
}

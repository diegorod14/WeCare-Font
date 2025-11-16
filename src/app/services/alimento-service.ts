import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError, map } from 'rxjs';
import { Alimento } from '../model/alimento';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AlimentoService {
  private http = inject(HttpClient);
  private api = environment.apiUrl;

  // GET /api/alimento/{id}
  findById(id: number): Observable<Alimento> {
    return this.http.get<Alimento>(`${this.api}/alimento/${id}`)
      .pipe(catchError(this.handle));
  }

  // GET /api/alimentos (con fallback a /api/alimento)
  findAll(): Observable<Alimento[]> {
    const urlPlural = `${this.api}/alimentos`;
    const urlSingular = `${this.api}/alimento`;
    return this.http.get<any>(urlPlural).pipe(
      map(this.normalizeList),
      map(arr => arr.map(this.adaptAlimento)),
      catchError((err) => {
        // Si el endpoint plural no existe (404), probamos el singular
        if (err?.status === 404) {
          return this.http.get<any>(urlSingular).pipe(
            map(this.normalizeList),
            map(arr => arr.map(this.adaptAlimento))
          );
        }
        return throwError(() => err);
      }),
      catchError(this.handle)
    );
  }

  // POST /api/alimento  (crea)
  save(dto: Alimento): Observable<Alimento> {
    return this.http.post<Alimento>(`${this.api}/alimento`, dto)
      .pipe(catchError(this.handle));
  }

  // PUT /api/alimento  (actualiza; tu API espera el DTO con id dentro del body)
  update(dto: Alimento): Observable<Alimento> {
    return this.http.put<Alimento>(`${this.api}/alimento`, dto)
      .pipe(catchError(this.handle));
  }

  // DELETE /api/alimento/{id}
  borrar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/alimento/${id}`)
      .pipe(catchError(this.handle));
  }

  // GET /api/alimentos/categoria/{nombre}
  findByCategoriaNombre(nombre: string): Observable<Alimento[]> {
    // encodeURIComponent por si el nombre tiene espacios/acentos
    const safe = encodeURIComponent(nombre);
    return this.http.get<any>(`${this.api}/alimentos/categoria/${safe}`).pipe(
      map(this.normalizeList),
      map(arr => arr.map(this.adaptAlimento)),
      catchError(this.handle)
    );
  }

  // Normaliza varias formas de listar (array directo o paginado)
  private normalizeList = (resp: any): any[] => {
    if (Array.isArray(resp)) return resp;
    if (!resp || typeof resp !== 'object') return [];
    const candidates = [resp.content, resp.items, resp.data, resp.result, resp.results, resp.rows, resp.alimentos];
    for (const c of candidates) {
      if (Array.isArray(c)) return c;
    }
    const nested = [resp?.data?.items, resp?.data?.content, resp?.data?.results];
    for (const n of nested) {
      if (Array.isArray(n)) return n;
    }
    return [];
  };

  // Adapta nombres alternativos de propiedades a nuestro modelo Alimento
  private adaptAlimento = (raw: any): Alimento => {
    const a = new Alimento();
    if (!raw || typeof raw !== 'object') return a;

    a.id = raw.idAlimento ?? raw.id ?? 0;
    a.nombre = raw.nombre ?? raw.name ?? raw.nombreAlimento ?? '';

    // Macronutrientes con múltiples alias + parsing de strings con unidades + fuzzy
    a.proteina = this.pickNumber(raw, ['proteinas','proteina','protein','proteins'])
      ?? this.pickByFuzzy(raw, [/^prot/i, /prote/i]);
    a.carbohidrato = this.pickNumber(raw, ['carbohidratos','carbohidrato','carbs','hidratos','hidratosCarbono'])
      ?? this.pickByFuzzy(raw, [/carb/i, /hidrato/i]);
    a.grasa = this.pickNumber(raw, ['grasas','grasa','fat','fats'])
      ?? this.pickByFuzzy(raw, [/^fat/i, /grasa/i, /lipid/i]);
    a.calorias = this.pickNumber(raw, ['calorias','kcal','calories','energia','energy'])
      ?? this.pickByFuzzy(raw, [/kcal/i, /calor(?!io)/i, /energ/i], [/calcio/i]);
    a.fibra = this.pickNumber(raw, ['fibra','fiber'])
      ?? this.pickByFuzzy(raw, [/fibr/i]);

    // Categoría: objeto, string o diferentes alias de id
    const categoriaRaw = raw.categoria ?? raw.category ?? null;
    const categoriaNombre = (typeof categoriaRaw === 'string')
      ? categoriaRaw
      : (categoriaRaw?.nombre ?? raw.categoriaNombre ?? raw.categoryName ?? raw.categoria_name ?? '');
    const categoriaId = categoriaRaw?.idCategoria ?? categoriaRaw?.id ?? raw.idCategoria ?? raw.categoriaId ?? raw.categoryId ?? raw.id_categoria;
    if (a.categoria) {
      if (categoriaId) a.categoria.idCategoria = Number(categoriaId);
      a.categoria.nombre = categoriaNombre || a.categoria.nombre;
    }

    return a;
  };

  private pickNumber(obj: any, keys: string[]): number {
    for (const k of keys) {
      const v = obj?.[k];
      const n = typeof v === 'string' ? Number(v) : v;
      if (typeof n === 'number' && !isNaN(n)) return n;
    }
    return 0;
  }

  // Extrae número desde strings con unidades ("3,5 g" o "3.5g") o devuelve NaN
  private toNumber(val: any): number {
    if (typeof val === 'number') return val;
    if (typeof val === 'string') {
      const match = val.replace(/\s+/g, '').match(/-?\d+(?:[\.,]\d+)?/);
      if (match) {
        const n = parseFloat(match[0].replace(',', '.'));
        if (!isNaN(n)) return n;
      }
      return NaN;
    }
    return NaN;
  }

  // Busca por nombres aproximados de propiedad y devuelve el primer valor numérico válido
  private pickByFuzzy(obj: any, include: RegExp[], exclude?: RegExp[]): number | undefined {
    if (!obj || typeof obj !== 'object') return undefined;
    for (const [key, val] of Object.entries(obj)) {
      const k = key.toLowerCase();
      if (include.some(r => r.test(k)) && !(exclude?.some(r => r.test(k)))) {
        const n = this.toNumber(val);
        if (!isNaN(n)) return n;
      }
    }
    return undefined;
  }
  private handle = (err: any) => {
    console.error('[AlimentoService] error', err);
    return throwError(() => err);
  };
}

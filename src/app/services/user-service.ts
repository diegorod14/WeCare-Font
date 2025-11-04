import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError, map } from 'rxjs';
import { User } from '../model/user';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private http = inject(HttpClient);
  private api = environment.apiUrl;

  // GET /api/usuario/{id}
  findById(id: number): Observable<User> {
    return this.http.get<User>(`${this.api}/usuario/${id}`)
      .pipe(
        map(this.adaptUser),
        catchError(this.handle)
      );
  }

  // GET /api/usuarios (con fallback a /api/usuario)
  findAll(): Observable<User[]> {
    const urlPlural = `${this.api}/usuarios`;
    const urlSingular = `${this.api}/usuario`;
    return this.http.get<any>(urlPlural).pipe(
      map(this.normalizeList),
      map(arr => arr.map(this.adaptUser)),
      catchError((err) => {
        // Si el endpoint plural no existe (404), probamos el singular
        if (err?.status === 404) {
          return this.http.get<any>(urlSingular).pipe(
            map(this.normalizeList),
            map(arr => arr.map(this.adaptUser))
          );
        }
        return throwError(() => err);
      }),
      catchError(this.handle)
    );
  }

  // POST /api/usuario (crea)
  save(dto: User): Observable<User> {
    return this.http.post<User>(`${this.api}/usuario`, dto)
      .pipe(
        map(this.adaptUser),
        catchError(this.handle)
      );
  }

  // PUT /api/usuario (actualiza; el DTO con id dentro del body)
  update(dto: User): Observable<User> {
    return this.http.put<User>(`${this.api}/usuario`, dto)
      .pipe(
        map(this.adaptUser),
        catchError(this.handle)
      );
  }

  // DELETE /api/usuario/{id}
  borrar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/usuario/${id}`)
      .pipe(catchError(this.handle));
  }

  // GET /api/usuario/username/{username}
  findByUsername(username: string): Observable<User> {
    const safe = encodeURIComponent(username);
    return this.http.get<User>(`${this.api}/usuario/username/${safe}`)
      .pipe(
        map(this.adaptUser),
        catchError(this.handle)
      );
  }

  // GET /api/usuario/correo/{correo}
  findByCorreo(correo: string): Observable<User> {
    const safe = encodeURIComponent(correo);
    return this.http.get<User>(`${this.api}/usuario/correo/${safe}`)
      .pipe(
        map(this.adaptUser),
        catchError(this.handle)
      );
  }

  // GET /api/usuarios/nombres/{nombres}
  findByNombres(nombres: string): Observable<User[]> {
    const safe = encodeURIComponent(nombres);
    return this.http.get<any>(`${this.api}/usuarios/nombres/${safe}`).pipe(
      map(this.normalizeList),
      map(arr => arr.map(this.adaptUser)),
      catchError(this.handle)
    );
  }

  // GET /api/usuarios/apellidos/{apellidos}
  findByApellidos(apellidos: string): Observable<User[]> {
    const safe = encodeURIComponent(apellidos);
    return this.http.get<any>(`${this.api}/usuarios/apellidos/${safe}`).pipe(
      map(this.normalizeList),
      map(arr => arr.map(this.adaptUser)),
      catchError(this.handle)
    );
  }

  // Normaliza varias formas de listar (array directo o paginado)
  private normalizeList = (resp: any): any[] => {
    if (Array.isArray(resp)) return resp;
    if (!resp || typeof resp !== 'object') return [];
    const candidates = [resp.content, resp.items, resp.data, resp.result, resp.results, resp.rows, resp.usuarios, resp.users];
    for (const c of candidates) {
      if (Array.isArray(c)) return c;
    }
    const nested = [resp?.data?.items, resp?.data?.content, resp?.data?.results];
    for (const n of nested) {
      if (Array.isArray(n)) return n;
    }
    return [];
  };

  // Adapta nombres alternativos de propiedades a nuestro modelo User
  private adaptUser = (raw: any): User => {
    const u = new User();
    if (!raw || typeof raw !== 'object') return u;

    u.id = raw.id ?? raw.idUsuario ?? raw.usuarioId ?? raw.userId ?? 0;
    u.username = raw.username ?? raw.userName ?? raw.user_name ?? raw.usuario ?? '';
    u.correo = raw.correo ?? raw.email ?? raw.mail ?? '';
    u.celular = this.pickNumber(raw, ['celular', 'telefono', 'phone', 'mobile', 'movil', 'cel']);
    u.nombres = raw.nombres ?? raw.nombre ?? raw.firstName ?? raw.first_name ?? raw.name ?? '';
    u.apellido = raw.apellido ?? raw.apellidos ?? raw.lastName ?? raw.last_name ?? raw.surname ?? '';

    // Fecha creación
    if (raw.fecha_creacion) {
      u.fecha_creacion = typeof raw.fecha_creacion === 'string'
        ? new Date(raw.fecha_creacion)
        : raw.fecha_creacion;
    } else if (raw.fechaCreacion) {
      u.fecha_creacion = typeof raw.fechaCreacion === 'string'
        ? new Date(raw.fechaCreacion)
        : raw.fechaCreacion;
    } else if (raw.createdAt || raw.created_at) {
      const fecha = raw.createdAt ?? raw.created_at;
      u.fecha_creacion = typeof fecha === 'string' ? new Date(fecha) : fecha;
    } else if (raw.fechaRegistro) {
      u.fecha_creacion = typeof raw.fechaRegistro === 'string'
        ? new Date(raw.fechaRegistro)
        : raw.fechaRegistro;
    }

    // Fecha actualización
    if (raw.fecha_actualizacion) {
      u.fecha_actualizacion = typeof raw.fecha_actualizacion === 'string'
        ? new Date(raw.fecha_actualizacion)
        : raw.fecha_actualizacion;
    } else if (raw.fechaActualizacion) {
      u.fecha_actualizacion = typeof raw.fechaActualizacion === 'string'
        ? new Date(raw.fechaActualizacion)
        : raw.fechaActualizacion;
    } else if (raw.updatedAt || raw.updated_at) {
      const fecha = raw.updatedAt ?? raw.updated_at;
      u.fecha_actualizacion = typeof fecha === 'string' ? new Date(fecha) : fecha;
    }

    return u;
  };

  private pickNumber(obj: any, keys: string[]): number {
    for (const k of keys) {
      const v = obj?.[k];
      const n = typeof v === 'string' ? Number(v) : v;
      if (typeof n === 'number' && !isNaN(n)) return n;
    }
    return 0;
  }

  private handle = (err: any) => {
    console.error('[UsuarioService] error', err);
    return throwError(() => err);
  };
}

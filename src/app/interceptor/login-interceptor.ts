import {HttpInterceptorFn, HttpStatusCode} from '@angular/common/http';
import {catchError, EMPTY, throwError} from 'rxjs';

export const loginInterceptor: HttpInterceptorFn = (req, next) => {
  console.log("Intercepto")
  const token = localStorage.getItem('token');
  console.log("Token recuperado:", token);
  let authReq = req;
  if (token) {
    authReq = req.clone({
      withCredentials : true,
      headers: req.headers.set('Authorization', 'Bearer '+
        localStorage.getItem('token')?.toString())
    });
    console.log("Se termino de clonar la solicitud con el token.");
  }
  return next(authReq).pipe(
    catchError(error => {
      console.log("Error en la petición");
      if (error.status === HttpStatusCode.Forbidden) {
        alert("NO TIENES PERMISOS!")
        return EMPTY;
      } else {
        return throwError(() => error);
      }
    })
  );
};


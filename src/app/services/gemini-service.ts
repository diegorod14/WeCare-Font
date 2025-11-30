import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class GeminiService {
  private apiUrl = `${environment.apiUrl}/v1/chat`;

  constructor(private http: HttpClient) {}

  chat(message: string): Observable<string> {
    return this.http.get(this.apiUrl, {params: { message }, responseType: 'text'
    });
  }
  welcome(): Observable<string> {
    return this.http.get(`${this.apiUrl}/welcome`, { responseType: 'text'
    });
  }
}

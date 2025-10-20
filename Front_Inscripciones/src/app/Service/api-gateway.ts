import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiGateway {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  matriculaAuth(validacion:String): Observable<any> {

    return this.http.post(`${this.baseUrl}/auth`, { validacion });

  };
  
}

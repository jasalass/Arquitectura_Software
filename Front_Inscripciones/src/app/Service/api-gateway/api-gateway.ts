import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ApiGatewayService {
  private baseUrl = environment.apiUrl; // ej: http://localhost:3000

  constructor(private http: HttpClient) {}

  // ---------- Inscripción ----------
  listarAsignaturas(periodoId?: number): Observable<any> {
    let params = new HttpParams();
    if (periodoId) params = params.set('periodoId', String(periodoId));
    // Gateway -> proxy /inscripcion
    return this.http.get(`${this.baseUrl}/inscripcion/asignaturas`, { params });
  }

  crearInscripcion(alumnoRef: string, seccionId: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/inscripcion/inscripciones`, { alumnoRef, seccionId });
  }

  // (opcional) asignaturas del alumno, en caso de que lo uses
  asignaturasAlumno(alumnoRef: string, periodoId?: number): Observable<any> {
    let params = new HttpParams();
    if (periodoId) params = params.set('periodoId', String(periodoId));
    return this.http.get(`${this.baseUrl}/inscripcion/alumnos/${alumnoRef}/asignaturas`, { params });
  }

  // ---------- Estado financiero (vive en micro Inscripción según tu backend) ----------
  getEstadoMatricula(alumnoRef: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/inscripcion/alumno-estado/${alumnoRef}`);
  }

  pagarMatricula(alumnoRef: string): Observable<any> {
    // Parchea matricula_pagada=true (tu micro lo expone en /inscripcion/alumno-estado/:id)
    return this.http.patch(`${this.baseUrl}/inscripcion/alumno-estado/${alumnoRef}`, {
      matricula_pagada: true,
      observacion: 'Pago realizado desde front'
    });
  }
}

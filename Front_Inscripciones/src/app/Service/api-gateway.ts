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
    return this.http.get(`${this.baseUrl}/inscripcion/asignaturas`, { params });
  }

  crearInscripcion(alumnoRef: string, seccionId: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/inscripcion/inscripciones`, { alumnoRef, seccionId });
  }

  asignaturasAlumno(alumnoRef: string, periodoId?: number): Observable<any> {
    let params = new HttpParams();
    if (periodoId) params = params.set('periodoId', String(periodoId));
    return this.http.get(`${this.baseUrl}/inscripcion/alumnos/${alumnoRef}/asignaturas`, { params });
  }

  // ---------- Estado financiero ----------
  getEstadoMatricula(alumnoRef: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/inscripcion/alumno-estado/${alumnoRef}`);
  }

  pagarMatricula(alumnoRef: string): Observable<any> {
    return this.http.patch(`${this.baseUrl}/inscripcion/alumno-estado/${alumnoRef}`, {
      matricula_pagada: true,
      observacion: 'Pago realizado desde front'
    });
  }

  // ---------- NUEVOS MÉTODOS FUNDAMENTALES ----------

  // Crear alumno
  crearAlumno(alumno: { rut: string; nombre: string; email: string; telefono?: string }): Observable<any> {
    return this.http.post(`${this.baseUrl}/alumnos`, alumno);
  }

  // Crear asignatura
  crearAsignatura(asignatura: { codigo: string; nombre: string; creditos: number; prerequisitos?: number[] }): Observable<any> {
    return this.http.post(`${this.baseUrl}/asignaturas`, asignatura);
  }

  // Actualizar alumno
  actualizarAlumno(alumnoRef: string, datos: { nombre?: string; email?: string; telefono?: string }): Observable<any> {
    return this.http.patch(`${this.baseUrl}/alumnos/${alumnoRef}`, datos);
  }

  // Eliminar alumno
  eliminarAlumno(alumnoRef: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/alumnos/${alumnoRef}`);
  }

  // Eliminar asignatura
  eliminarAsignatura(asignaturaId: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/asignaturas/${asignaturaId}`);
  }

  // Buscar alumno por RUT
  buscarAlumnoPorRut(rut: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/alumnos/rut/${rut}`);
  }
}

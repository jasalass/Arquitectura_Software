import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class ApiGateway {
  private http = inject(HttpClient);
  private base = environment.apiUrl; // p.ej. http://localhost:3000
  /// --- mocks internos para desarrollo ---
  private MOCK_ASIGNATURAS = [
  {
    id: 1,
    codigo: 'INF101',
    nombre: 'Introducción a la Programación',
    creditos: 6,
    prerequisitos: []
  },
  {
    id: 2,
    codigo: 'INF102',
    nombre: 'Estructuras de Datos',
    creditos: 6,
    prerequisitos: [{ id: 1, codigo: 'INF101', nombre: 'Introducción a la Programación' }]
  },
  {
    id: 3,
    codigo: 'MAT101',
    nombre: 'Matemáticas I',
    creditos: 5,
    prerequisitos: []
  }
];

private MOCK_INSCRITAS_BY_ALUMNO: Record<string, any[]> = {
  // alumnoRef -> array inscritas
  'demo-1': [
    { id: 1, codigo: 'INF101', nombre: 'Introducción a la Programación', creditos: 6, seccion_id: 101, periodo_id: 1, anio: 2025, semestre: 1 }
  ],
  'demo-2': []
};

private MOCK_ESTADO_BY_ALUMNO: Record<string, any> = {
  'demo-1': { alumno_ref: 'demo-1', matricula_pagada: true, observacion: null },
  'demo-2': { alumno_ref: 'demo-2', matricula_pagada: false, observacion: 'Pago pendiente' }
};


  // ------------ AUTH ------------
  // login: envia email y password al gateway (/auth)
  login(email: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.base}/auth`, { email, password }).pipe(
      // mapear respuesta real de la API al formato que usa tu app
      map((res: any) => {
        if (!res || !res.success) {
          return { success: false, message: res?.message || 'Error' };
        }

        const user = res.user;
        const matriculaPagada = user?.estado_matricula === 'PAGADA';
        return {
          success: true,
          token: res.token,
          expiresIn: res.expiresIn,
          registrado: true,
          matriculaPagada,
          user
        };
      }),
      // en caso de error HTTP, puedes devolver mock (fallback) o propagar error
      catchError(err => {
        console.warn('Servidor no respondió, usando mock (fallback)');
        // fallback mock (igual que ya tienes) — opcional
        const mockUsuarios = [
          { email: 'pagado@email.com', password: 'M4tr1cula2025!', registrado: true, matriculaPagada: true, user: { email: 'pagado@email.com', estado_matricula: 'PAGADA' } },
          { email: 'nopago@email.com', password: 'P@goPendiente', registrado: true, matriculaPagada: false, user: { email: 'nopago@email.com', estado_matricula: 'PENDIENTE' } },
          { email: 'desconocido@email.com', password: 'Acc3soDenegado!', registrado: false }
        ];
        const u = mockUsuarios.find(x => x.email === email && x.password === password);
        if (!u) {
          return of({ success: false, registrado: false, message: 'Credenciales inválidas' });
        }
        return of({
          success: true,  
          token: 'mock-token',
          expiresIn: 3600, 
          registrado: u.registrado,
          matriculaPagada: u.matriculaPagada,
          user: u.user || null
        });
      })
    );
  }

  // ------------ INSCRIPCION ------------
  // listar todas las asignaturas
  listarAsignaturas(): Observable<any[]> {
  return this.http.get<any[]>(`${this.base}/inscripcion/asignaturas`).pipe(
    catchError(err => {
      console.warn('Inscripcion list failed, returning mock', err);
      // devolver copia para evitar mutaciones compartidas
      return of(JSON.parse(JSON.stringify(this.MOCK_ASIGNATURAS)));
    })
  );
  }

  // asignaturas inscritas de un alumno
  asignaturasAlumno(alumnoRef: string, periodoId?: number): Observable<any[]> {
  const q = periodoId ? `?periodoId=${periodoId}` : '';
  return this.http.get<any[]>(`${this.base}/inscripcion/alumnos/${alumnoRef}/asignaturas${q}`).pipe(
    catchError(err => {
      console.warn('Inscripciones alumno failed, returning mock for', alumnoRef, err);
      const mock = this.MOCK_INSCRITAS_BY_ALUMNO[alumnoRef] ?? [];
      return of(JSON.parse(JSON.stringify(mock)));
    })
  );
}

  // crear inscripcion
  inscribir(alumnoRef: string, seccionId: number): Observable<any> {
  return this.http.post<any>(`${this.base}/inscripcion/inscripciones`, { alumnoRef, seccionId }).pipe(
    catchError(err => {
      console.warn('Inscripcion failed upstream, simulating mock logic', err);
      // Simulación básica de validaciones del backend
      //  - si alumno no existe en mock, retornar error
      const inscritas = this.MOCK_INSCRITAS_BY_ALUMNO[alumnoRef] ?? [];
      // Simular duplicado si ya hay una inscripción con misma seccion_id
      if (inscritas.some(i => i.seccion_id === seccionId)) {
        return throwError(() => ({ status: 400, error: { error: 'Ya inscrito en esta sección' } }));
      }
      // Simular sin cupos para seccionId concreto (ejemplo)
      if (seccionId === 9999) {
        return throwError(() => ({ status: 400, error: { error: 'Sin cupos disponibles' } }));
      }
      // Simular prerrequisito no cumplido si asignatura tiene prereq y alumno no la tiene
      const asignatura = this.MOCK_ASIGNATURAS.find(a => a.id === seccionId || a.id === seccionId /* adaptar según mapeo */);
      if (asignatura?.prerequisitos?.length) {
        const requiredIds = asignatura.prerequisitos.map((p: any) => p.id);
        const okIds = inscritas.map(i => i.id);
        const missing = requiredIds.filter((r: number) => !okIds.includes(r));
        if (missing.length > 0) {
          const faltantes = asignatura.prerequisitos.filter((p: any) => missing.includes(p.id)).map((p: any) => `${p.codigo} - ${p.nombre}`).join(', ');
          return throwError(() => ({ status: 400, error: { error: `Prerrequisitos no cumplidos: ${faltantes}` } }));
        }
      }

      // Si todo bien, simular creación
      const nueva = { id: Date.now(), seccion_id: seccionId, alumno_ref: alumnoRef, estado: 'INSCRITA' };
      // actualizar mock in-memory para la sesión actual (no persistente)
      if (!this.MOCK_INSCRITAS_BY_ALUMNO[alumnoRef]) this.MOCK_INSCRITAS_BY_ALUMNO[alumnoRef] = [];
      this.MOCK_INSCRITAS_BY_ALUMNO[alumnoRef].push({
        id: asignatura?.id ?? seccionId,
        codigo: asignatura?.codigo ?? `S${seccionId}`,
        nombre: asignatura?.nombre ?? `Sección ${seccionId}`,
        creditos: asignatura?.creditos ?? 0,
        seccion_id: seccionId,
        periodo_id: 1,
        anio: new Date().getFullYear(),
        semestre: 1
      });

      return of({ success: true, result: nueva });
    })
  );
}

  // estado de matrícula
  estadoAlumno(alumnoRef: string): Observable<any> {
  return this.http.get<any>(`${this.base}/inscripcion/alumno-estado/${alumnoRef}`).pipe(
    catchError(err => {
      console.warn('Estado alumno failed, returning mock', alumnoRef, err);
      const mock = this.MOCK_ESTADO_BY_ALUMNO[alumnoRef] ?? { alumno_ref: alumnoRef, matricula_pagada: false };
      return of(JSON.parse(JSON.stringify(mock)));
    })
  );
  }
  // ------------ Helpers ------------
  // header con token (si lo necesitas por llamada manual)

  private headersWithToken(): { headers: HttpHeaders } {
    const token = sessionStorage.getItem('token') || '';
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    });
    return { headers };
  }
}
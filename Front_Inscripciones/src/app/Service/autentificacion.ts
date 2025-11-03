import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable, of } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class Autentificacion {
  private baseUrl = environment.apiUrl;

  private estadoUsuario = {
    registrado: false,
    matriculaPagada: false,
    token: null as string | null,
    user: null as any
  };

  constructor(private http: HttpClient) {
    // inicializar desde sessionStorage si existe
    const token = sessionStorage.getItem('token');
    const reg = sessionStorage.getItem('registrado');
    const pag = sessionStorage.getItem('matriculaPagada');
    const userJson = sessionStorage.getItem('user');
    this.estadoUsuario.token = token;
    if (reg) this.estadoUsuario.registrado = reg === 'true';
    if (pag) this.estadoUsuario.matriculaPagada = pag === 'true';
    if (userJson) this.estadoUsuario.user = JSON.parse(userJson);
  }

  login(email: string, password: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth`, { email, password }).pipe(
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
          token: 'demo-token',
          expiresIn: 3600,
          registrado: !!u.registrado,
          matriculaPagada: !!u.matriculaPagada,
          user: u.user || null
        });
      }),
      // si la respuesta es success, actualizar estado y persistir
      tap((res: any) => {
        if (res && res.success) {
          this.setEstadoUsuario(true, !!res.matriculaPagada, res.token, res.user);
        }
      })
    );
  }

  setEstadoUsuario(registrado: boolean, matriculaPagada: boolean, token?: string | null, user?: any) {
    this.estadoUsuario = { registrado, matriculaPagada, token: token || null, user: user || null };
    sessionStorage.setItem('registrado', String(registrado));
    sessionStorage.setItem('matriculaPagada', String(matriculaPagada));
    if (token) sessionStorage.setItem('token', token);
    if (user) sessionStorage.setItem('user', JSON.stringify(user));
  }

  getEstadoUsuario() {
    return { ...this.estadoUsuario };
  }

  logout() {
    this.estadoUsuario = { registrado: false, matriculaPagada: false, token: null, user: null };
    sessionStorage.removeItem('registrado');
    sessionStorage.removeItem('matriculaPagada');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
  }
}
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';

export type UserPayload = {
  uuid: string;
  email: string;
  nombre: string;
  apellido: string;
  rut: string;
  roles: string[];
  permisos: string[];
  carrera: string;
  plan: string;
  semestre_actual: number;
  avatar_url: string;
  ultimo_acceso: string;
  estado_matricula: 'PAGADA' | 'PENDIENTE' | 'BLOQUEADA' | string;
};

@Injectable({ providedIn: 'root' })
export class AuthStateService {
  private userSubject = new BehaviorSubject<UserPayload | null>(null);
  private hydrated = false;

  // Evita emisiones repetidas si no cambió el usuario (o su estado de matrícula)
  user$ = this.userSubject.asObservable().pipe(
    distinctUntilChanged((a, b) => (a?.uuid === b?.uuid) && (a?.estado_matricula === b?.estado_matricula))
  );

  setUser(u: UserPayload | null) {
    this.userSubject.next(u);
    if (u) sessionStorage.setItem('user', JSON.stringify(u));
    else sessionStorage.removeItem('user');
  }

  loadFromSessionOnce() {
    if (this.hydrated) return;
    this.hydrated = true;
    const raw = sessionStorage.getItem('user');
    if (raw) {
      try { this.userSubject.next(JSON.parse(raw)); } catch {}
    }
  }

  clear() {
    sessionStorage.removeItem('isLoggedIn');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    this.userSubject.next(null);
    // permitimos hidratar en un próximo arranque
    this.hydrated = false;
  }

  get snapshot(): UserPayload | null {
    return this.userSubject.value;
  }
}

import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import {
  IonContent, IonHeader, IonTitle, IonToolbar,
  IonGrid, IonRow, IonCol, IonCard, IonCardContent,
  IonCardTitle, IonCardHeader,
  IonBadge, IonButton, IonIcon, IonChip, IonSpinner, IonAvatar, IonLabel
} from '@ionic/angular/standalone';

import { Subscription } from 'rxjs';
import { ApiGatewayService } from '../Service/api-gateway/api-gateway';
import { AuthStateService, UserPayload } from '../Service/auth-state/auth-state';


@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  imports: [
    CommonModule,
    IonContent, IonHeader, IonTitle, IonToolbar,
    IonGrid, IonRow, IonCol, IonCard,IonCardContent,IonCardTitle,IonCardHeader,
    IonBadge, IonButton, IonIcon, IonChip, IonSpinner, IonAvatar, IonLabel
  ]
})
export class HomePage implements OnInit, OnDestroy {
  // ======= Estado de sesión/usuario =======
  user: UserPayload | null = null;
  estadoFinanciero: 'PAGADA' | 'PENDIENTE' | 'BLOQUEADA' | string = 'PENDIENTE';

  // ======= Datos de UI =======
  asignaturas: any[] = [];
  loadingEstado = false;
  loadingPago = false;
  loadingAsignaturas = false;
  loadingInscribir: Record<number, boolean> = {};
  inscribirLog: any = null;

  // cache de secciones inscritas (IDs)
  seccionesInscritas = new Set<number>();

  private sub?: Subscription;

  constructor(
    private api: ApiGatewayService,
    private router: Router,
    private authState: AuthStateService
  ) {}

  ngOnInit(): void {
    // Hidrata una sola vez desde sessionStorage
    this.authState.loadFromSessionOnce?.();

    // Única suscripción al estado de usuario
    this.sub = this.authState.user$.subscribe(u => {
      const changedUser = u?.uuid !== this.user?.uuid;
      this.user = u;
      this.estadoFinanciero = u?.estado_matricula ?? 'PENDIENTE';

      if (!u) {
        // sin sesión: limpia UI
        this.asignaturas = [];
        this.seccionesInscritas.clear();
        this.estadoFinanciero = 'PENDIENTE';
        return;
      }

      // Si cambió de usuario (o es el primer render), carga info
      if (changedUser) {
        this.syncEstado();
        this.cargarAsignaturas();
        this.cargarInscripcionesAlumno();
      }
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  // ==========================================================
  // 🔹 Estado financiero (matrícula)
  // ==========================================================
  syncEstado() {
    if (!this.user?.uuid) return;
    this.loadingEstado = true;

    this.api.getEstadoMatricula(this.user.uuid).subscribe({
      next: (res: any) => {
        this.estadoFinanciero = res?.estado_matricula || this.user!.estado_matricula || 'PENDIENTE';

        // merge + persist + emitir (solo si cambió)
        const merged: UserPayload = { ...this.user!, estado_matricula: this.estadoFinanciero };
        sessionStorage.setItem('user', JSON.stringify(merged));
        this.authState.setUser(merged);

        this.loadingEstado = false;
      },
      error: () => { this.loadingEstado = false; }
    });
  }

  pagar() {
    if (!this.user?.uuid) return;
    this.loadingPago = true;

    this.api.pagarMatricula(this.user.uuid).subscribe({
      next: (res: any) => {
        this.estadoFinanciero = res?.estado_matricula || 'PAGADA';

        const merged: UserPayload = { ...this.user!, estado_matricula: this.estadoFinanciero };
        sessionStorage.setItem('user', JSON.stringify(merged));
        this.authState.setUser(merged);

        this.loadingPago = false;
        alert('✅ Matrícula pagada exitosamente.');
      },
      error: (err) => {
        console.error(err);
        this.loadingPago = false;
        alert(err?.error?.message || 'Error al pagar matrícula');
      }
    });
  }

  // ==========================================================
  // 🔹 Asignaturas e inscripciones
  // ==========================================================
  cargarAsignaturas() {
    this.loadingAsignaturas = true;

    this.api.listarAsignaturas().subscribe({
      next: (res: any) => {
        this.asignaturas = Array.isArray(res) ? res : (res?.data || []);
        this.loadingAsignaturas = false;
      },
      error: () => { this.loadingAsignaturas = false; }
    });
  }

  cargarInscripcionesAlumno() {
    if (!this.user?.uuid) return;

    this.api.asignaturasAlumno(this.user.uuid).subscribe({
      next: (lista: any[]) => {
        this.seccionesInscritas.clear();
        (lista || []).forEach((x: any) => {
          if (x?.seccion_id != null) this.seccionesInscritas.add(Number(x.seccion_id));
        });
      },
      error: () => {}
    });
  }

  isSeccionInscrita(seccionId: number): boolean {
    return this.seccionesInscritas.has(Number(seccionId));
  }

  inscribir(seccionId: number) {
    if (!this.user?.uuid) return;

    if (this.estadoFinanciero !== 'PAGADA') {
      alert('⚠️ Debes tener la matrícula pagada.');
      return;
    }

    this.loadingInscribir[seccionId] = true;

    this.api.crearInscripcion(this.user.uuid, seccionId).subscribe({
      next: (res) => {
        this.inscribirLog = res;
        this.loadingInscribir[seccionId] = false;

        // refresca oferta y “marcas” de inscrito
        this.cargarAsignaturas();
        this.cargarInscripcionesAlumno();
      },
      error: (err) => {
        this.loadingInscribir[seccionId] = false;
        this.inscribirLog = err?.error || err;
        alert(err?.error?.error || err?.error?.message || 'Error al inscribir');
      }
    });
  }

  // ==========================================================
  // 🔹 Sesión
  // ==========================================================
  logout() {
    this.authState.clear();
    this.router.navigate(['/login'], { replaceUrl: true }); // navegación limpia sin reload
  }

  // Para *ngFor trackBy
  trackByAsig = (_: number, a: any) => a?.id ?? a?.codigo ?? _;
}

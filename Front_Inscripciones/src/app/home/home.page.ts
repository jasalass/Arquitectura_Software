import { Component, inject } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButton } from '@ionic/angular/standalone';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonButton],
})
export class HomePage {
  private router = inject(Router);

  // Navegar a las diferentes páginas
  irAAsignaturas() {
    this.router.navigate(['/asignaturas']);
  }

  irAInscritas() {
    this.router.navigate(['/ver-inscritas']);
  }

  irAPagoMatricula() {
    this.router.navigate(['/pago-matricula']);
  }
}

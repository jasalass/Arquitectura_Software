import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonLabel, IonItem } from '@ionic/angular/standalone';
import { Apipago } from '../Service/apipago';
import { Router } from '@angular/router';

@Component({
  selector: 'app-resultado',
  templateUrl: './resultado.page.html',
  styleUrls: ['./resultado.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonButton, IonItem, IonLabel]
})
export class ResultadoPage {
  rut: string = '';
  matriculaPagada: boolean = false;
  private router = inject(Router);

  constructor(private apipago: Apipago) {}

  ngOnInit() {
    // Obtener el RUT enviado desde pago-matricula
    const nav = this.router.getCurrentNavigation();
    this.rut = nav?.extras?.state?.['rut'] || '';

    if (!this.rut) {
      alert('No se recibió RUT');
      this.router.navigate(['/pago-matricula']);
      return;
    }

    this.realizarPago();
  }

  realizarPago() {
    if (!this.rut) {
      alert('Por favor ingrese el RUT');
      return;
    }

    this.apiGateway.pagarMatricula(this.rut).subscribe({
      next: res => {
        // Asumimos que si no hay error, el pago fue exitoso
        this.router.navigate(['/resultado'], { state: { rut: this.rut } });
      },
      error: err => {
        console.error('Error al pagar matrícula:', err);
        alert('No se pudo procesar el pago, intente nuevamente');
      }
    });
  }

  irHome() {
    this.router.navigate(['/home']);
  }

  irPagoMatricula() {
    this.router.navigate(['/pago-matricula']);
  }
}

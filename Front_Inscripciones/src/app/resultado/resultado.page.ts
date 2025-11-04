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
    this.apipago.confirmarPagoMatricula(this.rut).subscribe({
      next: res => {
        if (res.success) {
          sessionStorage.setItem('matriculaPagada', 'true');
          this.matriculaPagada = true;
        } else {
          this.matriculaPagada = false;
          alert(res.message);
        }
      },
      error: err => {
        console.error(err);
        alert('Error al procesar el pago');
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

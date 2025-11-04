import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonItem, IonLabel, IonInput } from '@ionic/angular/standalone';
import { Router } from '@angular/router';

@Component({
  selector: 'app-pago-matricula',
  templateUrl: './pago-matricula.html',
  styleUrls: ['./pago-matricula.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonButton, IonItem, IonLabel, IonInput]
})
export class PagoMatricula {
  rut: string = '';
  private router = inject(Router);

  irAResultado() {
    if (!this.rut) {
      alert('Debes ingresar tu RUT');
      return;
    }
    // Navegar a la página resultado pasando el RUT
    this.router.navigate(['/resultado'], { state: { rut: this.rut } });
  }
}

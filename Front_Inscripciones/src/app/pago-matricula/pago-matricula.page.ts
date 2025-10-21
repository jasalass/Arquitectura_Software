import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';

@Component({
  selector: 'app-pago-matricula',
  templateUrl: './pago-matricula.page.html',
  styleUrls: ['./pago-matricula.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class PagoMatricula {

  constructor() { }
  ngOnInit() {
  }
  
  rut: string = '';
  estado: string | null = null;

  buscarEstado() {
    // 🔹 Por ahora es una simulación simple.
    // Más adelante puedes reemplazar esto por una llamada al backend (HttpClient)
    if (this.rut === '12.345.678-9') {
      this.estado = 'PREINSCRITA';
    } else if (this.rut === '11.111.111-1') {
      this.estado = 'INSCRITA';
    } else {
      this.estado = 'No encontrado';
    }
  }
}





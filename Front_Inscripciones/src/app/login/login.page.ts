import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonItem, IonLabel, IonCol, IonGrid, IonRow, IonButton, IonInputPasswordToggle } from '@ionic/angular/standalone';
import { Autentificacion } from '../Service/autentificacion';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonItem, IonLabel, IonCol, IonGrid, IonRow, IonButton, IonInputPasswordToggle, ToastController]
})
export class LoginPage implements OnInit {

  email = '';
  password = '';
  toastController: ToastController = new ToastController();

  constructor(private auth: Autentificacion, private router: Router) {}

  submit() {
  this.auth.login(this.email, this.password).subscribe({
    next: res => {
      if (!res.success) {
        this.showToast('Acceso denegado: usuario no registrado');
        return;
      }

      if (res.matriculaPagada) {
        this.router.navigate(['/home']);
      } else {
        this.router.navigate(['/pago']);
      }
    },
    error: err => {
      this.showToast('Error de conexión con el servidor');
      console.error(err);
    }
  });
  }
  async showToast(message: string) {
     const toast = await this.toastController.create({
    message,
    duration: 2000,
    color: 'danger',
    position: 'bottom'
    });
    toast.present();
  }

  ngOnInit() {
  }

}

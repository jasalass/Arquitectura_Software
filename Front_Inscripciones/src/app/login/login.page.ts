// src/app/login/login.page.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent, IonHeader, IonTitle, IonToolbar,
  IonItem, IonLabel, IonInput, IonInputPasswordToggle, IonButton,
  IonGrid, IonRow, IonCol,
  IonCard, IonCardHeader, IonCardTitle, IonCardContent
} from '@ionic/angular/standalone';
import { Autentificacion } from '../Service/autentificacion';
import { NavController } from '@ionic/angular';
import { AuthStateService } from '../Service/auth-state/auth-state';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  imports: [
    CommonModule, FormsModule,
    IonContent, IonHeader, IonTitle, IonToolbar,
    IonItem, IonLabel, IonInput, IonInputPasswordToggle, IonButton,
    IonGrid, IonRow, IonCol,              // ✅ necesarios para <ion-grid>/<ion-row>/<ion-col>
    IonCard, IonCardHeader, IonCardTitle, IonCardContent // si usas <ion-card> en el HTML
  ]
})
export class LoginPage {
  email = '';
  password = '';

  constructor(
    private auth: Autentificacion,
    private navCtrl: NavController,
    private authState: AuthStateService,
    private router: Router
  ) {}

  submit() {
    if (!this.email || !this.password) {
      alert('Ingrese email y contraseña');
      return;
    }

    this.auth.login(this.email, this.password).subscribe({
      next: (res) => {
        if (res?.success && res?.user) {
          sessionStorage.setItem('isLoggedIn', 'true');
          sessionStorage.setItem('token', res.token || '');
          sessionStorage.setItem('user', JSON.stringify(res.user));
          this.authState.setUser(res.user);
          this.router.navigate(['/home'], { replaceUrl: true });
        } else {
          alert(res?.message || 'Credenciales inválidas');
        }
      },
      error: (err) => {
        console.error(err);
        alert(err?.error?.message || 'Error al conectar con el servidor');
      }
    });
  }
}

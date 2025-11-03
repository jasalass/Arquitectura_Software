import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonItem, IonLabel,
  IonCol, IonGrid, IonRow, IonButton, IonInput, IonInputPasswordToggle, IonButtons
} from '@ionic/angular/standalone';
import { ToastController } from '@ionic/angular';
import { Autentificacion } from '../Service/autentificacion';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, ReactiveFormsModule,
    IonItem, IonLabel, IonCol, IonGrid, IonRow, IonButton, IonInput, IonInputPasswordToggle,
    IonButtons
  ]
})
export class LoginPage implements OnInit {
  form: FormGroup;

  private fb = inject(FormBuilder);
  private auth = inject(Autentificacion);
  private router = inject(Router);
  private toastController = inject(ToastController);

  constructor() {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  ngOnInit() {}

  submit() {
    if (this.form.invalid) {
      this.showToast('Complete los campos correctamente');
      return;
    }

    const { email, password } = this.form.value;
    this.auth.login(email, password).subscribe({
      next: res => {
        if (!res || !res.success) {
          this.showToast(res?.message || 'Acceso denegado: usuario no registrado');
          return;
        }
        // El servicio debe setear el estado / sessionStorage (ver implementaciones previas)
        if (res.matriculaPagada) {
          this.router.navigate(['/home']);
        } else {
          this.router.navigate(['/pago']);
        }
      },
      error: err => {
        console.error(err);
        this.showToast('Error de conexión con el servidor');
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
    await toast.present();
  }
  async presentToast(message: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
      position: 'bottom'
    });
    toast.present();
  }
  openHelp() {
    this.router.navigate(['/help-login']);
  }
}
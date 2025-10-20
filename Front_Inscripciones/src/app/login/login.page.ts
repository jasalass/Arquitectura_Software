import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
<<<<<<< HEAD:Front_Indcripsiones/src/app/login/login.page.ts
import { IonContent, IonHeader, IonTitle, IonToolbar, IonItem, IonLabel, IonCol, IonGrid, IonRow, IonButton, IonInputPasswordToggle } from '@ionic/angular/standalone';
=======
import { IonContent, IonHeader, IonTitle, IonToolbar, IonItem, IonLabel, IonCol, IonGrid, IonRow, IonButton, IonInputPasswordToggle, IonInput } from '@ionic/angular/standalone';
>>>>>>> 4a409fd75b86379ef4cf2d8e7289bbef91ca1134:Front_Inscripciones/src/app/login/login.page.ts
import { Autentificacion } from '../Service/autentificacion';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
<<<<<<< HEAD:Front_Indcripsiones/src/app/login/login.page.ts
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonItem, IonLabel, IonCol, IonGrid, IonRow, IonButton, IonInputPasswordToggle]
=======
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonItem, IonLabel, IonCol, IonGrid, IonRow, IonButton, IonInputPasswordToggle, IonInput]
>>>>>>> 4a409fd75b86379ef4cf2d8e7289bbef91ca1134:Front_Inscripciones/src/app/login/login.page.ts
})
export class LoginPage implements OnInit {

  email = '';
  password = '';

  constructor(private auth: Autentificacion, private router: Router) {}

    submit() {
    this.auth.login(this.email, this.password).subscribe({
      next: res => {
        if (res.success) {
          alert('Login Exitoso');
          
          this.router.navigateByUrl('/home');
        } else {
          alert('Credenciales inválidas');
        }
      },
      error: err => {
        alert('Error al conectar con el servidor');
        console.error(err);
      }
    });
  }

  ngOnInit() {
  }

}

import { Routes } from '@angular/router';
import { authGuard } from './aut-guard';

export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
    canActivate: [authGuard]
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () => import('./login/login.page').then( m => m.LoginPage)
  },
  {
    path: 'pago-matricula',
    loadComponent: () => import('./pago-matricula/pago-matricula').then( m => m.PagoMatricula),
    canActivate: [authGuard]

  },  {
    path: 'resultado',
    loadComponent: () => import('./resultado/resultado.page').then( m => m.ResultadoPage)
  },
  {
    path: 'asignaturas',
    loadComponent: () => import('./asignaturas/asignaturas.page').then( m => m.AsignaturasPage)
  },
  {
    path: 'inscritas',
    loadComponent: () => import('./inscritas/inscritas.page').then( m => m.InscritasPage)
  }


];

import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);

  const registrado = sessionStorage.getItem('registrado') === 'true';
  const matriculaPagada = sessionStorage.getItem('matriculaPagada') === 'true';

  if (!registrado) {
    router.navigate(['/login']);
    return false;
  }

  if (!matriculaPagada) {
    router.navigate(['/pago']);
    return false;
  }

  return true; // acceso permitido a rutas protegidas
};

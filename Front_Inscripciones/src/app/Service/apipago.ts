import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class Apipago {
  private http = inject(HttpClient);
  private base = environment.apiUrl3; // p.ej. http://localhost:7000

  private MOCK_PAGOS: Record<string, boolean> = {
  '12.345.678-9': false,
  '11.111.111-1': true
};

confirmarPagoMatricula(rut: string): Observable<any> {
  // simulación local sin servidor
  const exito = this.MOCK_PAGOS[rut] ?? false;
  if (exito) {
    return of({ success: true, estado_inscripcion: true });
  } else {
    return of({ success: false, message: 'Pago fallido' });
  }
}



}

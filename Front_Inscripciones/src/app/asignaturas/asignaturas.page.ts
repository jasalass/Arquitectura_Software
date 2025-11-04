import { Component, OnInit } from '@angular/core';
import { ApiGateway } from '../../app/Service/api-gateway';

@Component({
  selector: 'app-asignaturas',
  templateUrl: './asignaturas.page.html',
  styleUrls: ['./asignaturas.page.scss'],
})
export class AsignaturasPage implements OnInit {
  alumnoRef = 'demo-1';
  asignaturasDisponibles: any[] = [];
  asignaturasInscritas: any[] = [];
  mensaje = '';
  cargando = false;

  constructor(private api: ApiGateway) {}

  ngOnInit() {
    this.cargarAsignaturas();
    this.cargarInscritas();
  }

  // listar asignaturas disponibles
  cargarAsignaturas() {
    this.api.listarAsignaturas().subscribe(asigs => {
      this.asignaturasDisponibles = asigs;
    });
  }

  // listar inscritas del alumno
  cargarInscritas() {
    this.api.asignaturasAlumno(this.alumnoRef).subscribe(inscritas => {
      this.asignaturasInscritas = inscritas;
    });
  }

  // inscribir una asignatura
  inscribir(asignatura: any) {
    this.cargando = true;
    this.api.inscribir(this.alumnoRef, asignatura.id).subscribe({
      next: res => {
        this.mensaje = `✅ Inscripción exitosa en ${asignatura.nombre}`;
        this.cargando = false;
        this.cargarInscritas();
      },
      error: err => {
        this.mensaje = `❌ ${err.error?.error || 'Error al inscribir'}`;
        this.cargando = false;
      }
    });
  }

  // confirmar todas las inscripciones
  confirmar() {
    if (this.asignaturasInscritas.length === 0) {
      this.mensaje = '⚠️ No tienes ramos para confirmar.';
      return;
    }

    this.api.confirmarInscripcion().subscribe({
      next: res => this.mensaje = '✅ Inscripción confirmada correctamente.',
      error: () => this.mensaje = '❌ Error al confirmar inscripción.'
    });
  }
}

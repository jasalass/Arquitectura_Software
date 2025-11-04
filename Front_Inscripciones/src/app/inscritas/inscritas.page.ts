import { Component, OnInit } from '@angular/core';
import { ApiGateway } from '../../app/Service/api-gateway';

@Component({
  selector: 'app-inscritas',
  templateUrl: './inscritas.page.html',
  styleUrls: ['./inscritas.page.scss'],
})
export class InscritasPage implements OnInit {
  alumnoRef = 'demo-1';
  inscritas: any[] = [];

  constructor(private api: ApiGateway) {}

  ngOnInit() {
    this.api.asignaturasAlumno(this.alumnoRef).subscribe(data => {
      this.inscritas = data;
    });
  }
}

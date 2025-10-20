import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PagoMatriculaPage } from './pago-matricula.page';

describe('PagoMatriculaPage', () => {
  let component: PagoMatriculaPage;
  let fixture: ComponentFixture<PagoMatriculaPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(PagoMatriculaPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

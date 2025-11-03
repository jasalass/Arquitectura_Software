import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PagoMatricula } from './pago-matricula.page';

describe('PagoMatricula', () => {
  let component: PagoMatricula;
  let fixture: ComponentFixture<PagoMatricula>;

  beforeEach(() => {
    fixture = TestBed.createComponent(PagoMatricula);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

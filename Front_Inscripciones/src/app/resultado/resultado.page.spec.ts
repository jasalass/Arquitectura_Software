import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ResultadoPage } from './resultado.page';

describe('ResultadoPage', () => {
  let component: ResultadoPage;
  let fixture: ComponentFixture<ResultadoPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ResultadoPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

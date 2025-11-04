import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InscritasPage } from './inscritas.page';

describe('InscritasPage', () => {
  let component: InscritasPage;
  let fixture: ComponentFixture<InscritasPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(InscritasPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

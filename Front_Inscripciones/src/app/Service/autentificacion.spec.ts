import { TestBed } from '@angular/core/testing';

import { Autentificacion } from './autentificacion';

describe('Autentificacion', () => {
  let service: Autentificacion;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Autentificacion);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
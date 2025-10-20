import { TestBed } from '@angular/core/testing';

import { Apipago } from './apipago';

describe('Apipago', () => {
  let service: Apipago;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Apipago);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

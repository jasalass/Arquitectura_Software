import { TestBed } from '@angular/core/testing';

import { ApiGateway } from './api-gateway';

describe('ApiGateway', () => {
  let service: ApiGateway;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ApiGateway);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

import { TestBed, inject } from '@angular/core/testing';

import { UserControlService } from './user-control.service';

describe('UserControlService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [UserControlService]
    });
  });

  it('should be created', inject([UserControlService], (service: UserControlService) => {
    expect(service).toBeTruthy();
  }));
});

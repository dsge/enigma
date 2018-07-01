import { TestBed, inject } from '@angular/core/testing';

import { GameLoopService } from './game-loop.service';

describe('GameLoopService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [GameLoopService]
    });
  });

  it('should be created', inject([GameLoopService], (service: GameLoopService) => {
    expect(service).toBeTruthy();
  }));
});

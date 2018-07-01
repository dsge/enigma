import { Injectable, EventEmitter } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class GameLoopService {

  public loop = new EventEmitter<number>(false);

  constructor() { }
}

import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Vector3 } from 'three';

@Injectable({
  providedIn: 'root'
})
export class UserControlService {

  public tryingToGoForward = new BehaviorSubject<boolean>(false);
  public tryingToGoBackwards = new BehaviorSubject<boolean>(false);
  public tryingToGoLeft = new BehaviorSubject<boolean>(false);
  public tryingToGoRight = new BehaviorSubject<boolean>(false);
  public tryingToGoToCoords = new BehaviorSubject<boolean|Vector3>(false);
  public tryingToJump = new BehaviorSubject<boolean>(false);

  constructor() { }

  public handleKeyboardEvent(event: KeyboardEvent) {
    if (event.type === 'keydown') {
      return this.onKeyDown(event);
    }
    if (event.type === 'keyup') {
      return this.onKeyUp(event);
    }
  }

  protected onKeyDown(event: KeyboardEvent) {
    switch (event.which) {
      case 87: // W
        if (!this.tryingToGoForward.getValue()) {
          this.tryingToGoForward.next(true);
          if (this.tryingToGoBackwards.getValue()) {
            this.tryingToGoBackwards.next(false);
          }
        }
      break;
      case 65: // A
        if (!this.tryingToGoLeft.getValue()) {
          this.tryingToGoLeft.next(true);
          if (this.tryingToGoRight.getValue()) {
            this.tryingToGoRight.next(false);
          }
        }
      break;
      case 83: // S
        if (!this.tryingToGoBackwards.getValue()) {
          this.tryingToGoBackwards.next(true);
          if (this.tryingToGoForward.getValue()) {
            this.tryingToGoForward.next(false);
          }
        }
      break;
      case 68: // D
        if (!this.tryingToGoRight.getValue()) {
          this.tryingToGoRight.next(true);
          if (this.tryingToGoLeft.getValue()) {
            this.tryingToGoLeft.next(false);
          }
        }
      break;
      case 32: // space
        if (!this.tryingToJump.getValue()) {
          this.tryingToJump.next(true);
        }
      break;
    }
  }

  protected onKeyUp(event: KeyboardEvent) {
    switch (event.which) {
      case 87: // W
        if (this.tryingToGoForward.getValue()) {
          this.tryingToGoForward.next(false);
        }
      break;
      case 65: // A
        if (this.tryingToGoLeft.getValue()) {
          this.tryingToGoLeft.next(false);
        }
      break;
      case 83: // S
        if (this.tryingToGoBackwards.getValue()) {
          this.tryingToGoBackwards.next(false);
        }
      break;
      case 68: // D
        if (this.tryingToGoRight.getValue()) {
          this.tryingToGoRight.next(false);
        }
      break;
      case 32: // space
        if (this.tryingToJump.getValue()) {
          this.tryingToJump.next(false);
        }
      break;
    }
  }
}

import { Injectable } from '@angular/core';
import { Map } from './map';

@Injectable({
  providedIn: 'root'
})
export class MapService {

  public currentMap: Map;

  constructor() { }
}

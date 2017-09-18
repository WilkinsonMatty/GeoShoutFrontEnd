import { ShoutData } from './../../shout-data';
import { ShoutProvider } from './../shout-provider/shout-provider';

import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import 'rxjs/add/operator/map';
import { Observable, Subject, Observer } from 'rxjs';


/*
  Generated class for the ShoutControllerProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/
@Injectable()
export class ShoutControllerProvider {
  private _shoutData: ShoutData[]=[];
  private _OnShoutData: Subject<ShoutData[]> = new Subject<ShoutData[]>();
  readonly OnShoutData: Observable<ShoutData[]> = this._OnShoutData.asObservable();
  constructor(
    public http: Http,
    public shoutProvider:ShoutProvider
  ) {
    window['ShoutController']=this
  }

  createShout(shoutData:ShoutData):Observable<any>{
    return this.shoutProvider.createShout(shoutData)
    .map((data)=>{
      this._shoutData.push(shoutData); //caching
      this._OnShoutData.next(this._shoutData);
      return data;
    })    
  }

  getShoutsNear(latitude:Number, longitude: Number):Observable<ShoutData[]>{
    return this.shoutProvider.getShoutsNear(latitude,longitude)
    .map((data)=>{
      this._shoutData=data;
      this._OnShoutData.next(this._shoutData);
      return data;
    })
  }

  


}


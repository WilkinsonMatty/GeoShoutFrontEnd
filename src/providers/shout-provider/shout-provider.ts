import { Injectable } from '@angular/core';
import { Http, RequestOptionsArgs } from '@angular/http';
import 'rxjs/add/operator/map';
import { ShoutData } from '../../shout-data';
import { Observable } from 'rxjs';

/*
  Generated class for the ShoutProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/
@Injectable()
export class ShoutProvider {

  _baseAPIUrl: string = ((window.location.hostname=="localhost")?("http://localhost:3000/api"):(window.location.origin+"/api"));
  constructor(public http: Http) {
    console.log("API using base URL",this._baseAPIUrl)
  }

  setAPIUrl(s:string){
    this._baseAPIUrl=s;
  }

  createShout(shoutData:ShoutData):Observable<any>{
    let body = {
      method: "createShout",
      body:{
        shoutData
      }
    }

    return this.apiCall(body);
  }

  getShoutsNear(latitude:Number, longitude:Number):Observable<ShoutData[]>{
    let body = {
      method: "getShoutsNear",
      body:{
        location: [longitude,latitude]
      }
    }
    return this.apiCall(body);
  }

  apiCall(body:any,options?:RequestOptionsArgs){
    return this.http.post(this._baseAPIUrl,body,options).map((d)=>{
      if(!d.ok || d.json().response_status!=0){
        throw new Error("request failed");
      }
      return d.json().data
    })
  }

}

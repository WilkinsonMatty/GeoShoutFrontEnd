import { ShoutControllerProvider } from './../../providers/shout-controller/shout-controller';
import { Component, ViewChild, ElementRef } from '@angular/core';
import { IonicPage, NavController, NavParams, Spinner, Platform, AlertController } from 'ionic-angular';
import { ShoutData } from '../../shout-data';

/**
 * Generated class for the MapPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */


// to avoid VS Code syntax checking red underlines...
declare var google;



@IonicPage()
@Component({
  selector: 'page-map',
  templateUrl: 'map.html',
})
export class MapPage {

  private map:any;
  @ViewChild('map') mapElement: ElementRef;

  DEFAULT_POSITION:any = {lat:34.052235, lng: -118.243683};
  DEFAULT_ZOOM:number = 15;
  

  private markers:any[]=[];
  private shouts:any=new Object();
  private idlePoll:any;

  constructor(
    public navCtrl: NavController, 
    public navParams: NavParams,
    public platform:Platform,
    public shoutController:ShoutControllerProvider,
    public alertController:AlertController
  ) {
    this.platform.ready().then(()=>{this.onPlatformReady()})
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad MapPage');
  }

  onPlatformReady(): any {

    this.beginCreateMap();
  }

  
  // try to get the current position to set the map's initial center
  // if there's a problem, just create the map with the default position
  beginCreateMap(){

    navigator.geolocation.getCurrentPosition(
      (position)=>{
      console.log("geolocated to ",position)
      this.finishCreateMap(position);
      }
    ,
      (e)=>{
        console.log("could not geolocate", e)
        this.finishCreateMap(null);
      }
    ,
      {enableHighAccuracy: true, timeout: 5000, maximumAge: 20000}
    )
  }


  // this is the callback after getCurrentPosition()

  finishCreateMap(position:any){

    let latLng;

    if(position){
      latLng = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      }
    }
    else{
      latLng = this.DEFAULT_POSITION;
    }
    
    let mapOptions = {
      center: latLng,
      zoom: this.DEFAULT_ZOOM,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      disableDefaultUI: true
    }
    

    this.map = new google.maps.Map(this.mapElement.nativeElement, mapOptions);

    this.shoutController.OnShoutData.subscribe(this.updateShoutData.bind(this))

    this.map.addListener('click',this.mapClicked.bind(this))
    this.map.addListener('idle',this.idle.bind(this))
    this.enablePolling(1000);
  }


  enablePolling(timeout:Number){
    if(this.idlePoll){
      window.clearInterval(this.idlePoll);
    }
    this.idlePoll = window.setInterval(this.idle.bind(this),timeout);

  }

  disablePolling(){
    if(this.idlePoll){
      window.clearInterval(this.idlePoll);
    }
  }
  idle(e:any){
    this.disablePolling();
    console.log('idle event', e);
    let center= this.map.getCenter()
    console.log('map center is ', center)
    this.shoutController.getShoutsNear(center.lat(),center.lng())
    .subscribe((data:ShoutData[])=>{
      console.log("received local shouts",data);
      //this.updateShoutData(data);
      this.enablePolling(1000)
    })
    
  }
  mapClicked(e:any){
    console.log("Map clicked ",e);
    this.promptForText('Enter text to shout',(data)=>{
      console.log("prompt OKed with data",data)
      this.shoutController.createShout({
        message: data.textInput,
        location: [e.latLng.lng(),e.latLng.lat()],
        _id:null,
        marker:null
      }).subscribe((e)=>{
        console.log("click returned with ",e)
        
      })
  
    })
  }

  promptForText(title:string,handler:any){
    let prompt = this.alertController.create({
      title,
      inputs:[
        {
          name: 'textInput',
          placeholder: 'Enter text'
        }
      ],
      buttons:[
        {
          text: "Cancel",
          role: "cancel"
        }
        ,       
        {
          text: "OK",
          handler
        }
        ,

      ]
    })

    prompt.present();
  }
  updateShoutData(shoutData:ShoutData[]){

    console.log("shoutData",shoutData)
    //don't need to recreate markers that we already have cached
    
    let indexedShoutData = {};
    shoutData.forEach((m)=>{
      indexedShoutData[m._id]=m;//prepare for expired shout cleanup phase by indexing the new shoutData by _id in a dictionary
    })

    //cleanup phase -- delete visible shouts that have expired or otherwise didn't appear in the updated shoutData
    for(let n in this.shouts){
      let m = this.shouts[n];
      if(!indexedShoutData[m._id]){
        console.log("deleting expired shout ",m)
        m.marker.setMap(null);
        delete this.shouts[n]
      }
    }


    //this.clearAllMarkers();
    shoutData.forEach((m)=>{
      
      if(m._id==null || this.shouts[m._id]==undefined){ //we don't already have this shout. create a corresponding marker
        console.log("adding new shout ",m)
        
        m.marker=this.addMarker(m.location[1],m.location[0],m.message);

        if(m._id==null){ //the _id is null on locally echoed shouts. However, we want these to be replaced by server side shouts (which have Ids)
          m._id='local'+Math.random().toString()+""+(new Date()).getTime();
        }
        this.shouts[m._id]=m; 
      }
      //else{
      //  we already have this shout. Don't need to do anything
      //}
      
    })



    
  }

  addMarker(latitude:Number,longitude:Number,message:string){
    let newMarker = new google.maps.Marker({
      position: {
        lat: latitude, 
        lng:longitude,
      },
      title: message,
      map:this.map
    })

    let infoWindow = new google.maps.InfoWindow({
      content: message,
      disableAutoPan: true
    })
    infoWindow.setZIndex(0);
    newMarker.addListener('mouseover',()=>{
      console.log("mouse over",infoWindow.content)
      infoWindow.setZIndex(100);
    })

    newMarker.addListener('mouseout',()=>{
      console.log("mouse out",infoWindow.content);
      infoWindow.setZIndex(0);
    })

    infoWindow.open(this.map,newMarker);
    newMarker['infoWindow']=infoWindow;

    this.markers.push(newMarker);
    return newMarker;
  }

  clearAllMarkers(){
    this.markers.forEach((m)=>{
      m.infoWindow.close();
      m.setMap(null);
    })
  }
}

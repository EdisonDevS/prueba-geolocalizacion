import { BackgroundMode } from '@ionic-native/background-mode/ngx';
import { AudioService } from './../services/audio.service';
import { Component, NgZone } from '@angular/core';
import { Capacitor, Plugins } from "@capacitor/core";
import { GeolocalizacionService } from '../services/geolocalizacion.service';
const { Geolocation, Toast } = Plugins;

//import { Geolocation } from '@ionic-native/geolocation/ngx';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {

  lat: any;
  lng: any;
  watchId: any;

  constructor(
    public ngZone: NgZone,
    private locationService:GeolocalizacionService,
    private audio: AudioService,
    private backgroundMode: BackgroundMode) {}
/*
  enviarAlarma() {
    this.geolocation.getCurrentPosition().then((resp) => {
      this.lat = resp.coords.latitude
      this.long = resp.coords.longitude
     }).catch((error) => {
       console.log('Error getting location', error);
     });

  }
  */

  ngOnInit() {
    //Called after the constructor, initializing input properties, and the first call to ngOnChanges.
    //Add 'implements OnInit' to the class.
    this.audio.preloadAudio('alerta', 'assets/audio/alerta.mp3');

    this.permisos()

  }

  async permisos(){
    const hasPermission = await this.locationService.checkAudioPermission();

    if (!hasPermission) {
      const permission = await this.locationService.requestAudioPermission();
    }

    this.backgroundMode.on("activate").subscribe(()=>{
      setInterval(()=>{
        this.audio.play('alerta');
      },
      10000)
    });

    this.backgroundMode.enable();

  }

  async getMyLocation() {
    const hasPermission = await this.locationService.checkGPSPermission();
    if (hasPermission) {
      if (Capacitor.isNative) {
        const canUseGPS = await this.locationService.askToTurnOnGPS();
        this.postGPSPermission(canUseGPS);
      }
      else { this.postGPSPermission(true); }
    }
    else {
      const permission = await this.locationService.requestGPSPermission();
      if (permission === 'CAN_REQUEST' || permission === 'GOT_PERMISSION') {
        if (Capacitor.isNative) {
          const canUseGPS = await this.locationService.askToTurnOnGPS();
          this.postGPSPermission(canUseGPS);
        }
        else { this.postGPSPermission(true); }
      }
      else {
        await Toast.show({
          text: 'User denied location permission'
        })
      }
    }
  }

  async postGPSPermission(canUseGPS: boolean) {
    if (canUseGPS) { this.watchPosition(); }
    else {
      await Toast.show({
        text: 'Please turn on GPS to get location'
      })
    }
  }

  async watchPosition() {
    try {
      this.watchId = Geolocation.watchPosition({}, (position, err) => {
        this.ngZone.run(() => {
          if (err) { console.log('err', err); return; }
          this.lat = position.coords.latitude;
          this.lng = position.coords.longitude
          this.clearWatch();
        })
      })
    }
    catch (err) { console.log('err', err) }
  }

  clearWatch() {
    if (this.watchId != null) {
      Geolocation.clearWatch({ id: this.watchId });
    }
  }
}

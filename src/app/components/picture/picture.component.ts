import { Component, OnInit, NgZone } from '@angular/core';
import { NavParams, ModalController } from '@ionic/angular';
import { ProfileService } from 'src/app/services/profile.service';
import { ThemeService } from 'src/app/services/theme.service';
import { HiveService } from 'src/app/services/hive.service';

@Component({
  selector: 'app-picture',
  templateUrl: './picture.component.html',
  styleUrls: ['./picture.component.scss'],
})
export class PictureComponent implements OnInit {

  public rawImage: string = null;
  public savingImg = false;

  constructor(
    private navParams: NavParams,
    private modalCtrl: ModalController,
    private zone: NgZone,
    public profileService: ProfileService,
    public theme: ThemeService,
    public hiveService: HiveService
  ) {
  }

  ngOnInit() {}

  ionViewDidEnter() {
    if(this.hiveService.ipfsObj === null){
      this.hiveService.getIpfsObject().then((ipfs: HivePlugin.IPFS) => {
        this.hiveService.ipfsObj = ipfs;
      }).catch((err) => {
        alert(err);
      });
    }
  }

  takePicture() {
    const options = {
      quality: 100,
      destinationType: 0,
      encodingType: 0,
      mediaType:0
    };

    navigator.camera.getPicture((imageData) => {
      this.zone.run(() => {
        this.rawImage = 'data:image/png;base64,' + imageData;
      });
    }, ((err) => {
      console.error(err);
    }), options);
  }

  photoLibrary() {
  }

  submit(useImg: boolean):void {
    this.savingImg = true;
    this.hiveService.ipfsPut(this.hiveService.ipfsObj, this.rawImage).then((result) => {
      if(result["status"] === "success") {
        this.hiveService.imageCid = result["cid"];
        console.log('ipfsPut', result);
        console.log('Image cid', this.hiveService.imageCid);
        localStorage.setItem(this.hiveService.skey, JSON.stringify(result["cid"]));
        this.savingImg = false;
        this.rawImage = "";
        this.modalCtrl.dismiss({
          useImg: useImg
        });
      }
    }).catch((err) => {
      this.savingImg = false;
      alert(err);
    });
  }

  cancel() {
    this.rawImage = null;
  }
}

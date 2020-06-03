import { Component } from '@angular/core';
import { NavController } from '@ionic/angular';

declare let titleBarManager: TitleBarPlugin.TitleBarManager;

@Component({
  selector: 'page-about',
  templateUrl: 'about.html',
  styleUrls: ['./about.scss']
})
export class AboutPage {

  constructor(public navCtrl: NavController) {

  }

  ionViewDidEnter() {
    // Update system status bar every time we re-enter this screen.
    titleBarManager.setTitle("About");
    titleBarManager.setBackgroundColor("#000000");
    titleBarManager.setForegroundMode(TitleBarPlugin.TitleBarForegroundMode.LIGHT);
  }
}

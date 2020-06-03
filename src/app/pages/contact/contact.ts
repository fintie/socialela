import { Component } from '@angular/core';
import { NavController } from '@ionic/angular';

declare let titleBarManager: TitleBarPlugin.TitleBarManager;

@Component({
  selector: 'page-contact',
  templateUrl: 'contact.html',
  styleUrls: ['./contact.scss']
})
export class ContactPage {

  constructor(public navCtrl: NavController) {

  }

  ionViewDidEnter() {
    // Update system status bar every time we re-enter this screen.
    titleBarManager.setTitle("Contact");
    titleBarManager.setBackgroundColor("#000000");
    titleBarManager.setForegroundMode(TitleBarPlugin.TitleBarForegroundMode.LIGHT);
  }
}

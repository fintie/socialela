// import { ItemsProvider } from '../../providers/items/items';
import { Component } from '@angular/core';
import { NavController } from '@ionic/angular';
import { IonicPage, NavParams } from 'ionic-angular';

declare let titleBarManager: TitleBarPlugin.TitleBarManager;

@Component({
  selector: 'page-profile',
  templateUrl: 'profile.html',
  styleUrls: ['profile.scss']
})
export class ProfilePage {
  products = [];
  // constructor(public navCtrl: NavController, public itemsProvider: ItemsProvider) {
  //   this.getCartData();
  // }

  // getCartData(){
  //   this.products = this.itemsProvider.getCart();
  // }

  ionViewDidEnter() {
    // Update system status bar every time we re-enter this screen.
    titleBarManager.setTitle("Profile");
    titleBarManager.setBackgroundColor("#000000");
    titleBarManager.setForegroundMode(TitleBarPlugin.TitleBarForegroundMode.LIGHT);
  }
}

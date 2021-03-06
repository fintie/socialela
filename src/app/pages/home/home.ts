
import { DatabaseAccessProvider } from '../../providers/database-access/database-access';
import { ItemPage } from '../item/item';
import { ItemsProvider } from '../../providers/items/items';
import { Component } from '@angular/core';
import { NavController } from '@ionic/angular';
import { IonicPage, NavParams } from 'ionic-angular';

declare let appManager: AppManagerPlugin.AppManager;
declare let titleBarManager: TitleBarPlugin.TitleBarManager;

@Component({
  selector: 'page-home',
  templateUrl: 'home.html',
  styleUrls: ['./home.scss']
})
export class HomePage {
  products = [];
  constructor(public navCtrl: NavController, public itemsProvider:ItemsProvider) {
    this.products = itemsProvider.getCourses();
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad ItemsPage');
  }

  // viewItemDetails(product){
  //     	this.navCtrl.push(ItemPage,{
  // 		product : product
  // 	})
  // }

  ionViewDidEnter() {
    // When the main screen is ready to be displayed, ask the app manager to make the app visible,
    // in case it was started hidden while loading.
    console.log('ionViewDidEnter ItemsPage');
    appManager.setVisible("show");

    // Update system status bar every time we re-enter this screen.
    titleBarManager.setTitle("Home");
    titleBarManager.setBackgroundColor("#000000");
    titleBarManager.setForegroundMode(TitleBarPlugin.TitleBarForegroundMode.LIGHT);
  }
}
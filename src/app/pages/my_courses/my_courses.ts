import { Component } from '@angular/core';
import { NavController } from '@ionic/angular';

declare let titleBarManager: TitleBarPlugin.TitleBarManager;

@Component({
  selector: 'page-my_courses',
  templateUrl: 'my_courses.html',
  styleUrls: ['./my_courses.scss']
})
export class MyCoursesPage {

  constructor(public navCtrl: NavController) {

  }

  ionViewDidEnter() {
    // Update system status bar every time we re-enter this screen.
    titleBarManager.setTitle("My Courses");
    titleBarManager.setBackgroundColor("#000000");
    titleBarManager.setForegroundMode(TitleBarPlugin.TitleBarForegroundMode.LIGHT);
  }
}

import { NgModule, ErrorHandler } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { RouteReuseStrategy } from '@angular/router';
import { IonicModule, IonicRouteStrategy, Platform } from '@ionic/angular';
import { AppRoutingModule } from './app-routing.module';

import { MyApp } from './app.component';

import { MyCoursesPage } from './pages/my_courses/my_courses';
import { ProfilePage } from './pages/profile/profile';
import { HomePage } from './pages/home/home';
import { TabsPage } from './pages/tabs/tabs';

import { StatusBar } from '@ionic-native/status-bar/ngx';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';

import { ItemsProvider } from './providers/items/items';
// import { DatabaseAccessProvider } from './providers/database-access/database-access';
import { SecondaryCoursePage } from "./pages/secondary-course/secondary-course";
import { PrimaryCoursePage } from "./pages/primary-course/primary-course";
import { ItemPage } from './pages/item/item';

@NgModule({
  declarations: [
    MyApp,
    MyCoursesPage,
    HomePage,
    // ItemPage,
    // SecondaryCoursePage,
    // PrimaryCoursePage,
    ProfilePage,
    TabsPage
  ],
  imports: [
    CommonModule,
    BrowserModule,
    AppRoutingModule,
    IonicModule.forRoot()
  ],
  bootstrap: [MyApp],
  entryComponents: [
    MyApp,
    MyCoursesPage,
    HomePage,
    // ItemPage,
    // SecondaryCoursePage,
    // PrimaryCoursePage,
    ProfilePage,
    TabsPage
  ],
  providers: [
    StatusBar,
    SplashScreen,
    Platform,
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    {provide: ErrorHandler, useClass: ErrorHandler},
    ItemsProvider
    // DatabaseAccessProvider
  ]
})
export class AppModule {}

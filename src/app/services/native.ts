
import { Injectable, NgZone } from '@angular/core';
import { ToastController, LoadingController, NavController } from '@ionic/angular';
import { Router } from '@angular/router';
import { Clipboard } from '@ionic-native/clipboard/ngx';
import { TranslateService } from '@ngx-translate/core';

import * as _ from 'lodash';


@Injectable({
    providedIn: 'root'
})
export class Native {
  private mnemonicLang: DIDPlugin.MnemonicLanguage = DIDPlugin.MnemonicLanguage.ENGLISH;
  private loadingIsOpen: boolean = false;

  constructor(private toastCtrl: ToastController,
      private clipboard: Clipboard,
      private translate: TranslateService,
      private loadingCtrl: LoadingController,
      private navCtrl: NavController,
      private zone: NgZone,
      private router: Router) {
  }

  public log(message: any, type: string): void {
    // if (Config.isDebug) {
      let msg = type +  ": " + (_.isString(message) ? message : JSON.stringify(message));
      console.log(msg);
    // }
  }

  public info(message) {
      this.log(message, "Info");
  }

  public error(message) {
      this.log(message, "Error");
  }

  public warnning(message) {
      this.log(message, "Warnning");
  }

  public toast(_message: string = '操作完成', duration: number = 2000): void {
      this.toastCtrl.create({
          message: _message,
          duration: duration,
          position: 'top'
      }).then(toast => toast.present());
  }

  public toast_trans(_message: string = '', duration: number = 2000): void {
      _message = this.translate.instant(_message);
      this.toastCtrl.create({
          message: _message,
          duration: duration,
          position: 'middle'
      }).then(toast => toast.present());
  }

  copyClipboard(text) {
      return this.clipboard.copy(text);
  }

  // Sensitive data should not be passed through queryParams
  public go(page: any, options: any = {}) {
    console.log("NAV - Going to "+page);
    this.zone.run(()=>{
        this.hideLoading();
        this.navCtrl.navigateForward([page], { state: options });
    });
  }

  public pop() {
      this.navCtrl.pop();
  }

  public setRootRouter(page: any,  options: any = {}) {
    console.log("NAV - Setting root to "+page);
      this.zone.run(()=>{
        this.hideLoading();
        this.navCtrl.navigateRoot([page], { state: options });
      });
  }

  public getMnemonicLang(): DIDPlugin.MnemonicLanguage {
      return this.mnemonicLang;
  }

  public setMnemonicLang(lang: DIDPlugin.MnemonicLanguage) {
      this.mnemonicLang = lang;
  }

  public clone(Obj) {
      if (typeof (Obj) != 'object') return Obj;
      if (Obj == null) return Obj;

      let newObj;

      if (Obj instanceof (Array)) {
          newObj = new Array();
      } else {
          newObj = new Object();
      }

      for (let i in Obj)
          newObj[i] = this.clone(Obj[i]);

      return newObj;
  }

  public async showLoading(content: string = '') {
      if (!this.loadingIsOpen) {
          this.loadingIsOpen = true;
          content = this.translate.instant(content);
          let loading = await this.loadingCtrl.create({
              message: content,
              duration: 10000//10s
          });
          return await loading.present();
      }
  };

  public hideLoading(): void {
      this.loadingIsOpen && this.loadingCtrl.dismiss();
      this.loadingIsOpen = false;
  };

  public getTimestamp() {
      return new Date().getTime().toString();
  }
}



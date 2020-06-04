import { Injectable, NgZone } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Platform, ModalController, NavController } from '@ionic/angular';
import { Native } from './native';

import { Config } from './config';
import { Util } from './util';
import { BrowserSimulation } from './browsersimulation';
import { AuthService } from './auth.service';
import { DIDService } from './did.service';
import { PopupProvider } from './popup';
import { Router } from '@angular/router';
import { NewDID } from '../model/newdid.model';
import { ThemeService } from './theme.service';

declare let appManager: AppManagerPlugin.AppManager;
declare let titleBarManager: TitleBarPlugin.TitleBarManager;

let selfUxService: UXService = null;

enum MessageType {
    INTERNAL = 1,
    IN_RETURN = 2,
    IN_REFRESH = 3,

    EXTERNAL = 11,
    EX_LAUNCHER = 12,
    EX_INSTALL = 13,
    EX_RETURN = 14,
};

@Injectable({
    providedIn: 'root'
})
export class UXService {
    public static instance: UXService = null;
    private isReceiveIntentReady = false;
    private appIsLaunchingFromIntent = false; // Is the app starting because of an intent request?

    constructor(
        public translate: TranslateService,
        private platform: Platform,
        private zone: NgZone,
        private native: Native,
        private popup: PopupProvider,
        private didService: DIDService,
        private authService: AuthService,
        private modalCtrl: ModalController,
        private navCtrl: NavController,
        private router: Router,
        private theme: ThemeService
    ) {
        selfUxService = this;
        UXService.instance = this;
    }

    async init() {
        console.log("UXService init");
        this.theme.getTheme();

        if (!BrowserSimulation.runningInBrowser()) {
            this.getLanguage();

            this.computeAndShowEntryScreen();

            appManager.setListener(this.onReceive);
            this.setIntentListener();

            titleBarManager.addOnItemClickedListener((menuIcon)=>{
                if (menuIcon.key == "back") {
                    this.navCtrl.back();
                }
            });
        }
        else {
            // Simulated settings
            this.setCurLang("fr");

            this.showEntryScreen();
        }
    }

    setTitleBarBackKeyShown(show: boolean) {
        if (show) {
            titleBarManager.setIcon(TitleBarPlugin.TitleBarIconSlot.INNER_LEFT, {
                key: "back",
                iconPath: TitleBarPlugin.BuiltInIcon.BACK
            });
        }
        else {
            titleBarManager.setIcon(TitleBarPlugin.TitleBarIconSlot.INNER_LEFT, null);
        }
    }

    /**
     * This method defines which screen has to be displayed when the app start. This can be the default
     * no identity or current identity main screen, (defined by the didstoremanager), but the app is maybe
     * starting because we are receiving an intent.
     *
     * This method must be called only during the initial app start.
     */
    computeAndShowEntryScreen() {
        console.log("Checking if there are pending intents");
        appManager.hasPendingIntent(async (hasPendingIntent: boolean)=>{
            if (hasPendingIntent) {
                // Do nothing, the intent listener will show the appropriate screen.
                console.log("There are some pending intents.");
            }
            else {
                console.log("No pending intent.");

                this.loadIdentityAndShow();
            }
        }, async (err: string)=>{
            // Error while checking - fallback to default behaviour
            console.error(err);

            this.loadIdentityAndShow();
        });
    }

    private async loadIdentityAndShow(showEntryScreenAfterLoading = true) {
        // Load user's identity
        let couldLoad = await this.didService.loadGlobalIdentity();
        if (!couldLoad) {
            this.didService.handleNull();
        }
        else {
            if (showEntryScreenAfterLoading) {
                // No intent was received at boot. So we go through the regular screens.
                this.showEntryScreen();
            }
        }
    }

    showEntryScreen() {
        this.didService.displayDefaultScreen();
    }

    /**
     * Close this application.
     */
    close() {
        if (!BrowserSimulation.runningInBrowser()) {
            console.log("Closing DID app");
            appManager.close();
        }
    }

    /**
     * As the app starts invisible, screens have to call this method when they are ready, so that
     * user can actually see the app (but see it only when fully ready)
     */
    makeAppVisible() {
        appManager.setVisible("show");
    }

    getLanguage() {
        appManager.getLocale(
            (defaultLang, currentLang, systemLang) => {
                selfUxService.setCurLang(currentLang);
            }
        );
    }

    setCurLang(lang: string) {
        console.log("Setting current language to "+lang);

        this.zone.run(()=>{
            // Setting UI/translations language
            this.translate.use(lang);
        });
    }

    public translateInstant(key: string): string {
        return this.translate.instant(key);
    }

    setIntentListener() {
        if (!BrowserSimulation.runningInBrowser()) {
            console.log("Setting intent listener");
            if (!this.isReceiveIntentReady) {
                this.isReceiveIntentReady = true;
                appManager.setIntentListener((intent: any)=>{
                    this.onReceiveIntent(intent);
                });
            }
        }
    }

    onReceive = (ret) => {
        console.log('onReceive', ret);
        var params: any = ret.message;
        if (typeof (params) == "string") {
            try {
                params = JSON.parse(params);
            } catch (e) {
                console.log('Params are not JSON format: ', params);
            }
        }
        switch (ret.type) {
            case MessageType.IN_REFRESH:
              if (params.action === "currentLocaleChanged") {
                this.setCurLang(params.data);
              }
              if(params.action === 'preferenceChanged' && params.data.key === "ui.darkmode") {
                this.zone.run(() => {
                  console.log('Dark Mode toggled');
                  this.theme.setTheme(params.data.value);
                });
              }
              break;
            case MessageType.EX_INSTALL:
                break;
            case MessageType.INTERNAL:
                switch (ret.message) {
                    case 'navback':
                        this.titlebarBackButtonHandle();
                        break;
                }
                break;
        }
    }

    async titlebarBackButtonHandle() {
        // to check alert, action, popover, menu ?
        // ...
        const modal = await this.modalCtrl.getTop();
        if (modal) {
            modal.dismiss();
            return;
        }

        this.navCtrl.back();
    }

    async onReceiveIntent(intent: AppManagerPlugin.ReceivedIntent) {
        console.log("Intent received", intent);

        switch (intent.action) {
            case "credaccess":
                console.log("Received credential access intent request");
                if (selfUxService.checkCredAccessIntentParams(intent)) {
                    this.appIsLaunchingFromIntent = true;
                    await this.loadIdentityAndShow(false);
                    this.native.go("/credaccessrequest");
                }
                else {
                    // Something wrong happened while trying to handle the intent: send intent response with error
                    this.showErrorAndExitFromIntent(intent);
                }
                break;
            case "credimport":
                console.log("Received credential import intent request");
                if (selfUxService.checkCredImportIntentParams(intent)) {
                    this.appIsLaunchingFromIntent = true;
                    await this.loadIdentityAndShow(false);
                    this.native.go("/credimportrequest");
                }
                else {
                    // Something wrong happened while trying to handle the intent: send intent response with error
                    this.showErrorAndExitFromIntent(intent);
                }
                break;
            case "credissue":
                console.log("Received credential issue intent request");
                if (selfUxService.checkCredIssueIntentParams(intent)) {
                    this.appIsLaunchingFromIntent = true;
                    await this.loadIdentityAndShow(false);
                    this.native.go("/credissuerequest");
                }
                else {
                    // Something wrong happened while trying to handle the intent: send intent response with error
                    this.showErrorAndExitFromIntent(intent);
                }
                break;
            case "registerapplicationprofile":
                console.log("Received register application profile intent request");
                if (selfUxService.checkRegAppProfileIntentParams(intent)) {
                    this.appIsLaunchingFromIntent = true;
                    await this.loadIdentityAndShow(false);
                    this.native.go("/regappprofilerequest");
                }
                else {
                    console.error("Missing or wrong intent parameters for "+intent.action);

                    // Something wrong happened while trying to handle the intent: send intent response with error
                    this.showErrorAndExitFromIntent(intent);
                }
                break;
            case "sign":
                console.log("Received sign intent request");
                if (selfUxService.checkSignIntentParams(intent)) {
                    this.appIsLaunchingFromIntent = true;
                    await this.loadIdentityAndShow(false);
                    this.native.go("/signrequest");
                }
                else {
                    console.error("Missing or wrong intent parameters for "+intent.action);

                    // Something wrong happened while trying to handle the intent: send intent response with error
                    this.showErrorAndExitFromIntent(intent);
                }
                break;
        }
    }

    public sendIntentResponse(action, result, intentId): Promise<void> {
      return new Promise((resolve, reject)=>{
        if (!BrowserSimulation.runningInBrowser()) {
          appManager.sendIntentResponse(action, result, intentId,
            (response)=> {
              resolve();
            },
            (err) => {
              console.error('sendIntentResponse failed: ', err);
              reject(err);
            }
          );
        } else {
          console.warn("Not sending intent response, we are in browser");
          resolve();
        }
      });
    }

    async showErrorAndExitFromIntent(intent: AppManagerPlugin.ReceivedIntent) {
        let errorMessage = "Sorry, there are invalid parameters in the request";
        errorMessage += "\n\n"+JSON.stringify(intent.params);

        await this.popup.ionicAlert("Action error", errorMessage, "Close");

        console.error(errorMessage);

        await this.sendIntentResponse(intent.action, {}, intent.intentId);
        this.close();
    }

    checkCredAccessIntentParams(intent) {
        console.log("Checking credaccess intent parameters");
        if (Util.isEmptyObject(intent.params)) {
            console.error("Invalid credaccess parameters received. No params.", intent.params);
            return false;
        }

        Config.requestDapp = {
            appPackageId: intent.from,
            intentId: intent.intentId,
            action: intent.action,
            requestProfile: intent.params.claims || [], // We are allowed to request no claim except the DID itself
            originalJwtRequest: intent.originalJwtRequest
        }
        return true;
    }

    checkCredIssueIntentParams(intent) {
        console.log("Checking credissue intent parameters");
        if (Util.isEmptyObject(intent.params)) {
            console.error("Invalid credissue parameters received. Empty parameters.", intent.params);
            return false;
        }

        if (Util.isEmptyObject(intent.params.identifier)) {
            console.error("Invalid credissue parameters received. Empty identifier.", intent.params);
            return false;
        }

        if (Util.isEmptyObject(intent.params.properties)) {
            console.error("Invalid credissue parameters received. Empty properties.", intent.properties);
            return false;
        }

        if (Util.isEmptyObject(intent.params.subjectdid)) {
            console.error("Invalid credissue parameters received. Empty subject DID.", intent.params);
            return false;
        }

        if (Util.isEmptyObject(intent.params.types) || intent.params.types.length == 0) {
            console.error("Invalid credissue parameters received. Empty types. You must provide at least one type for the credential.", intent.params);
            return false;
        }

        Config.requestDapp = {
            appPackageId: intent.from,
            intentId: intent.intentId,
            action: intent.action,
            identifier: intent.params.identifier,
            types: intent.params.types,
            subjectDID: intent.params.subjectdid,
            properties: intent.params.properties,
            expirationDate: intent.params.expirationdate,
            originalJwtRequest: intent.originalJwtRequest
        }
        return true;
    }

    checkCredImportIntentParams(intent) {
        console.log("Checking credimport intent parameters");
        if (Util.isEmptyObject(intent.params) || Util.isEmptyObject(intent.params.credentials)) {
            console.error("Invalid credimport parameters received. No params or empty credentials list.", intent.params);
            return false;
        }

        console.log("DEBUG INTENT PARAMS: "+JSON.stringify(intent.params));

        Config.requestDapp = {
            appPackageId: intent.from,
            intentId: intent.intentId,
            action: intent.action,
            credentials: intent.params.credentials,
            originalJwtRequest: intent.originalJwtRequest
        }
        return true;
    }

    /**
     * Checks generic parameters in the received intent, and fills our requesting DApp object info
     * with intent info for later use.
     */
    checkGenericIntentParams(intent, allowEmptyParams: boolean = false): boolean {
        console.log("Checking generic intent parameters");

        if (!allowEmptyParams && Util.isEmptyObject(intent.params)) {
            console.error("Intent parameters are empty");
            return false;
        }

        Config.requestDapp = {
            appPackageId: intent.from,
            intentId: intent.intentId,
            action: intent.action,
            allParams: intent.params,
            originalJwtRequest: intent.originalJwtRequest
        }

        return true;
    }

    checkRegAppProfileIntentParams(intent: AppManagerPlugin.ReceivedIntent): boolean {
        console.log("Checking intent parameters");

        if (!this.checkGenericIntentParams(intent))
            return false;

        // Check and get specific parameters for this intent
        if (!intent.params.identifier) {
            console.error("Missing profile 'identifier'.");
            return false;
        }

        if (!intent.params.connectactiontitle) {
            console.error("Missing profile 'connectactiontitle'.");
            return false;
        }

        // Config.requestDapp was already initialized earlier.
        Config.requestDapp.identifier = intent.params.identifier;
        Config.requestDapp.connectactiontitle = intent.params.connectactiontitle;
        Config.requestDapp.customcredentialtypes = intent.params.customcredentialtypes;
        Config.requestDapp.allParams = intent.params;

        return true;
    }

    checkSignIntentParams(intent: AppManagerPlugin.ReceivedIntent): boolean {
        console.log("Checking intent parameters");

        if (!this.checkGenericIntentParams(intent))
            return false;

        // Check and get specific parameters for this intent
        if (!intent.params.data) {
            console.error("Missing 'data'.");
            return false;
        }

        // Config.requestDapp was already initialized earlier.
        Config.requestDapp.allParams = intent.params;

        return true;
    }

    checkCreateDIDIntentParams(intent: AppManagerPlugin.ReceivedIntent): boolean {
        console.log("Checking intent parameters");

        if (!this.checkGenericIntentParams(intent))
            return false;

        // Nothing specific to do yet

        return true;
    }

    checkImportMnemonicIntentParams(intent: AppManagerPlugin.ReceivedIntent): boolean {
        console.log("Checking intent parameters");

        if (!this.checkGenericIntentParams(intent, true))
            return false;

        // Nothing specific to do yet

        return true;
    }

    checkDeleteDIDIntentParams(intent: AppManagerPlugin.ReceivedIntent): boolean {
        console.log("Checking intent parameters");

        if (!this.checkGenericIntentParams(intent, true))
            return false;

        // Nothing specific to do yet

        return true;
    }
}

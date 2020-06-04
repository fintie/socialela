import { Injectable, NgZone } from '@angular/core';
import { Platform, ToastController, Events } from '@ionic/angular';

import { BrowserSimulation } from '../services/browsersimulation';
import { TranslateService } from '@ngx-translate/core';
import { LocalStorage } from './localstorage';
import { PopupProvider } from './popup';
import { Native } from './native';
import { DIDStore } from '../model/didstore.model';
import { DID } from '../model/did.model';
import { ApiNoAuthorityException } from '../model/exceptions/apinoauthorityexception.exception';

declare let didManager: DIDPlugin.DIDManager;
declare let appManager: AppManagerPlugin.AppManager;
declare let didSessionManager: DIDSessionManagerPlugin.DIDSessionManager;

@Injectable({
    providedIn: 'root'
})
export class DIDService {
    public static instance: DIDService = null;

    public activeDidStore: DIDStore;

    constructor(
        private platform: Platform,
        public zone: NgZone,
        private translate: TranslateService,
        public toastCtrl: ToastController,
        public events: Events,
        public localStorage: LocalStorage,
        private popupProvider: PopupProvider,
        public native: Native) {
            console.log("DIDService created");
            DIDService.instance = this;
    }

    handleNull() {
      this.native.setRootRouter('/notsignedin');
    }

    public async displayDefaultScreen() {
      this.native.setRootRouter('/myprofile');
    }

    /**
     * Loads the global system identity.
     */
    public async loadGlobalIdentity() : Promise<boolean> {
      let signedInIdentity = await didSessionManager.getSignedInIdentity();
      if (!signedInIdentity) {
        this.native.setRootRouter('/notsignedin');
        return false;
      }
      else {
        // Activate the DID store, and the DID
        let couldActivate = await this.activateDid(signedInIdentity.didStoreId, signedInIdentity.didString);
        if (!couldActivate) {
          this.handleNull();
          return false 
        }
      }

      return true;
    }

    public activateDidStore(storeId: string): Promise<boolean> {
      return new Promise(async (resolve, reject)=>{
          if (storeId == null) {
              console.error("Impossible to activate a null store id!");
              resolve(false);
              return;
          }

          if (storeId == this.getCurDidStoreId()) {
              console.log("DID Store ID hasn't changed - not loading the DID Store");
              resolve(true); // Nothing changed but considered as successful.
              return;
          }

          let didStore = await DIDStore.loadFromDidStoreId(storeId, this.events);
          if (!didStore) {
            this.popupProvider.ionicAlert("Store load error", "Sorry, we were unable to load your DID store...");
            resolve(false);
            return;
          }

          console.log("Setting active DID store", didStore);
          this.activeDidStore = didStore;

          this.events.publish('did:didchanged');

          resolve(true);
      });
    }

    /**
     * Make the given DID store becoming the active one for all further operations.
     * Redirects to the right screen after activation, if a switch is required.
     */
    public activateDid(storeId: string, didString: string): Promise<boolean> {
      console.log("Activating DID using DID store ID "+storeId+" and DID "+didString);

      return new Promise(async (resolve, reject)=>{
          if (didString == null) {
              console.error("Impossible to activate a null did string!");
              resolve(false);
              return;
          }
 
          let couldActivateStore = await this.activateDidStore(storeId);
          if (!couldActivateStore) {
              resolve(false);
              return;
          }

          try {
              let did = this.getActiveDidStore().findDidByString(didString);
              if (!did) { // Just in case, should not happen but for robustness...
                  console.error("No DID found! Failed to activate DID");
                  resolve(false);
                  return;
              }
              await this.getActiveDidStore().setActiveDid(did);

              this.events.publish('did:didchanged');

              resolve(true);
        }
        catch (e) {
          // Failed to load this full DID content
          console.error(e);
          resolve(false);
        }
      });
    }

    public async showDid(storeId:string, didString: string) {
      console.log("Showing DID Store "+storeId+" with DID "+didString);
      let couldEnableStore = await this.activateDid(storeId, didString);
      if (!couldEnableStore) {
        console.error("Unable to load the previously selected DID store");
        this.handleNull(); // TODO: go to DID list instead
      }
      else {
          if (this.getActiveDid() !== null)
           this.native.setRootRouter('/myprofile');
           // this.native.setRootRouter('/noidentity');
          else {
              // Oops, no active DID...
              console.warn("No active DID in this store!");
              throw Error("No active DID in this store!");
          }
      }
    }

    public async newDidStore() {
      let didStore = new DIDStore(this.events);
      try {
        await didStore.initNewDidStore();
      }
      catch(e) {
        if (e instanceof ApiNoAuthorityException) {
          await this.popupProvider.ionicAlert("Init Store error", 'Sorry, this application can not run without the "Create a DID Store" feature');
          appManager.close();
        }
      }
      return didStore;
    }

    public getCurDidStoreId() {
      if (!this.activeDidStore)
        return null;

      return this.activeDidStore.pluginDidStore.getId();
    }

    public getActiveDidStore() : DIDStore {
      return this.activeDidStore;
    }

    public getActiveDid(): DID {
      return this.activeDidStore.getActiveDid();
    }

    async deleteDid(did: DID) {
      let storeId = this.getActiveDidStore().getId();
      await this.getActiveDidStore().deleteDid(did);

      // TODO: sign out - back to did sessions app
    }

    generateMnemonic(language): Promise<any> {
        return new Promise((resolve, reject)=>{
            if (!BrowserSimulation.runningInBrowser()) {
                didManager.generateMnemonic(
                    language,
                    (ret) => {resolve(ret)}, (err) => {reject(err)},
                );
            }
            else {
                resolve("abandon ability able about above absent absorb abstract bike bind bird blue");
            }
        });
    }

    isMnemonicValid(language, mnemonic): Promise<any> {
        return new Promise((resolve, reject)=>{
            didManager.isMnemonicValid(
                language, mnemonic,
                (ret) => {resolve(ret)}, (err) => {reject(err)},
            );
        });
    }

    //Credential
    credentialToJSON(credential: DIDPlugin.VerifiableCredential): Promise<string> {
        if (BrowserSimulation.runningInBrowser()) {//for test
            return new Promise((resolve, reject)=>{
                let ret = "{\"id\":\"did:elastos:ikoWcH4HJYGsHFzYH3VEVL7iMeL6NGm8VF#test\",\"type\":[\"SelfProclaimedCredential\"],\"issuanceDate\":\"2019-11-11T08:00:00Z\",\"expirationDate\":\"2034-11-11T08:00:00Z\",\"credentialSubject\":{\"id\":\"did:elastos:ikoWcH4HJYGsHFzYH3VEVL7iMeL6NGm8VF\",\"remark\":\"ttttttttt\",\"title\":\"test\",\"url\":\"tst\"},\"proof\":{\"verificationMethod\":\"#primary\",\"signature\":\"foJZLqID4C27eDheK/VDYjaGlxgTzy88s+o95GL4KwFbxLYechjOQ/JjMv7UFTYByOg84dECezeqjR7pjHeu1g==\"}}"
                resolve(ret)
            });
        }

        return credential.toString();
    }


    /**
     * We maintain a list of hardcoded basic profile keys=>user friendly string, to avoid
     * always displaying credential keys to user, and instead, show him something nicer.
     */
    getUserFriendlyBasicProfileKeyName(key: string): string {
      let translationKey = "credential-info-type-"+key;
      let translated = this.translate.instant(translationKey);
      if (!translated || translated == "" || translated == translationKey)
        return key;

      return translated;
    }
}

import { Injectable, NgZone } from '@angular/core';
import { Platform, ToastController, Events } from '@ionic/angular';

import { SimulatedDID, SimulatedDIDStore, BrowserSimulation, SimulatedCredential } from './browsersimulation';
import { resolve } from 'path';
import { TranslateService } from '@ngx-translate/core';
import { LocalStorage } from './localstorage';
import { PopupProvider } from './popup';
import { Native } from './native';
import { DIDStore } from '../model/didstore.model';
import { Config } from './config';
import { DIDEntry } from '../model/didentry.model';
import { DID } from '../model/did.model';
import { NewDID } from '../model/newdid.model';
import { BasicCredentialInfo, BasicCredentialInfoType } from '../model/basiccredentialinfo.model';
import { DIDDocumentPublishEvent, DIDPublicationStatusEvent } from '../model/eventtypes.model';
import { DIDService } from './did.service';
import { DIDDocument } from '../model/diddocument.model';

declare let didManager: DIDPlugin.DIDManager;
declare let appManager: AppManagerPlugin.AppManager;

@Injectable({
    providedIn: 'root'
})
export class DIDSyncService {
    public static instance: DIDSyncService = null;

    // Latest know status for each did, about whether it needs to be published or not (fresh changes not yet on chain)
    private needToPublishStatuses: Map<DID, boolean> = new Map();

    constructor(
        private platform: Platform,
        public zone: NgZone,
        private translate: TranslateService,
        public toastCtrl: ToastController,
        public events: Events,
        public popupProvider: PopupProvider,
        public localStorage: LocalStorage,
        private didService: DIDService,
        public native: Native) {
            console.log("DIDSyncService created");
            DIDSyncService.instance = this;

            this.subscribeEvents();
    }

    private subscribeEvents() {
      this.events.subscribe("diddocument:publishresult", (result: DIDDocumentPublishEvent)=>{
        console.log("diddocument:publishresult event received", result);
        this.onDIDDocumentPublishResponse(result);
      });

      this.events.subscribe("did:didchanged", ()=>{
        console.log("DID Sync service got did changed event");
        // Every time a DID has changed we check its publish status
        let did = this.didService.getActiveDid();
        if (did)
          this.checkIfDIDDocumentNeedsToBePublished(did);
      });

      this.events.subscribe("diddocument:locallymodified", (didString: DIDPlugin.DIDString)=>{
        // Assume the modified did is the active one.
        let did = this.didService.getActiveDid();

        this.setDidDocumentNeedsToBePublished(did);
      });
    }

    /**
     * Ask the wallet application to publish the currently active DID document for us, on the DID
     * sidechain.
     */
    public async publishActiveDIDDIDDocument(password: string) {
      try {
        this.native.showLoading('please-wait');
        await this.didService.getActiveDidStore().getActiveDid().getDIDDocument().publish(password);
        this.native.hideLoading();
      }
      catch (err) {
        this.native.hideLoading();
        await this.popupProvider.ionicAlert("Publish error", err.message);
      }
    }

    private onDIDDocumentPublishResponse(result: DIDDocumentPublishEvent) {
        if (result.published) {
            console.log("PUBLISHED !")
            this.popupProvider.ionicAlert('publish-success').then(()=>{
              this.events.publish("diddocument:publishresultpopupclosed", result);
            });
        }
        else if (result.cancelled) {
            console.log("CANCELLED");
        }
        else if (result.error) {
            console.error("ERROR")
            this.popupProvider.ionicAlert('publish-error').then(()=>{
              this.events.publish("diddocument:publishresultpopupclosed", result);
            });
        }

        // TODO: user feedback + update UI status (no need to sync any more)
    }

    /**
     * Checks if the active did's DID document needs to be uploaded to the sidechain.
     * This mostly happens when some changes have been made but user hasn't published them yet.
     *
     * NOTE: this method can reply quickly if checks can be done locally, but can also take networking
     * time when resolving is required.
     */
    public async checkIfDIDDocumentNeedsToBePublished(did: DID) {
      console.log("Checking if DID document needs to be published", did);
      let didString = did.getDIDString();

      // Check locally resolved DIDDocument modification date, or on chain one if notthing found locally (or expired).
      let currentOnChainDIDDocument: DIDDocument = null;
      try {
        currentOnChainDIDDocument = await this.resolveDIDWithoutDIDStore(didString, false);
        console.log("Resolved on chain document: ", currentOnChainDIDDocument);
        if (!currentOnChainDIDDocument) {
          // Null? This means there is no published document yet, so we need to publish.
          console.log("DID "+did.getDIDString()+" needs to be published (no did document on chain)");
          this.setPublicationStatus(did, true);
          return;
        }
      }
      catch (e) {
        // Exception: maybe network error while resolving. So we consider there is no need (or no way)
        // to publish the document for now.
        console.warn("Exception while resolving DID", e);
        this.setPublicationStatus(did, false);
        return;
      }

      // Compare modification dates
      let locallyUpdatedDate = await did.getDIDDocument().getUpdated();
      if (locallyUpdatedDate > currentOnChainDIDDocument.pluginDidDocument.getUpdated()) {
        // User document is more recent than chain document. Need to publish.
        console.log("DID "+did.getDIDString()+" needs to be published (more recent than the on chain one).");
        this.setPublicationStatus(did, true);
        return;
      }
      else {
        // User document has not been modified recently. Nothing to do.
        console.log("DID "+did.getDIDString()+" doesn't need to be published.");
        this.needToPublishStatuses.set(did, false);
        this.setPublicationStatus(did, false);
        return;
      }
    }

    private resolveDIDWithoutDIDStore(didString: string, forceRemote: boolean): Promise<DIDDocument> {
      return new Promise((resolve, reject)=>{
        didManager.resolveDidDocument(didString, forceRemote, (didDocument: DIDPlugin.DIDDocument)=>{
          if (!didDocument)
            resolve(null);
          else
            resolve(new DIDDocument(didDocument));
        }, (err)=>{
          reject(err);
        });
      });
    }

    private setPublicationStatus(did: DID, shouldPublish: boolean) {
      this.needToPublishStatuses.set(did, shouldPublish);

      let event: DIDPublicationStatusEvent = {
        did: did,
        shouldPublish: shouldPublish
      };
      this.events.publish("did:publicationstatus", event);
    }

    /**
     * Synchronous call that returns the latest status about DID document's publication requirement.
     * This status has been fetched asynchronously by checkIfDIDDocumentNeedsToBePublished().
     */
    public didDocumentNeedsToBePublished(did: DID): boolean {
      return this.needToPublishStatuses.get(did);
    }

    /**
     * When a change in the DID Document is done in the app, we can force-set the "needs publish" value.
     */
    public setDidDocumentNeedsToBePublished(did: DID) {
      this.setPublicationStatus(did, true);
    }
}

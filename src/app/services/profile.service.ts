import { Injectable } from '@angular/core';
import { Native } from './native';
import { Events, PopoverController } from '@ionic/angular';
import { AuthService } from 'src/app/services/auth.service';
import { DIDSyncService } from 'src/app/services/didsync.service';
import { DIDService } from './did.service';
import { TranslateService } from '@ngx-translate/core';
import { WarningComponent } from '../components/warning/warning.component';
import { DIDDocument } from '../model/diddocument.model';
import { DIDURL } from '../model/didurl.model';

declare let appManager: AppManagerPlugin.AppManager;

type ProfileDisplayEntry = {
  credentialId: string, // related credential id
  label: string,         // "title" to display
  value: string,         // value to display
  willingToBePubliclyVisible?: boolean    // Whether it's currently set to become published or not.
}

type CredentialDisplayEntry = {
  credential: DIDPlugin.VerifiableCredential,
  willingToBePubliclyVisible: boolean,
  willingToDelete: boolean,
  canDelete: boolean
}

@Injectable({
  providedIn: 'root'
})

export class ProfileService {

  visibleData: ProfileDisplayEntry[];
  invisibleData: ProfileDisplayEntry[];

  visibleCred: CredentialDisplayEntry[];
  invisibleCred: CredentialDisplayEntry[];

  public didString: string = "";
  public profileImage: string = null;
  public editingVisibility: boolean = false;
  public popup = false;

  constructor(
    public events: Events,
    private popover: PopoverController,
    private native: Native,
    private popoverCtrl: PopoverController,
    private didService: DIDService,
    private didSyncService: DIDSyncService,
    private translate: TranslateService
  ) { }

  /**
   * Generates a share intent that shares a "addfriend" url, so that friends can easily add the current user
   * as a global trinity friend
   **/
  shareIdentity() {
    let addFriendUrl = "https://scheme.elastos.org/addfriend?did=" + encodeURIComponent(this.didString);

    appManager.sendIntent("share", {
      title: this.translate.instant("share-add-me-as-friend"),
      url: addFriendUrl,
    });
  }

  editProfile() {
    this.editingVisibility = false;
    this.popover.dismiss();
    this.native.go("/editprofile", { create: false });
  }

  editVisibility() {
    this.editingVisibility = !this.editingVisibility;
  }

  async showWarning(warning: string) {
    console.log('Opening warning');
    this.popup = true;
    const popover = await this.popoverCtrl.create({
      mode: 'ios',
      cssClass: 'warning',
      component: WarningComponent,
      componentProps: {
        warning: warning
      },
      translucent: false
    });
    popover.onWillDismiss().then(() => {
      this.popup = false;
    });
    return await popover.present();
  }

  async confirmDeleteDID() {
    console.log('Confirming DID deletion');
    let activeDid = this.didService.getActiveDid();
    await this.didService.deleteDid(activeDid);
  }

  public publishDIDDocumentReal() {
    AuthService.instance.checkPasswordThenExecute(async () => {
      let password = AuthService.instance.getCurrentUserPassword();

      await this.updateDIDDocumentFromSelection(password);
      await this.didSyncService.publishActiveDIDDIDDocument(password);
    }, () => {
      // Cancelled
    });
  }

  /**
   * Checks visibility status for each profile item and update the DID document accordingly
   * (add / remove items).
   */
  private async updateDIDDocumentFromSelection(password: string) {
    let changeCount = 0;
    let currentDidDocument = this.didService.getActiveDid().getDIDDocument();

    for (let displayEntry of this.visibleData) {
      await this.updateDIDDocumentFromSelectionEntry(currentDidDocument, displayEntry, password);
      changeCount++;
    }

    for (let displayEntry of this.invisibleData) {
      await this.updateDIDDocumentFromSelectionEntry(currentDidDocument, displayEntry, password);
      changeCount++;
    }

    // Tell everyone that the DID document has some modifications.
    if (changeCount > 0) {
      this.events.publish("diddocument:changed");
    }
  }

  private async updateDIDDocumentFromSelectionEntry(currentDidDocument: DIDDocument, displayEntry: ProfileDisplayEntry, password: string) {
    console.log("Updating document selection from entry ", currentDidDocument, displayEntry);
    let relatedCredential = this.didService.getActiveDid().getCredentialById(new DIDURL(displayEntry.credentialId));
    console.log("Related credential: ", relatedCredential);

    let existingCredential = await currentDidDocument.getCredentialById(new DIDURL(relatedCredential.pluginVerifiableCredential.getId()));
    if (!existingCredential && displayEntry.willingToBePubliclyVisible) {
      // Credential doesn't exist in the did document yet but user wants to add it? Then add it.
      await currentDidDocument.addCredential(relatedCredential.pluginVerifiableCredential, password);
    }
    else if (existingCredential && !displayEntry.willingToBePubliclyVisible) {
      // Credential exists but user wants to remove it from chain? Then delete it from the did document
      await currentDidDocument.deleteCredential(relatedCredential.pluginVerifiableCredential, password);
    }
  }
}

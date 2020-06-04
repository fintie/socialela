import { Component, NgZone } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Events, ModalController, PopoverController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';

import { AdvancedPopupController } from 'src/app/components/advanced-popup/advancedpopup.controller';
import { ShowQRCodeComponent } from 'src/app/components/showqrcode/showqrcode.component';
import { Profile } from '../../model/profile.model';
import { DIDURL } from 'src/app/model/didurl.model';
import { DIDPublicationStatusEvent } from 'src/app/model/eventtypes.model';
import { DIDHelper } from '../../helpers/did.helper';
import { UXService } from '../../services/ux.service';
import { Native } from '../../services/native';
import { DIDService } from 'src/app/services/did.service';
import { AuthService } from 'src/app/services/auth.service';
import { DIDSyncService } from 'src/app/services/didsync.service';
import { ThemeService } from 'src/app/services/theme.service';
import { ProfileService } from 'src/app/services/profile.service';
import { OptionsComponent } from 'src/app/components/options/options.component';
import { VerifiableCredential } from 'src/app/model/verifiablecredential.model';
import { HiveService } from 'src/app/services/hive.service';

declare let appManager: AppManagerPlugin.AppManager;
declare let titleBarManager: TitleBarPlugin.TitleBarManager;
declare let contactNotifier: ContactNotifierPlugin.ContactNotifier;

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

@Component({
  selector: 'page-profile',
  templateUrl: 'profile.html',
  styleUrls: ['profile.scss']
})
export class ProfilePage {

  public profile: Profile;
  public profileImage: string = null;
  public credentials: VerifiableCredential[];

  public hasCredential: boolean = false;
  public creatingIdentity: boolean = false;
  public didNeedsToBePublished: boolean = false;

  public detailsActive = true;
  public credsActive = false;
  public capsulesActive = false;

  constructor(
    public events: Events,
    public route:ActivatedRoute,
    public zone: NgZone,
    private advancedPopup: AdvancedPopupController,
    private authService: AuthService,
    private translate: TranslateService,
    private didService: DIDService,
    private didSyncService: DIDSyncService,
    private appService: UXService,
    private modalCtrl: ModalController,
    private native: Native,
    private popoverCtrl: PopoverController,
    private uxService: UXService,
    public theme: ThemeService,
    public hiveService: HiveService,
    public profileService: ProfileService
  ) {
    this.init();
  }

  ngOnInit() {
    this.events.subscribe('did:didchanged', ()=> {
      this.zone.run(() => {
        this.init();
      });
    });

    this.events.subscribe('did:publicationstatus', (status: DIDPublicationStatusEvent)=>{
      let activeDid = this.didService.getActiveDid();
      if (activeDid && activeDid == status.did)
        this.didNeedsToBePublished = status.shouldPublish;
    });

    this.events.subscribe('diddocument:changed', ()=>{
      // When the did document content changes, we rebuild our profile entries on screen.
      this.buildDetailEntries();
      this.buildCredentialEntries();
    });

    this.events.subscribe('did:credentialadded', () => {
      this.zone.run(() => {
        this.init();
      });
    });
  }

  ngOnDestroy() {
    this.events.unsubscribe('did:credentialadded');
    this.events.unsubscribe('did:didchanged');
    this.events.unsubscribe('did:publicationstatus');
    this.events.unsubscribe('diddocument:changed');
  }

  init() {
    this.theme.getTheme();
    if (this.didService.getActiveDid()) { // Happens when importing a new mnemonic over an existing one
      this.profile = this.didService.getActiveDid().getBasicProfile();
      console.log("MyProfilePage is using this profile:", JSON.stringify(this.profile));

      this.credentials = this.didService.getActiveDid().credentials;
      this.hasCredential = this.credentials.length > 0 ? true : false;
      console.log('Has credentials?', this.hasCredential);
      console.log('Credentials', JSON.stringify(this.credentials));

      // Sort credentials by title
      this.credentials.sort((c1, c2) => {
        if (c1.pluginVerifiableCredential.getFragment() > c2.pluginVerifiableCredential.getFragment())
          return 1;
        else
          return -1;
      });

      this.buildDetailEntries();
      this.buildCredentialEntries();
    }
  }

  ionViewWillEnter() {
    this.uxService.makeAppVisible();
    titleBarManager.setTitle(this.translate.instant('my-profile'));
    titleBarManager.setNavigationMode(TitleBarPlugin.TitleBarNavigationMode.HOME);
  }

  ionViewDidEnter() {
    this.profileService.didString = this.didService.getActiveDid().getDIDString();
    if (this.profileService.didString !== '') {
      this.appService.setIntentListener();
      this.didNeedsToBePublished = this.didSyncService.didDocumentNeedsToBePublished(this.didService.getActiveDid());
    }
    console.log("MyProfilePage ionViewDidEnter did: " + this.profileService.didString);
  }

  changeList(list: string) {
    if(list === 'details') {
      this.detailsActive = true;
      this.credsActive = false;
      this.capsulesActive = false;
    }
    if(list === 'credentials') {
      this.detailsActive = false;
      this.credsActive = true;
      this.capsulesActive = false;
    }
    if(list === 'capsules') {
      this.detailsActive = false;
      this.credsActive = false;
      this.capsulesActive = true;
    }
  }

  /**
   * Convenience conversion to display profile data on UI.
   */
  buildDetailEntries() {
    let notSetTranslated = this.translate.instant("not-set");

    // Initialize
    this.profileService.visibleData = [];
    this.profileService.invisibleData = [];

    let profileEntries = this.profile.entries;
    for (let entry of profileEntries) {
      this.pushDisplayEntry(entry.info.key, {
        credentialId: "#"+entry.info.key,
        label: this.translate.instant("credential-info-type-"+entry.info.key),
        value: entry.toDisplayString() || notSetTranslated
      });
    }
  }

  pushDisplayEntry(profileKey: string, entry: ProfileDisplayEntry) {
    if (this.profileEntryIsVisibleOnChain(profileKey)) {
      entry.willingToBePubliclyVisible = true;
      this.profileService.visibleData.push(entry);
    }
    else {
      entry.willingToBePubliclyVisible = false;
      this.profileService.invisibleData.push(entry);
    }
    console.log('Invisible creds', this.profileService.invisibleData);
    console.log('Visible creds', this.profileService.visibleData);
    this.checkForProfileImage();
  }

  checkForProfileImage() {
    let imageCred = this.profileService.visibleData.find((cred) => cred.credentialId === "#picture");
    if(!imageCred) {
      imageCred = this.profileService.invisibleData.find((cred) => cred.label === "Profile Picture");
    }
    console.log('Profice Picture cred', imageCred);
    if(imageCred && this.hiveService.ipfsObj) {
      this.hiveService.loadImg(this.hiveService.ipfsObj, imageCred.value);
    }
    if(imageCred && !this.hiveService.ipfsObj) {
      this.hiveService.getIpfsObject().then((ipfs) => {
        this.hiveService.loadImg(ipfs, imageCred.value);
      });
    }
  }

  /**
   * Tells if a given profile key is currently visible on chain or not (inside the DID document or not).
   *
   * @param profileKey Credential key.
   */
  profileEntryIsVisibleOnChain(profileKey: string): boolean {
    let currentDidDocument = this.didService.getActiveDid().getDIDDocument();
    if (!currentDidDocument)
      return false;

    let credential = currentDidDocument.getCredentialById(new DIDURL("#"+profileKey));
    return credential != null;
  }

  /**
   * Convenience conversion to display credential data on UI.
   */
  buildCredentialEntries() {
    // Initialize
    this.profileService.visibleCred = [];
    this.profileService.invisibleCred = [];

    for(let c of this.credentials) {
      let canDelete = this.credentialIsCanDelete(c);
      if (this.credentialIsVisibleOnChain(c)) {
        this.profileService.visibleCred.push({
          credential: c.pluginVerifiableCredential,
          willingToBePubliclyVisible: true,
          willingToDelete: false,
          canDelete: canDelete
        });
      }
      else {
        this.profileService.invisibleCred.push({
          credential: c.pluginVerifiableCredential,
          willingToBePubliclyVisible: false,
          willingToDelete: false,
          canDelete: canDelete
        });
      }
    }
  }

  private async getAddFriendShareableUrl(): Promise<string> {
    let carrierAddress = await contactNotifier.getCarrierAddress();
    let addFriendUrl = "https://scheme.elastos.org/addfriend?did="+encodeURIComponent(this.profileService.didString);
    addFriendUrl += "&carrier="+carrierAddress;

    return addFriendUrl;
  }

  /**
   * Tells if a given credential is currently visible on chain or not (inside the DID document or not).
   */
  credentialIsVisibleOnChain(credential: VerifiableCredential) {
    let currentDidDocument = this.didService.getActiveDid().getDIDDocument();
    if (!currentDidDocument)
      return false;

    let didDocumentCredential = currentDidDocument.getCredentialById(new DIDURL(credential.pluginVerifiableCredential.getId()));
    return didDocumentCredential != null;
  }

  /**
   * The name credential can not be deleted.
   */
  credentialIsCanDelete(credential: VerifiableCredential) {
    let fragment = credential.pluginVerifiableCredential.getFragment();
    if (fragment === 'name') return false;
    else return true;
  }

  /******************** Reveal QR Code ********************/
  async showQRCode() {
    const modal = await this.modalCtrl.create({
      component: ShowQRCodeComponent,
      componentProps: {
        didString: this.profileService.didString,
        qrCodeString: await this.getAddFriendShareableUrl()
      },
      cssClass:"show-qr-code-modal"
    });
    modal.onDidDismiss().then((params) => {
    });
    modal.present();
  }

    /** Test for Security Check comp **/
/*   async showQRCode() {
    const modal = await this.modalCtrl.create({
      component: SecurityCheckComponent,
      componentProps: {
        didString: this.profileService.didString
      },
      cssClass:"show-qr-code-modal"
    });
    modal.onDidDismiss().then((params) => {
    });
    modal.present();
  } */

  /**
   * Generates a share intent that shares a "addfriend" url, so that friends can easily add the current user
   * as a global trinity friend
   */
  async shareIdentity() {
    let addFriendUrl = await this.getAddFriendShareableUrl();
    appManager.sendIntent("share", {
      title: this.translate.instant("share-add-me-as-friend"),
      url: addFriendUrl
    });
  }

  /******************** Reveal Options from Profile Buttons  ********************/
  async showOptions(ev: any, options: string) {
    console.log('Opening profile options');

    const popover = await this.popoverCtrl.create({
      mode: 'ios',
      component: OptionsComponent,
      cssClass: !this.theme.darkMode ? 'options' : 'darkOptions',
      componentProps: {
        options: options
      },
      event: ev,
      translucent: false
    });
    return await popover.present();
  }

   /**
   * Publish an updated DID document locally and to the DID sidechain, according to user's choices
   * for each profile item (+ the DID itself).
   */
  publishVisibilityChanges() {
    this.profileService.showWarning('publish');
  }

  /******************** Display Helpers  ********************/
  getDisplayableCredentialTitle(entry: CredentialDisplayEntry): string {
    let fragment = entry.credential.getFragment();
    let translationKey = "credential-info-type-"+fragment;
    let translated = this.translate.instant(translationKey);

    if (!translated || translated == "" || translated == translationKey)
      return fragment;

    return translated;
  }

  displayableProperties(credential: DIDPlugin.VerifiableCredential) {
    let subject = credential.getSubject();
    return Object.keys(subject).filter(key=>key!="id").sort().map((prop)=>{
      return {
        name: prop,
        value: (subject[prop] != "" ? subject[prop] : this.translate.instant("not-set"))
      }
    });
  }

  getDisplayableEntryValue(value: any) {
    if (value instanceof Object) {
      return JSON.stringify(value);
    }

    return value;
  }
}
import { Injectable } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { DIDService } from './did.service';
import { LocalStorage } from './localstorage';
import { Native } from './native';
import { DIDHelper } from '../helpers/did.helper';
import { PasswordManagerCancelallationException } from '../model/exceptions/passwordmanagercancellationexception';
import { PopupProvider } from './popup';

declare let passwordManager: PasswordManagerPlugin.PasswordManager;

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    public static instance: AuthService = null;
    private unlockedDidStorePassword: string = null;

    constructor(public modalCtrl: ModalController, 
        private didService: DIDService, 
        private popupProvider: PopupProvider) {
        AuthService.instance = this;
    }

    getCurrentUserPassword(): string {
        return this.unlockedDidStorePassword;
    }

    public async checkPasswordThenExecute(writeActionCb: () => Promise<void>, onCancelled: () => void) {
        return new Promise(async (resolve, reject) => {
            try {
                let passwordInfo = await passwordManager.getPasswordInfo("didstore-"+this.didService.getActiveDidStore().getId()) as PasswordManagerPlugin.GenericPasswordInfo;
                if (!passwordInfo) {
                    // Master password is right, but not data for the requested key...
                    console.log("Master password was right, but not password found for the requested key")
                    
                    this.popupProvider.ionicAlert("Password error", "Impossible to retrieve your identity store password from your master password. Please try to import your identity again.");
                    onCancelled();

                    return
                }
                else {
                    // Master password was unlocked and found
                    this.unlockedDidStorePassword = passwordInfo.password;
                    await writeActionCb();
                }
            }
            catch (e) {
                e = DIDHelper.reworkedPluginException(e);
                if (e instanceof PasswordManagerCancelallationException) {
                    // Nothing to do, just stop the flow here.
                    onCancelled();
                }
                else {
                    throw e;
                }
            }
        });
    }
}

export type ChooseIdentityOptions = {
    redirectPath: string;
}

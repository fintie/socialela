import { DIDURL } from './didurl.model';
import { LocalStorage } from '../services/localstorage';
import { ApiNoAuthorityException } from "./exceptions/apinoauthorityexception.exception";
import { DIDSyncService } from '../services/didsync.service';
import { DID } from './did.model';
import { DIDHelper } from '../helpers/did.helper';
import { DIDEvents } from '../services/events';

export class DIDDocument {
    constructor(public pluginDidDocument: DIDPlugin.DIDDocument) {
    }

    private updatedFieldStorageKey(): string {
        return "diddocument-"+this.pluginDidDocument.getSubject().getDIDString()+"-updated"
    }

    public addCredential(credential: DIDPlugin.VerifiableCredential, storePass: string): Promise<void> {
        console.log("Adding credential with key "+credential.getId()+" into DIDDocument", JSON.parse(JSON.stringify(credential)));

        return new Promise((resolve, reject)=>{
            this.pluginDidDocument.addCredential(
                credential,
                storePass,
                async () => {
                    await this.markUpdated();
                    resolve()
                }, (err) => {
                    console.error("Add credential exception", err);
                    reject(DIDHelper.reworkedPluginException(err));
                },
            );
        });
    }

    public deleteCredential(credential: DIDPlugin.VerifiableCredential, storePass: string): Promise<void> {
        console.log("Delete credential with key "+credential.getId()+" from the DIDDocument", JSON.parse(JSON.stringify(credential)));
        return new Promise((resolve, reject)=>{
            this.pluginDidDocument.deleteCredential(
                credential,
                storePass,
                async () => {
                    await this.markUpdated();
                    resolve()
                }, (err) => {
                    console.error("Delete credential exception", err);
                    reject(DIDHelper.reworkedPluginException(err));
                },
            );
        });
    }

    public createJWT(properties: any, validityDays: number, storePass: string): Promise<string> {
        return new Promise((resolve, reject)=>{
            this.pluginDidDocument.createJWT(properties, validityDays, storePass, async (jwtToken) => {
                resolve(jwtToken);
            }, (err) => {
                console.error("Delete credential exception", err);
                reject(DIDHelper.reworkedPluginException(err));
            });
        });
    }

    /**
     * Convenient way to add a credential if not existing, and update it if existing
     */
    public async updateOrAddCredential(credential: DIDPlugin.VerifiableCredential, storePass: string): Promise<void> {
        if (this.getCredentialById(new DIDURL(credential.getId()))) {
            // Already exists? Delete it first
            await this.deleteCredential(credential, storePass);
        }
        await this.addCredential(credential, storePass);
    }

    public async getUpdated(): Promise<Date> {
        if (!this.pluginDidDocument.getUpdated()) {
            // No updated date provided in the DID document: fallback to our own locally saved "updated"
            let storedDateString = await LocalStorage.instance.get(this.updatedFieldStorageKey());
            return new Date(storedDateString);
        }
        return new Date();
    }

    /**
     * Because currently the DID SDK maintains a "updated" date only for on-chain documents (updated = transaction date),
     * local did documents need a separate local storage hack to save their "updated" date and be able to compare
     * it with remote document date later on.
     */
    private async markUpdated() {
        await LocalStorage.instance.set(this.updatedFieldStorageKey(), (new Date()).toISOString());
    }

    /**
     * Retrieve a credential from the given credential id.
     */
    getCredentialById(credentialId: DIDURL) : DIDPlugin.VerifiableCredential {
        let credentials = this.getCredentials();
        return credentials.find((c)=>{
            return credentialId.matches(c.getId());
        });
    }

    getCredentials(): DIDPlugin.VerifiableCredential[] {
        return this.pluginDidDocument.getCredentials();
    }

    /**
     * Start publishing this DID document on chain.
     * Response will be received in DIDStore.createIdTransactionCallback().
     */
    publish(storepass: string): Promise<void> {
        return new Promise((resolve, reject)=>{
            this.pluginDidDocument.publish(
                storepass,
                () => {resolve()},
                (err) => {
                  //
                  if (typeof (err) === "string" && err.includes("have not run authority")) {
                    reject(new ApiNoAuthorityException(err));
                  } else {
                    reject(DIDHelper.reworkedPluginException(err))
                  }
                },
            );
        });
    }

    getDefaultPublicKey(): Promise<DIDPlugin.Base58PublicKey> {
        return new Promise((resolve, reject)=>{
            this.pluginDidDocument.getDefaultPublicKey((publicKey: DIDPlugin.PublicKey)=>{
                console.log(JSON.stringify(publicKey))
                let base58Key = publicKey.getPublicKeyBase58();
                resolve(base58Key);
            }, (err)=>{
                reject(err);
            })
        });
    }
}
import { Injectable } from '@angular/core';
import { BasicCredentialInfo, BasicCredentialInfoType } from '../model/basiccredentialinfo.model';

@Injectable({
    providedIn: 'root'
})
export class BasicCredentialsService {
    public static instance: BasicCredentialsService = null;

    private basicCredentialInfoList: BasicCredentialInfo[];

    constructor() {
      BasicCredentialsService.instance = this;

      this.createBasicCredentialInfoList();
    }

    private createBasicCredentialInfoList() {
      this.basicCredentialInfoList = [
        new BasicCredentialInfo("name", BasicCredentialInfoType.TEXT),
        new BasicCredentialInfo("picture", BasicCredentialInfoType.IMAGE),
        new BasicCredentialInfo("email", BasicCredentialInfoType.EMAIL),
        new BasicCredentialInfo("birthDate", BasicCredentialInfoType.DATE),
        new BasicCredentialInfo("nation", BasicCredentialInfoType.COUNTRY),
        new BasicCredentialInfo("gender", BasicCredentialInfoType.GENDER),
        new BasicCredentialInfo("telephone", BasicCredentialInfoType.PHONE_NUMBER),

        new BasicCredentialInfo("nickname", BasicCredentialInfoType.TEXT),
        new BasicCredentialInfo("birthPlace", BasicCredentialInfoType.TEXT),
        new BasicCredentialInfo("occupation", BasicCredentialInfoType.TEXT),
        new BasicCredentialInfo("interests", BasicCredentialInfoType.TEXT),
        new BasicCredentialInfo("description", BasicCredentialInfoType.TEXT),
        new BasicCredentialInfo("url", BasicCredentialInfoType.TEXT),
        new BasicCredentialInfo("facebook", BasicCredentialInfoType.TEXT),
        new BasicCredentialInfo("twitter", BasicCredentialInfoType.TEXT),
        new BasicCredentialInfo("telegram", BasicCredentialInfoType.TEXT),
        new BasicCredentialInfo("wechat", BasicCredentialInfoType.TEXT),
        new BasicCredentialInfo("weibo", BasicCredentialInfoType.TEXT),
      ];
    }

    /**
     * Returns a list of standard profile entries that we can let user add to his profile.
     * Each profile item has its own type (text, date, number...) and the UI will provide a different
     * input method according to this type.
     *
     * Type names follow the Elastos DID standard defined by the Elastos DID specification.
     */
    getBasicCredentialInfoList() : BasicCredentialInfo[] {
      return this.basicCredentialInfoList;
    }

    getBasicCredentialInfoByKey(key: string): BasicCredentialInfo {
      let info = this.basicCredentialInfoList.find((i)=>{
        return i.key == key;
      });

      if (info == null)
        console.warn("No basic credential info found for key "+key+"!");

      return info;
    }
}

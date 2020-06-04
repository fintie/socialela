import { BasicCredentialInfo, BasicCredentialInfoType } from "./basiccredentialinfo.model";
import { area } from '../../assets/area/area';
import { CountryCodeInfo } from "./countrycodeinfo";
import { TranslationService } from "../services/translation.service";

export class BasicCredentialEntry {
    constructor(
        public info: BasicCredentialInfo, 
        public value: string    // All credentials are finally stored as strings (for now only?)
    ) {
        if (!info) {
            // Undefined info? Maybe the caller could not resolve any existing BasicCredentialInfo.
            console.error("Undefined BasicCredentialInfo passed to BasicCredentialEntry!");
        }
    }

    /**
     * Returns a displayable string that shows this entry content. For now we put all types in this class, we
     * don't want to build one class per credential type.
     */
    toDisplayString() {
        switch (this.info.type) {
            case BasicCredentialInfoType.COUNTRY:
                return this.getDisplayableNation();
            case BasicCredentialInfoType.DATE:
                return this.getDisplayableDate();
            case BasicCredentialInfoType.GENDER:
                return this.getDisplayableGender();
            default:
                return this.value;
        }
    }

    private getDisplayableNation(): string {
        let countryInfo = area.find((a : CountryCodeInfo)=>{
          return this.value == a.alpha3;
        })
    
        if (!countryInfo)
          return null;
    
        return countryInfo.name;
    }
    
    private getDisplayableDate(): string {
        if (!this.value || this.value == "")
          return null;
          
        let d = new Date(this.value);
        return d.toLocaleDateString();
    }

    private getDisplayableGender(): string {
        if (!this.value || this.value == "")
          return null;

        return TranslationService.instance.translateInstant(this.value);
    }
}
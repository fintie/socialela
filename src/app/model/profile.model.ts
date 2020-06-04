import { BasicCredentialEntry } from "./basiccredentialentry.model";
import { BasicCredentialInfo } from "./basiccredentialinfo.model";
import { BasicCredentialsService } from "../services/basiccredentials.service";

/**
 * Fields in this class match the Elastos DID specification naming convention for credentials.
 */
export class Profile {
  public entries: BasicCredentialEntry[] = [];

  constructor(
    /*public name: string = "", // Full name
    public birthDate: string = "", // RFC 3339
    public nation: string = "", // ISO 3166 ALPHA 3 (ex: CHN, FRA)
    public email: string = "",
    public gender: string = "",
    public telephone: string = ""*/
  ) { }

  getEntryByKey(key: string) {
    return this.entries.find((e)=>{
      return e.info.key == key;
    });
  }

  setValue(basicCredentialInfo: BasicCredentialInfo, value: string) {
    // If the entry already exists, we just update it. Otherwise we add it first.
    let entry = this.getEntryByKey(basicCredentialInfo.key);
    if (!entry) {
      entry = new BasicCredentialEntry(basicCredentialInfo, value);
      this.entries.push(entry);
    }
    else {
      entry.value = value;
    }
  }

  deleteEntry(entry: BasicCredentialEntry) {
    let deletionIndex = this.entries.findIndex((e)=>{
      return e.info.key == entry.info.key;
    });
    if (deletionIndex >= 0) {
      this.entries.splice(deletionIndex, 1);
    }
  }

  /**
   * Convenience method to retrieve the "name" credential value.
   */
  getName(): string {
    let nameEntry = this.getEntryByKey("name");
    if (!nameEntry)
      return null;

    return nameEntry.value;
  }

  /**
   * Use standard fields from available basic credentials list, to build a default user profile (default
   * credentials created when creating a DID).
   */
  static createDefaultProfile(): Profile {
    let profile = new Profile();

    profile.entries.push(new BasicCredentialEntry(BasicCredentialsService.instance.getBasicCredentialInfoByKey("name"), ""));
    profile.entries.push(new BasicCredentialEntry(BasicCredentialsService.instance.getBasicCredentialInfoByKey("birthDate"), ""));
    profile.entries.push(new BasicCredentialEntry(BasicCredentialsService.instance.getBasicCredentialInfoByKey("nation"), ""));
    profile.entries.push(new BasicCredentialEntry(BasicCredentialsService.instance.getBasicCredentialInfoByKey("email"), ""));
    profile.entries.push(new BasicCredentialEntry(BasicCredentialsService.instance.getBasicCredentialInfoByKey("gender"), ""));
    profile.entries.push(new BasicCredentialEntry(BasicCredentialsService.instance.getBasicCredentialInfoByKey("telephone"), ""));

    console.log(profile)
    return profile;
  }

  /**
   * Creates a cloned version of the given profile
   */
  static fromProfile(profile: Profile) {

    // TODO IMPORTANT: CLONE ENTRIES LIST WITH NEW OBJECT - NOW WE ARE NOT CLONING

    let newProfile = new Profile();
    Object.assign(newProfile, profile);
    return newProfile;
  }

  /**
   * Convenience method to check gender.
   */
  isMale() {
    let genderEntry = this.getEntryByKey("gender");
    return (!genderEntry || genderEntry.value == "" || genderEntry.value == "male");
  }

  getDefaultProfilePicturePath() {
    if (this.isMale())
      return "assets/images/Guy_Face.svg";
    else
      return "assets/images/DefaultProfileWoman.svg";
  }
}

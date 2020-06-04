import { DIDPluginException } from "../model/exceptions/didplugin.exception";
import { WrongPasswordException } from "../model/exceptions/wrongpasswordexception.exception";
import { ApiNoAuthorityException } from "../model/exceptions/apinoauthorityexception.exception";
import { PasswordManagerCancelallationException } from "../model/exceptions/passwordmanagercancellationexception";

export class DIDHelper {
  /**
   * From a raw JS exception, try to extract more usable information and return clearer
   * exception types such as WrongPasswordException.
   */
  static reworkedPluginException(e: any) {
    if (e) {
      if (e.code) {
        if (e.message) { // If we have code and message fields in the object, we may be a DIDPluginException type
          // TODO: Add error code enum in DID Plugin typings and don't hardcode code values here.
          if (e.code == 10016 || e.message.includes("password") || e.message.includes("WrongPasswordException"))
            return new WrongPasswordException();
        }
      }

      if (e.message) {
        if (e.message.includes("MasterPasswordCancellation"))
            return new PasswordManagerCancelallationException();
      }
    }

    console.log("No specific exception info");
    return e; // No more info - return the raw error.
  }

  static reworkedApiNoAuthorityException(e) {
    if (!e || typeof (e) !== "string") {
      console.log("No specific exception info");
      return e; // No more info - return the raw error.
    }

    if (e.includes("have not run authority"))
      return new ApiNoAuthorityException(e);

    // All other cases: return the raw error.
    return e;
  }
}

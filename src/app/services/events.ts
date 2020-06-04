import { Injectable } from "@angular/core";
import { Events } from "@ionic/angular";

@Injectable({
    providedIn: 'root'
})
export class DIDEvents {
    public static instance: DIDEvents = null;
    
    constructor(public events: Events) {
        DIDEvents.instance = this;
    }
}

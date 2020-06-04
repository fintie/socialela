import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage';

import { DIDEntry } from '../model/didentry.model';
import { BrowserSimulation, BrowserSimulationConfig } from './browsersimulation';

@Injectable()
export class LocalStorage {
    public static instance: LocalStorage = null;

    constructor(private storage: Storage) {
        console.log("LocalStorage init");

        LocalStorage.instance = this;
    }

    private add(key: string, value: any): any {
        return this.get(key).then((val) => {
            let id = value['id'];
            if (val === null) {
                let initObj = {};
                initObj[id] = value;
                return this.storage.set(key, JSON.stringify(initObj));
            }
            let addObj = JSON.parse(val);
            addObj[id] = value;
            return this.storage.set(key, JSON.stringify(addObj));
        });
    }

    public set(key: string, value: any): Promise<any> {
        return this.storage.set(key, value);
    }

    public get(key: string): Promise<any> {
        return this.storage.get(key);
    }

    private getAsJson<T>(key) : Promise<T> {
        return new Promise(async (resolve, reject)=>{
            try {
                let val = await this.storage.get(key)
                resolve(JSON.parse(val));
            }
            catch (err) {
                reject(err);
            }
        });
    }

    public remove(key: string): any {
        return this.storage.remove(key);
    }
}



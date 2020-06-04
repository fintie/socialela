import { Injectable } from '@angular/core';

declare let hiveManager: HivePlugin.HiveManager;

@Injectable({
  providedIn: 'root'
})
export class HiveService {

  public profileImage: string = null;
  public imageCid: any;

  public ipfsObj: HivePlugin.IPFS = null;
  public skey: string = "elastos.trinity.dApps.demo.hive";

  constructor() { }

  getIpfsObject():Promise<HivePlugin.IPFS> {
    let type: string = HivePlugin.DriveType.IPFS.toString();
    let options: any = { driveType:type };
    return new Promise((resolve, reject) => {
      try {
        this.createClient(null,options).then((client:HivePlugin.Client) => {
          try {
            client.getIPFS((ipfs:HivePlugin.IPFS) => {
              resolve(ipfs);
            },(err: string) => {
              reject("err: "+err);
            });
          } catch(err) {
            reject("err:"+err);
          }

        }).catch((err:string)=>{
          reject("err: "+err);
        });
      } catch (error) {
        reject("err: "+JSON.stringify(error));
    }});
  }

  createClient(hander: any, options: any):Promise<HivePlugin.Client> {
    return new Promise((resolve, reject) => {
    try{
      hiveManager.createClient(
        hander,
        options,
        (info) => {
          resolve(info);
        }, (err) => {
          reject("err: "+err);
        });
    } catch(err) {
      reject("err: "+JSON.stringify(err));
    }});
  }

  ipfsPut(ipfs:HivePlugin.IPFS, content: string):Promise<any> {
    return new Promise((resolve, reject)=>{
      try {
        ipfs.put(content).then((result) => {
          resolve(result);
        }).catch((err:string) => {
          reject("err: " + err);
        });
      } catch (error) {
        reject("err: "+JSON.stringify(error));
      }
    });
  }

  ipfsGet(ipfs: HivePlugin.IPFS, cid: string): Promise<any> {
    return new Promise((resolve, reject) => {
      try {
        ipfs.get(cid).then((result) => {
          if(result["status"] === "success") {
            console.log('ipfsGet', result);
            resolve(result["content"]);
          }
        }).catch((err:string) => {
          reject("err: "+err);
        });
      } catch (error) {
        reject("err: "+JSON.stringify(error));
      }
    });
  }

 /*  loadImg(ipfsObj: HivePlugin.IPFS, imageCid: any) {
    console.log('Loading img from hive', imageCid);
    this.ipfsGet(ipfsObj, imageCid).then((result) => {
      if(result["status"] === "success") {
        this.profileImage = result["content"];
        console.log('ipfsGet', result);
        console.log('Profile image', this.profileImage);
      }
    }).catch((err) => {
      alert(err);
    });
  }
 */

 async loadImg(ipfsObj: HivePlugin.IPFS, imageCid: any) {
    console.log('Loading img from hive', imageCid);
    this.profileImage = await this.ipfsGet(ipfsObj, imageCid)
    console.log('Profile image', this.profileImage);
  }
}

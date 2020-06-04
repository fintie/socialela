import { Component, OnInit } from '@angular/core';
import { ThemeService } from 'src/app/services/theme.service';
import { PopoverController, NavParams } from '@ionic/angular';
import { ProfileService } from 'src/app/services/profile.service';

@Component({
  selector: 'app-warning',
  templateUrl: './warning.component.html',
  styleUrls: ['./warning.component.scss'],
})
export class WarningComponent implements OnInit {

  warning: string = "";

  constructor(
    public profileService: ProfileService,
    public theme: ThemeService,
    private popover: PopoverController,
    private navParams: NavParams
  ) { }

  ngOnInit() {
    this.warning = this.navParams.get('warning');
  }

  cancel() {
    this.popover.dismiss();
  }

  confirmDeleteDID() {
    this.popover.dismiss();
    this.profileService.confirmDeleteDID();
  }

  confirmPublishDID() {
    this.popover.dismiss();
    this.profileService.publishDIDDocumentReal();
  }
}

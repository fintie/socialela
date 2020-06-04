import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { HeaderBarComponent } from './header-bar/header-bar.component';
import { HeaderMenuButtonComponent } from './header-menu-button/header-menu-button.component';
import { DIDButtonComponent } from './did-button/did-button.component';
import { LargeMenuItemComponent } from './large-menu-item/large-menu-item.component';
import { VerifyMnemonicWordComponent } from './verify-mnemonic-word/verify-mnemonic-word.component';
import { MainContentComponent } from './main-content/main-content.component';
import { RoundedActionButtonComponent } from './rounded-action-button/rounded-action-button.component';
import { ShowQRCodeComponent } from './showqrcode/showqrcode.component';
import { QRCodeModule } from 'angularx-qrcode';
import { AdvancedPopupController } from './advanced-popup/advancedpopup.controller';
import { AdvancedPopupComponent } from './advanced-popup/advancedpopup.component';
import { ImportDIDSourceComponent } from './importdidsource/importdidsource.component';
import { EmptyImportedDocumentComponent } from './emptyimporteddocument/emptyimporteddocument.component';

@NgModule({
  declarations: [
    HeaderBarComponent, 
    HeaderMenuButtonComponent,
    DIDButtonComponent,
    LargeMenuItemComponent,
    VerifyMnemonicWordComponent,
    MainContentComponent,
    RoundedActionButtonComponent,
    ShowQRCodeComponent,
    AdvancedPopupComponent,
    ImportDIDSourceComponent,
    EmptyImportedDocumentComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TranslateModule,
    QRCodeModule
  ],
  exports: [
    HeaderBarComponent, 
    HeaderMenuButtonComponent,
    DIDButtonComponent,
    LargeMenuItemComponent,
    VerifyMnemonicWordComponent,
    MainContentComponent,
    RoundedActionButtonComponent,
    ShowQRCodeComponent,
    ImportDIDSourceComponent,
    EmptyImportedDocumentComponent
  ],
  providers: [
    AdvancedPopupController
  ],
  entryComponents: [
    AdvancedPopupComponent,
    ImportDIDSourceComponent,
    EmptyImportedDocumentComponent,
  ],
})
export class ComponentsModule { }

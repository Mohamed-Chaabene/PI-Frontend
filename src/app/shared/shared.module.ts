import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { NgxScrollTopModule } from 'ngx-scrolltop';

import { NavbarComponent } from '../common/navbar/navbar.component';
import { FooterComponent } from '../common/footer/footer.component';
import { SubscribeComponent } from '../common/subscribe/subscribe.component';

@NgModule({
  declarations: [
    NavbarComponent,
    FooterComponent,
    SubscribeComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    NgxScrollTopModule
  ],
  exports: [
    NavbarComponent,
    FooterComponent,
    SubscribeComponent,
    NgxScrollTopModule
  ]
})
export class SharedModule {}

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RtcComponent } from './component/rtc/rtc.component';
const routes: Routes = [
  {
    path:'**',
    component:RtcComponent
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }

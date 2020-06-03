import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

import { AboutPage } from './pages/about/about';
import { ProfilePage } from './pages/profile/profile';
import { HomePage } from './pages/home/home';

const routes: Routes = [
  { path: 'tab1Root', component: HomePage },
  { path: 'tab2Root', component: AboutPage },
  { path: 'tab3Root', component: ProfilePage }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}

import { Routes } from '@angular/router';
import { AppComponent } from './app.component';
import { RangeResolver } from './map/location/range.resolver';

export const routes: Routes = [
  {
    path: '',
    component: AppComponent,
    resolve: {
      data: RangeResolver,
    },
  },
];

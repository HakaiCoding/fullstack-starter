import { ChangeDetectionStrategy, Component } from '@angular/core';
import { APP_ROUTE_METADATA } from '../../app-route-metadata';

@Component({
  selector: 'app-home-page',
  templateUrl: './home.page.html',
  styleUrl: './home.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage {
  readonly pageTitle = APP_ROUTE_METADATA.home.title;
}

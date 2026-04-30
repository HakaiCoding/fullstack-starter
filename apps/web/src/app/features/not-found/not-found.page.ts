import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { APP_ROUTE_METADATA } from '../../app-route-metadata';

@Component({
  selector: 'app-not-found-page',
  imports: [RouterLink],
  templateUrl: './not-found.page.html',
  styleUrl: './not-found.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotFoundPage {
  readonly pageTitle = APP_ROUTE_METADATA.notFound.title;
  readonly homePath = APP_ROUTE_METADATA.home.path;
}

import { computed, ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatToolbarModule } from '@angular/material/toolbar';
import {
  ActivatedRouteSnapshot,
  NavigationEnd,
  Router,
  RouterOutlet,
} from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { type AppRouteData } from '../../app-route-metadata';
import { UserMenuComponent } from '../user-menu/user-menu.component';

const APP_TITLE_FALLBACK = 'web';

const getDeepestRouteSnapshot = (
  snapshot: ActivatedRouteSnapshot,
): ActivatedRouteSnapshot => {
  let currentRouteSnapshot = snapshot;
  while (currentRouteSnapshot.firstChild) {
    currentRouteSnapshot = currentRouteSnapshot.firstChild;
  }

  return currentRouteSnapshot;
};

@Component({
  selector: 'app-shell',
  imports: [MatToolbarModule, RouterOutlet, UserMenuComponent],
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppShellComponent {
  private readonly router = inject(Router);
  private readonly navigationCompleted = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );

  protected readonly title = computed(() => {
    this.navigationCompleted();
    const activeRouteSnapshot = getDeepestRouteSnapshot(this.router.routerState.snapshot.root);
    const routeData = activeRouteSnapshot.data as Partial<AppRouteData>;
    return routeData.routeMetadata?.title ?? APP_TITLE_FALLBACK;
  });
}

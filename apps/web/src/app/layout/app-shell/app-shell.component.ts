import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router, RouterOutlet } from '@angular/router';
import { APP_ROUTE_METADATA } from '../../app-route-metadata';
import { UserMenuComponent } from '../user-menu/user-menu.component';

@Component({
  selector: 'app-shell',
  imports: [MatToolbarModule, RouterOutlet, UserMenuComponent],
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppShellComponent {
  private readonly router = inject(Router);
  private readonly homePath = APP_ROUTE_METADATA.home.path;

  protected onBrandClick(): void {
    if (this.router.url === this.homePath) {
      return;
    }

    void this.router.navigateByUrl(this.homePath);
  }
}

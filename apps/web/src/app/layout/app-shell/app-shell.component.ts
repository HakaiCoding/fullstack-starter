import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterOutlet } from '@angular/router';
import { UserMenuComponent } from '../user-menu/user-menu.component';

@Component({
  selector: 'app-shell',
  imports: [MatToolbarModule, RouterOutlet, UserMenuComponent],
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppShellComponent {
  protected title = 'web';
}

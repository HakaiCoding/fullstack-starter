import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AppShellComponent } from './app-shell/app-shell.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AppShellComponent],
  selector: 'app-root',
  templateUrl: './app.html',
})
export class App {}

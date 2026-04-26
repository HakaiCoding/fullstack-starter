import { TestBed } from '@angular/core/testing';
import { AppShellComponent } from './app-shell.component';

describe('AppShellComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppShellComponent],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(AppShellComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });
});

import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NotFoundPage } from './not-found.page';

describe('NotFoundPage', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotFoundPage, RouterTestingModule],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(NotFoundPage);

    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renders a not found message and link back home', () => {
    const fixture = TestBed.createComponent(NotFoundPage);
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector('h1')?.textContent?.trim(),
    ).toBe('Page not found');
    expect(
      fixture.nativeElement.querySelector('a[routerLink="/"]'),
    ).toBeTruthy();
  });
});

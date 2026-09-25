import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';
import { profile } from '../content/profile';

describe('App shell', () => {
  it('renders the skip link, main landmark and site name', async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([])],
    }).compileComponents();
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('main#main')).toBeTruthy();
    expect(el.querySelector('header')?.textContent).toContain(profile.name);
    expect(el.querySelector('a')?.getAttribute('href')).toContain('#main');
  });
});

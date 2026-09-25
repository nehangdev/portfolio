import { Routes } from '@angular/router';
import { seo } from '../content/pages';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home').then((m) => m.Home),
    data: seo.home,
  },
  {
    path: 'about',
    loadComponent: () => import('./pages/about').then((m) => m.About),
    title: seo.about.title,
    data: seo.about,
  },
  {
    path: 'colophon',
    loadComponent: () => import('./pages/colophon').then((m) => m.Colophon),
    title: seo.colophon.title,
    data: seo.colophon,
  },
  {
    // Prerendered to /404/index.html, then copied to /404.html for the static host.
    path: '404',
    loadComponent: () => import('./pages/not-found').then((m) => m.NotFound),
    title: seo.notFound.title,
    data: seo.notFound,
  },
  {
    path: '**',
    loadComponent: () => import('./pages/not-found').then((m) => m.NotFound),
    title: seo.notFound.title,
    data: seo.notFound,
  },
];

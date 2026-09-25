import { DOCUMENT, Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { profile } from '../../content/profile';

/** Sets title, description, canonical URL and social tags from each route's `title` and `data.description`. */
@Injectable({ providedIn: 'root' })
export class SeoTitleStrategy extends TitleStrategy {
  private readonly titleService = inject(Title);
  private readonly meta = inject(Meta);
  private readonly doc = inject(DOCUMENT);

  override updateTitle(snapshot: RouterStateSnapshot): void {
    let route = snapshot.root;
    while (route.firstChild) route = route.firstChild;

    const pageTitle = this.buildTitle(snapshot);
    const title = pageTitle ? `${pageTitle} | ${profile.name}` : `${profile.name}, ${profile.role}`;
    const description = (route.data['description'] as string | undefined) ?? '';
    const path = snapshot.url.split(/[?#]/)[0];
    const url = profile.siteUrl + (path === '/' ? '/' : path);

    this.titleService.setTitle(title);
    for (const [attr, key, content] of [
      ['name', 'description', description],
      ['property', 'og:title', title],
      ['property', 'og:description', description],
      ['property', 'og:url', url],
      ['property', 'og:type', 'website'],
      ['name', 'twitter:card', 'summary'],
    ]) {
      this.meta.updateTag({ [attr]: key, content }, `${attr}="${key}"`);
    }

    let canonical = this.doc.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = this.doc.createElement('link');
      canonical.rel = 'canonical';
      this.doc.head.appendChild(canonical);
    }
    canonical.href = url;
  }
}

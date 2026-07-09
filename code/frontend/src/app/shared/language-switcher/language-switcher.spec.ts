import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { LanguageSwitcher } from './language-switcher';

async function setup(locale: string) {
  await TestBed.configureTestingModule({
    imports: [LanguageSwitcher],
    providers: [{ provide: LOCALE_ID, useValue: locale }],
  }).compileComponents();

  const fixture = TestBed.createComponent(LanguageSwitcher);
  fixture.detectChanges();
  const root = fixture.nativeElement as HTMLElement;
  return { fixture, root };
}

function optionByHref(root: HTMLElement, href: string): HTMLAnchorElement {
  const link = Array.from(root.querySelectorAll('a')).find((a) => a.getAttribute('href') === href);
  return link as HTMLAnchorElement;
}

describe('LanguageSwitcher', () => {
  it('renders a link for each locale with the right href', async () => {
    const { root } = await setup('es');

    const hrefs = Array.from(root.querySelectorAll('a')).map((a) => a.getAttribute('href'));

    expect(hrefs).toContain('/');
    expect(hrefs).toContain('/en/');
  });

  it('exposes an accessible label on each link', async () => {
    const { root } = await setup('es');

    for (const link of Array.from(root.querySelectorAll('a'))) {
      expect(link.getAttribute('aria-label')?.length).toBeGreaterThan(0);
    }
  });

  it('marks Spanish as the active locale when running in Spanish', async () => {
    const { root } = await setup('es');

    const spanish = optionByHref(root, '/');
    const english = optionByHref(root, '/en/');

    expect(spanish.getAttribute('aria-current')).toBe('true');
    expect(spanish.classList.contains('is-active')).toBe(true);
    expect(english.getAttribute('aria-current')).toBeNull();
  });

  it('marks English as the active locale when running in English', async () => {
    const { root } = await setup('en-US');

    const spanish = optionByHref(root, '/');
    const english = optionByHref(root, '/en/');

    expect(english.getAttribute('aria-current')).toBe('true');
    expect(english.classList.contains('is-active')).toBe(true);
    expect(spanish.getAttribute('aria-current')).toBeNull();
  });
});

import { provideRouter } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { Home } from './home';

function accessibleText(el: Element): string {
  return `${el.textContent ?? ''} ${el.getAttribute('aria-label') ?? ''}`.trim();
}

function assertBasicAccessibility(root: HTMLElement): void {
  expect(root.querySelectorAll('main').length).toBe(1);

  const headings = root.querySelectorAll('h1, h2, h3');
  expect(headings.length).toBeGreaterThan(0);
  expect(root.querySelectorAll('h1').length).toBe(1);

  for (const link of Array.from(root.querySelectorAll('a'))) {
    expect(accessibleText(link).length).toBeGreaterThan(0);
    expect(link.getAttribute('href')).toBeTruthy();
  }

  for (const section of Array.from(root.querySelectorAll('section'))) {
    const labelledby = section.getAttribute('aria-labelledby');
    const hasLabel = section.getAttribute('aria-label');
    expect(Boolean(labelledby) || Boolean(hasLabel)).toBe(true);
    if (labelledby) {
      expect(root.querySelector(`#${CSS.escape(labelledby)}`)).toBeTruthy();
    }
  }

  for (const svg of Array.from(root.querySelectorAll('svg'))) {
    const decorativeAncestor = svg.closest('[aria-hidden="true"]');
    const focusable = svg.getAttribute('focusable');
    expect(Boolean(decorativeAncestor) || focusable === 'false').toBe(true);
  }
}

describe('Home', () => {
  async function setup() {
    await TestBed.configureTestingModule({
      imports: [Home],
      providers: [provideRouter([])],
    }).compileComponents();

    const fixture = TestBed.createComponent(Home);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    return { fixture, root };
  }

  it('renders the main hero headline', async () => {
    const { root } = await setup();

    const heading = root.querySelector('h1');
    expect(heading).toBeTruthy();
    expect(heading!.textContent?.trim().length).toBeGreaterThan(0);
  });

  it('links to the registration and login routes', async () => {
    const { root } = await setup();

    const hrefs = Array.from(root.querySelectorAll('a')).map((a) => a.getAttribute('href'));

    expect(hrefs).toContain('/register');
    expect(hrefs).toContain('/login');
  });

  it('offers the log in call to action as disabled while auth is not implemented', async () => {
    const { root } = await setup();

    const loginButtons = Array.from(root.querySelectorAll('button')).filter((button) =>
      /log in/i.test(button.textContent ?? ''),
    );

    expect(loginButtons).toHaveLength(2);
    for (const button of loginButtons) {
      expect(button.disabled).toBe(true);
    }
  });

  it('does not offer the log in call to action as a navigable link', async () => {
    const { root } = await setup();

    const navigableLogin = Array.from(root.querySelectorAll('a')).filter(
      (link) => link.getAttribute('href') === '/login' && /button/.test(link.className),
    );

    expect(navigableLogin).toHaveLength(0);
  });

  it('passes a basic accessibility check', async () => {
    const { root } = await setup();

    assertBasicAccessibility(root);
  });
});

import { provideRouter } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { AdminLayout } from './admin-layout';

async function setup() {
  await TestBed.configureTestingModule({
    imports: [AdminLayout],
    providers: [provideRouter([])],
  }).compileComponents();

  const fixture = TestBed.createComponent(AdminLayout);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();

  return { fixture, root: fixture.nativeElement as HTMLElement };
}

function links(root: HTMLElement): HTMLAnchorElement[] {
  const nav = root.querySelector('nav');
  return Array.from(nav?.querySelectorAll('a') ?? []);
}

describe('AdminLayout', () => {
  it('exposes a navigation landmark with an accessible name', async () => {
    const { root } = await setup();

    const nav = root.querySelector('nav');

    expect(nav).toBeTruthy();
    expect(nav?.getAttribute('aria-label')?.trim().length).toBeGreaterThan(0);
  });

  it('links to the two owner sections', async () => {
    const { root } = await setup();

    const hrefs = links(root).map((link) => link.getAttribute('href'));

    expect(hrefs).toContain('/admin/schedule');
    expect(hrefs).toContain('/admin/catalog');
  });

  it('gives every menu entry a visible label', async () => {
    const { root } = await setup();

    for (const link of links(root)) {
      expect(link.textContent?.trim().length).toBeGreaterThan(0);
    }
  });

  it('renders an outlet for the active section', async () => {
    const { root } = await setup();

    expect(root.querySelector('router-outlet')).toBeTruthy();
  });
});

function shareButton(root: HTMLElement): HTMLButtonElement | undefined {
  return Array.from(root.querySelectorAll('button')).find(
    (button) => (button.textContent?.trim().length ?? 0) > 0,
  );
}

function liveRegions(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>('[role="status"], [role="alert"]'));
}

describe('AdminLayout booking link sharing', () => {
  let writeText: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });
  });

  it('offers a labelled button to share the booking page', async () => {
    const { root } = await setup();

    expect(shareButton(root)).toBeTruthy();
  });

  it('copies the public booking url of the current tenant', async () => {
    const { fixture, root } = await setup();

    shareButton(root)!.click();
    await fixture.whenStable();

    expect(writeText).toHaveBeenCalledWith(`${window.location.origin}/booking`);
  });

  it('announces the result so it is not a silent action', async () => {
    const { fixture, root } = await setup();

    expect(liveRegions(root)).toHaveLength(0);

    shareButton(root)!.click();
    await fixture.whenStable();
    fixture.detectChanges();

    const announced = liveRegions(root);
    expect(announced.length).toBeGreaterThan(0);
    expect(announced[0].textContent?.trim().length).toBeGreaterThan(0);
  });

  it('reports a failure instead of pretending the link was copied', async () => {
    writeText.mockRejectedValue(new Error('denied'));
    const { fixture, root } = await setup();

    shareButton(root)!.click();
    await fixture.whenStable();
    fixture.detectChanges();

    const alerts = Array.from(root.querySelectorAll<HTMLElement>('[role="alert"]'));
    expect(alerts.length).toBeGreaterThan(0);
  });
});

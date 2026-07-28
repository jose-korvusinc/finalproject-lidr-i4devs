import { Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

type ShareState = 'idle' | 'copied' | 'error';

@Component({
  selector: 'app-admin-layout',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './admin-layout.html',
  styleUrl: './admin-layout.scss',
})
export class AdminLayout {
  readonly bookingUrl =
    typeof window === 'undefined' ? '/booking' : `${window.location.origin}/booking`;
  readonly shareState = signal<ShareState>('idle');

  async copyBookingUrl(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.bookingUrl);
      this.shareState.set('copied');
    } catch {
      this.shareState.set('error');
    }
  }
}

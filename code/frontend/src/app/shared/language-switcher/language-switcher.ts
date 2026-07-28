import { Component, LOCALE_ID, inject } from '@angular/core';

@Component({
  selector: 'app-language-switcher',
  templateUrl: './language-switcher.html',
  styleUrl: './language-switcher.scss',
})
export class LanguageSwitcher {
  private readonly localeId = inject(LOCALE_ID);
  readonly activeLocale = this.localeId.toLowerCase().startsWith('en') ? 'en' : 'es';
}

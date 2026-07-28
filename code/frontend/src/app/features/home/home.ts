import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { registrationUrl } from '../../core/registration-host';
import { LanguageSwitcher } from '../../shared/language-switcher/language-switcher';

@Component({
  selector: 'app-home',
  imports: [RouterLink, LanguageSwitcher],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  readonly currentYear = new Date().getFullYear();
  readonly registerHref =
    typeof window === 'undefined' ? '/register' : registrationUrl(window.location.hostname);
}

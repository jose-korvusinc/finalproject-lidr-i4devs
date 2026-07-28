import { CanMatchFn } from '@angular/router';
import { isRegistrationHost } from './registration-host';

export const registrationHostGuard: CanMatchFn = () =>
  typeof window !== 'undefined' && isRegistrationHost(window.location.hostname);

import { Component, computed, inject, output, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { email, form, FormField, pattern, required } from '@angular/forms/signals';
import { debounceTime, distinctUntilChanged, map, of, startWith, switchMap } from 'rxjs';
import { TenantRegistrationApi } from './tenant-registration.api';

export interface TenantRegistrationModel {
  name: string;
  ownerEmail: string;
  subdomain: string;
}

export type SubdomainStatus = 'idle' | 'checking' | 'available' | 'taken';

const SUBDOMAIN_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

@Component({
  selector: 'app-tenant-registration',
  imports: [FormField],
  templateUrl: './tenant-registration.html',
  styleUrl: './tenant-registration.scss',
})
export class TenantRegistration {
  private readonly api = inject(TenantRegistrationApi);

  readonly model = signal<TenantRegistrationModel>({ name: '', ownerEmail: '', subdomain: '' });

  readonly form = form(this.model, (path) => {
    required(path.name);
    required(path.ownerEmail);
    email(path.ownerEmail);
    required(path.subdomain);
    pattern(path.subdomain, SUBDOMAIN_PATTERN);
  });

  readonly subdomainStatus = toSignal(
    toObservable(computed(() => this.model().subdomain)).pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap((subdomain) => {
        if (!SUBDOMAIN_PATTERN.test(subdomain)) {
          return of<SubdomainStatus>('idle');
        }
        return this.api.checkSubdomain(subdomain).pipe(
          map((available): SubdomainStatus => (available ? 'available' : 'taken')),
          startWith<SubdomainStatus>('checking'),
        );
      }),
    ),
    { initialValue: 'idle' as SubdomainStatus },
  );

  readonly createDisabled = computed(
    () =>
      this.form().invalid() ||
      this.subdomainStatus() === 'checking' ||
      this.subdomainStatus() === 'taken',
  );

  readonly submitted = output<TenantRegistrationModel>();
  readonly cancelled = output<void>();

  create(): void {
    if (this.form().invalid()) {
      return;
    }
    this.submitted.emit(this.model());
  }

  cancel(): void {
    this.cancelled.emit();
  }
}

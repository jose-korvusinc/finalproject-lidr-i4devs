import { Component, output, signal } from '@angular/core';
import { email, form, FormField, pattern, required } from '@angular/forms/signals';

export interface TenantRegistrationModel {
  name: string;
  ownerEmail: string;
  subdomain: string;
}

const SUBDOMAIN_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

@Component({
  selector: 'app-tenant-registration',
  imports: [FormField],
  templateUrl: './tenant-registration.html',
  styleUrl: './tenant-registration.scss',
})
export class TenantRegistration {
  readonly model = signal<TenantRegistrationModel>({ name: '', ownerEmail: '', subdomain: '' });

  readonly form = form(this.model, (path) => {
    required(path.name);
    required(path.ownerEmail);
    email(path.ownerEmail);
    required(path.subdomain);
    pattern(path.subdomain, SUBDOMAIN_PATTERN);
  });

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

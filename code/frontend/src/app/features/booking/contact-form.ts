import { Component, computed, input, linkedSignal, output } from '@angular/core';
import { email, form, FormField, pattern, required } from '@angular/forms/signals';
import { BookingCustomer } from './booking.api';

const PHONE_PATTERN = /^\+?[0-9][0-9\s-]{5,}$/;

interface ContactModel {
  name: string;
  email: string;
  phone: string;
}

function toModel(seed: BookingCustomer | null | undefined): ContactModel {
  return {
    name: seed?.name ?? '',
    email: seed?.email ?? '',
    phone: seed?.phone ?? '',
  };
}

@Component({
  selector: 'app-contact-form',
  imports: [FormField],
  templateUrl: './contact-form.html',
  styleUrl: './contact-form.scss',
})
export class ContactForm {
  readonly initialContact = input<BookingCustomer | null>();

  readonly model = linkedSignal<ContactModel>(() => toModel(this.initialContact()));

  readonly form = form(this.model, (path) => {
    required(path.name);
    required(path.email);
    email(path.email);
    required(path.phone);
    pattern(path.phone, PHONE_PATTERN);
  });

  readonly saveDisabled = computed<boolean>(() => this.form().invalid());

  readonly confirmed = output<BookingCustomer>();

  onConfirm(): void {
    if (this.form().invalid()) {
      return;
    }
    const value = this.model();
    this.confirmed.emit({
      name: value.name,
      email: value.email,
      phone: value.phone,
    });
  }
}

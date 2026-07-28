import { Component, computed, inject, signal } from '@angular/core';
import { email, form, FormField, minLength, required } from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';

export interface LoginModel {
  email: string;
  password: string;
}

const PASSWORD_MIN_LENGTH = 8;

@Component({
  selector: 'app-login',
  imports: [FormField, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private readonly router = inject(Router);

  readonly passwordMinLength = PASSWORD_MIN_LENGTH;

  readonly model = signal<LoginModel>({ email: '', password: '' });

  readonly form = form(this.model, (path) => {
    required(path.email);
    email(path.email);
    required(path.password);
    minLength(path.password, PASSWORD_MIN_LENGTH);
  });

  readonly submitDisabled = computed(() => this.form().invalid());

  submit(): void {
    if (this.form().invalid()) {
      this.form.email().markAsTouched();
      this.form.password().markAsTouched();
      return;
    }
    void this.router.navigate(['/admin/schedule']);
  }
}

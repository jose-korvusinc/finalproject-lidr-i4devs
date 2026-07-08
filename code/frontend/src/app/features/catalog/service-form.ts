import { Component, computed, input, linkedSignal, output } from '@angular/core';
import { form, FormField, pattern, required, validate } from '@angular/forms/signals';
import { CreateServicePayload, Service } from './catalog.api';

const PRICE_PATTERN = /^\d+(\.\d{1,2})?$/;

interface ServiceModel {
  name: string;
  price: string;
  durationMinutes: number | null;
}

function toModel(seed: Service | null | undefined): ServiceModel {
  return {
    name: seed?.name ?? '',
    price: seed?.price ?? '',
    durationMinutes: seed?.durationMinutes ?? null,
  };
}

@Component({
  selector: 'app-service-form',
  imports: [FormField],
  templateUrl: './service-form.html',
  styleUrl: './service-form.scss',
})
export class ServiceForm {
  readonly initialService = input<Service | null>();
  readonly services = input<Service[]>([]);

  readonly model = linkedSignal<ServiceModel>(() => toModel(this.initialService()));

  readonly form = form(this.model, (path) => {
    required(path.name);
    required(path.price);
    pattern(path.price, PRICE_PATTERN);
    required(path.durationMinutes);
    validate(path.durationMinutes, (ctx) => {
      const value = ctx.value();
      if (value === null || !Number.isInteger(value) || value <= 0) {
        return { kind: 'positiveInteger' };
      }
      return null;
    });
  });

  readonly saveDisabled = computed<boolean>(() => this.form().invalid());

  readonly save = output<CreateServicePayload>();
  readonly edit = output<Service>();
  readonly deactivate = output<Service>();

  onSave(): void {
    if (this.form().invalid()) {
      return;
    }
    const value = this.model();
    this.save.emit({
      name: value.name,
      price: value.price,
      durationMinutes: value.durationMinutes as number,
    });
  }

  onEdit(service: Service): void {
    this.edit.emit(service);
  }

  onDeactivate(service: Service): void {
    this.deactivate.emit(service);
  }
}

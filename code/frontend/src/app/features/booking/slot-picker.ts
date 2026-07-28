import { DatePipe } from '@angular/common';
import { Component, input, model, output } from '@angular/core';
import { AvailabilitySlot } from './booking.api';

@Component({
  selector: 'app-slot-picker',
  templateUrl: './slot-picker.html',
  styleUrl: './slot-picker.scss',
  imports: [DatePipe],
})
export class SlotPicker {
  readonly slots = input<AvailabilitySlot[]>([]);
  readonly loading = input<boolean>(false);
  readonly error = input<boolean>(false);
  readonly date = model<string>('');
  readonly slotChosen = output<AvailabilitySlot>();

  onDateChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.date.set(target.value);
  }

  chooseSlot(slot: AvailabilitySlot): void {
    this.slotChosen.emit(slot);
  }
}

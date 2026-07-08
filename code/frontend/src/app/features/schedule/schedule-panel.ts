import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ScheduleForm } from './schedule-form';
import { ScheduleApi, WeeklyScheduleDay } from './schedule.api';

type LoadState = 'loading' | 'ready' | 'error';
type SaveState = 'idle' | 'saving' | 'saved' | 'error';

@Component({
  selector: 'app-schedule-panel',
  imports: [ScheduleForm],
  templateUrl: './schedule-panel.html',
  styleUrl: './schedule-panel.scss',
})
export class SchedulePanel {
  private readonly api = inject(ScheduleApi);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly loadState = signal<LoadState>('loading');
  protected readonly saveState = signal<SaveState>('idle');
  protected readonly days = signal<WeeklyScheduleDay[]>([]);

  constructor() {
    this.api
      .getSchedule()
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (days) => {
          this.days.set(days);
          this.loadState.set('ready');
        },
        error: () => this.loadState.set('error'),
      });
  }

  onSave(days: WeeklyScheduleDay[]): void {
    this.saveState.set('saving');
    this.api
      .saveSchedule(days)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (saved) => {
          this.days.set(saved);
          this.saveState.set('saved');
        },
        error: () => this.saveState.set('error'),
      });
  }
}

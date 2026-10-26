import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { checkMapText, MapReport } from './check/map-checker';
import { ALLOWED_NOTES, MAP_RULES } from './check/map-rules';

@Component({
  selector: 'app-root',
  imports: [
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatDividerModule,
    MatExpansionModule,
    MatIconModule,
    MatProgressBarModule,
    MatToolbarModule,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly snackBar = inject(MatSnackBar);

  protected readonly rules = MAP_RULES;
  protected readonly allowedNotes = ALLOWED_NOTES;
  protected readonly reports = signal<MapReport[]>([]);
  protected readonly busy = signal(false);
  protected readonly dragOver = signal(false);

  protected passedCount(): number {
    return this.reports().filter((report) => report.passed).length;
  }

  protected failedCount(): number {
    return this.reports().length - this.passedCount();
  }

  protected issueCount(): number {
    return this.reports().reduce((total, report) => total + report.violations.length, 0);
  }

  protected hitsFor(report: MapReport, ruleId: number) {
    return report.violations.filter((violation) => violation.rule === ruleId);
  }

  protected onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragOver.set(true);
  }

  protected onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.dragOver.set(false);
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragOver.set(false);
    void this.readFiles(event.dataTransfer?.files ?? null);
  }

  protected onPick(files: FileList | null, input: HTMLInputElement): void {
    void this.readFiles(files);
    input.value = '';
  }

  protected clearResults(): void {
    if (this.reports().length === 0) {
      return;
    }

    this.reports.set([]);
    this.notify('Cleared the results.', 'note');
  }

  protected displayName(name: string): string {
    const trimmed = name.trim();
    return trimmed.length === 0 ? 'Unnamed' : trimmed;
  }

  private async readFiles(list: FileList | null): Promise<void> {
    const files = list === null ? [] : Array.from(list);
    if (files.length === 0) {
      return;
    }

    const maps = files.filter((file) => file.name.toLowerCase().endsWith('.txt'));
    const skipped = files.length - maps.length;
    if (maps.length === 0) {
      this.notify(
        skipped > 0
          ? 'Those files are not .txt maps. Choose one or more .txt map files.'
          : 'Choose one or more .txt map files.',
        'note',
      );
      return;
    }

    this.busy.set(true);
    try {
      const next = [...this.reports()];
      let replaced = 0;
      let skippedScale = 0;
      let emptyMaps = 0;
      const checked: MapReport[] = [];

      for (const file of maps) {
        let text: string;
        try {
          text = await file.text();
        } catch {
          this.notify(`Could not read ${file.name}.`, 'fail');
          continue;
        }

        const report = checkMapText(file.name, text);
        checked.push(report);
        skippedScale += report.skippedScale;
        if (report.sceneObjects === 0) {
          emptyMaps++;
        }

        const index = next.findIndex((item) => item.fileName.toLowerCase() === report.fileName.toLowerCase());
        if (index >= 0) {
          next[index] = report;
          replaced++;
        } else {
          next.push(report);
        }
      }

      this.reports.set(next);
      if (checked.length === 0) {
        return;
      }

      const passed = checked.filter((report) => report.passed).length;
      const failed = checked.length - passed;
      const notes = [
        `Checked ${checked.length} ${checked.length === 1 ? 'map' : 'maps'}. ${passed} passed, ${failed} failed.`,
      ];
      if (skipped > 0) {
        notes.push(skipped === 1 ? 'Skipped 1 file that is not a .txt map.' : `Skipped ${skipped} non-txt files.`);
      }
      if (replaced > 0) {
        notes.push(replaced === 1 ? 'Replaced 1 earlier result.' : `Replaced ${replaced} earlier results.`);
      }
      if (emptyMaps > 0) {
        notes.push(emptyMaps === 1 ? '1 file has no scene objects.' : `${emptyMaps} files have no scene objects.`);
      }
      if (skippedScale > 0) {
        notes.push(
          skippedScale === 1
            ? 'Skipped 1 object with an unreadable scale.'
            : `Skipped ${skippedScale} objects with an unreadable scale.`,
        );
      }
      this.notify(notes.join(' '), failed > 0 ? 'fail' : 'pass');
    } finally {
      this.busy.set(false);
    }
  }

  private notify(message: string, tone: 'pass' | 'fail' | 'note'): void {
    this.snackBar.open(message, 'Dismiss', {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'bottom',
      panelClass: `mc-snack-${tone}`,
    });
  }
}

import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'durationTranslate',
    standalone: true,
})
export class DurationTranslatePipe implements PipeTransform {
    transform(value: number | null | undefined): string {
        if (value == null || value < 0) {
            return '';
        }

        const totalSeconds = Math.floor(value);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;

        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
}

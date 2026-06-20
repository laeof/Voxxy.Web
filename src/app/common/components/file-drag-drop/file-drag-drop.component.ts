import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, forwardRef, Input, Output, ViewChild } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';

export interface AudioFileItem {
    id: string;
    file: File;
    name: string;
    size: number;
    duration: number;
    durationText: string;
    objectUrl: string;
}

@Component({
    selector: 'app-file-drag-drop',
    standalone: true,
    templateUrl: './file-drag-drop.component.html',
    styleUrl: './file-drag-drop.component.scss',
    imports: [CommonModule, MatIcon, TranslatePipe],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => FileDragDropComponent),
            multi: true,
        },
    ],
})
export class FileDragDropComponent implements ControlValueAccessor {
    @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

    @Input() fileFormats: string = '';
    @Input() title: string = '';
    @Input() subtitle: string = '';
    @Input() disabled: boolean = false;
    @Input() showFileList: boolean = false;

    @Output() filesChanged = new EventEmitter<AudioFileItem[]>();

    files: AudioFileItem[] = [];
    isDragging = false;
    isLoading = false;
    errorMessage = '';

    private onChange: (files: AudioFileItem[]) => void = () => { };

    private onTouched: () => void = () => {};

    writeValue(value: AudioFileItem[]): void {
        this.files = value ?? [];
    }

    registerOnChange(fn: (value: AudioFileItem[]) => void): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: () => void): void {
        this.onTouched = fn;
    }

    setDisabledState(isDisabled: boolean): void {
        this.disabled = isDisabled;
    }

    onBlur(): void {
        this.onTouched();
    }

    openFileDialog(): void {
        this.fileInput.nativeElement.click();
    }

    async onInputChange(event: Event): Promise<void> {
        const input = event.target as HTMLInputElement;
        const files = Array.from(input.files ?? []);

        await this.handleFiles(files);

        input.value = '';
    }

    onDragOver(event: DragEvent): void {
        event.preventDefault();
        event.stopPropagation();

        this.isDragging = true;
    }

    onDragLeave(event: DragEvent): void {
        event.preventDefault();
        event.stopPropagation();

        this.isDragging = false;
    }

    async onDrop(event: DragEvent): Promise<void> {
        event.preventDefault();
        event.stopPropagation();

        this.isDragging = false;

        const files = Array.from(event.dataTransfer?.files ?? []);
        await this.handleFiles(files);
    }

    removeFile(item: AudioFileItem, event: MouseEvent): void {
        event.stopPropagation();

        URL.revokeObjectURL(item.objectUrl);

        this.files = this.files.filter((x) => x !== item);
        this.onChange(this.files);
        this.filesChanged.emit(this.files);
    }

    clear(): void {
        this.files.forEach((file) => URL.revokeObjectURL(file.objectUrl));
        this.files = [];
        this.onChange(this.files);
        this.filesChanged.emit(this.files);
    }

    private async handleFiles(files: File[]): Promise<void> {
        this.errorMessage = '';

        if (!files.length) {
            return;
        }

        const audioFiles = files.filter((file) => file.type.startsWith('audio/'));

        if (audioFiles.length !== files.length) {
            this.errorMessage = 'Можно загружать только музыкальные файлы.';
        }

        if (!audioFiles.length) {
            return;
        }

        this.isLoading = true;

        try {
            const mappedFiles = await Promise.all(
                audioFiles.map((file) => this.createAudioFileItem(file)),
            );

            this.files = [...this.files, ...mappedFiles];
            this.onChange(this.files);
            this.filesChanged.emit(this.files);
        } finally {
            this.isLoading = false;
        }
    }

    private createAudioFileItem(file: File): Promise<AudioFileItem> {
        return new Promise((resolve, reject) => {
            const objectUrl = URL.createObjectURL(file);
            const audio = new Audio();

            audio.preload = 'metadata';
            audio.src = objectUrl;

            audio.onloadedmetadata = () => {
                const duration = Number.isFinite(audio.duration) ? audio.duration : 0;

                resolve({
                    id: crypto.randomUUID(),
                    file,
                    name: file.name,
                    size: file.size,
                    duration,
                    durationText: this.formatDuration(duration),
                    objectUrl,
                });
            };

            audio.onerror = () => {
                URL.revokeObjectURL(objectUrl);
                reject(new Error(`Не удалось прочитать файл: ${file.name}`));
            };
        });
    }

    private formatDuration(seconds: number): string {
        const totalSeconds = Math.floor(seconds);

        const minutes = Math.floor(totalSeconds / 60);
        const restSeconds = totalSeconds % 60;

        return `${minutes}:${restSeconds.toString().padStart(2, '0')}`;
    }
}

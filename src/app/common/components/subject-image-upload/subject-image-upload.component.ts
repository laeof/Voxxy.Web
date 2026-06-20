import { Component, ElementRef, forwardRef, Input, ViewChild } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';

export interface ImageFileItem {
    file: File;
    name: string;
    size: number;
    objectUrl: string;
}

@Component({
    selector: 'app-subject-image-upload',
    templateUrl: './subject-image-upload.component.html',
    styleUrl: './subject-image-upload.component.scss',
    imports: [MatIcon],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => SubjectImageUploadComponent),
            multi: true,
        },
    ],
})
export class SubjectImageUploadComponent implements ControlValueAccessor {
    @ViewChild('coverInput') coverInput!: ElementRef<HTMLInputElement>;

    @Input() titleText: string = '';
    @Input() subtitleText: string = '';
    @Input() disabled: boolean = false;

    errorMessage: string = '';
    isLoading: boolean = false;

    file: ImageFileItem | null = null;

    private onChange: (value: ImageFileItem | null) => void = () => {};
    private onTouched: () => void = () => {};

    writeValue(value: ImageFileItem | null): void {
        this.file = value;
    }

    registerOnChange(fn: (value: ImageFileItem | null) => void): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: () => void): void {
        this.onTouched = fn;
    }

    setDisabledState(isDisabled: boolean): void {
        this.disabled = isDisabled;
    }

    async onInputChange(event: Event): Promise<void> {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0] ?? null;

        await this.handleFile(file);

        input.value = '';

        this.onTouched();
    }

    async removeImage(): Promise<void> {
        if (this.file?.objectUrl) {
            URL.revokeObjectURL(this.file.objectUrl);
        }

        this.file = null;
        this.onChange(null);
        this.onTouched();
    }

    private async handleFile(file: File | null): Promise<void> {
        this.errorMessage = '';

        if (!file) {
            return;
        }

        const imageFile = file.type.startsWith('image/') ? file : null;

        if (!imageFile) {
            this.errorMessage = 'You can only upload images.';
            return;
        }

        this.isLoading = true;

        try {
            const mappedFile = await Promise.all(
                [imageFile].map((file) => this.createImageFileItem(file)),
            );

            this.file = mappedFile[0];
            this.onChange(mappedFile[0]);
        } finally {
            this.isLoading = false;
        }
    }

    private createImageFileItem(file: File): Promise<ImageFileItem> {
        return new Promise((resolve, reject) => {
            const objectUrl = URL.createObjectURL(file);
            const img = new Image();

            img.onload = () => {
                resolve({
                    file,
                    name: file.name,
                    size: file.size,
                    objectUrl,
                });
            };

            img.onerror = () => {
                URL.revokeObjectURL(objectUrl);
                reject(new Error(`Failed to read file: ${file.name}`));
            };

            img.src = objectUrl;
        });
    }
}

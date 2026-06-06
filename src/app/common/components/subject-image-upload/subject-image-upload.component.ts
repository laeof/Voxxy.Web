import { Component, ElementRef, Input, ViewChild } from '@angular/core';
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
})
export class SubjectImageUploadComponent {
    @ViewChild('coverInput') coverInput!: ElementRef<HTMLInputElement>;

    @Input() titleText: string = '';
    @Input() subtitleText: string = '';

    errorMessage: string = '';
    isLoading: boolean = false;

    file: ImageFileItem | null = null;

    async onInputChange(event: Event): Promise<void> {
        const input = event.target as HTMLInputElement;
        const file = input.files ? input.files[0] : null;

        await this.handleFile(file);

        input.value = '';
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
            console.log(this.file);
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

import { NgClass } from '@angular/common';
import { Component, ElementRef, forwardRef, Input, ViewChild } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';

@Component({
    selector: 'app-subject-date',
    templateUrl: './subject-date.component.html',
    styleUrl: './subject-date.component.scss',
    imports: [NgClass, MatIcon],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => SubjectDateComponent),
            multi: true,
        },
    ],
})
export class SubjectDateComponent implements ControlValueAccessor {
    @Input() titleText: string = '';
    @Input() mandatory: boolean = false;
    @Input() readonly: boolean = false;
    @Input() minDate: string = new Date().toISOString().split('T')[0];
    @Input() disabled: boolean = false;
    @Input() id = `subject-date-${crypto.randomUUID()}`;

    @ViewChild('dateInput') dateInput!: ElementRef<HTMLInputElement>;

    date: string = '';

    private onChange: (value: string | null) => void = () => {};
    private onTouched: () => void = () => {};

    onDateClick(): void {
        if (this.readonly) {
            return;
        }

        this.dateInput.nativeElement.showPicker();
    }

    onInputChange(value: string): void {
        this.date = value;
        this.onChange(value);
    }

    writeValue(value: string | null): void {
        this.date = value ?? '';
    }

    registerOnChange(fn: (value: string | null) => void): void {
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
}

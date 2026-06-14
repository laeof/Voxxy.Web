import { NgClass } from '@angular/common';
import { Component, EventEmitter, forwardRef, Input, Output } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
    selector: 'app-subject-input',
    templateUrl: './subject-input.component.html',
    styleUrls: ['./subject-input.component.scss'],
    imports: [NgClass],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => SubjectInputComponent),
            multi: true,
        },
    ],
})
export class SubjectInputComponent implements ControlValueAccessor {
    @Input() labelText: string = '';
    @Input() placeholder: string = '';
    @Input() mandatory: boolean = false;
    @Input() readonly: boolean = false;
    @Input() disabled: boolean = false;
    @Input() id = `subject-input-${crypto.randomUUID()}`;

    value: string = '';

    private onChange: (value: string) => void = () => {};
    private onTouched: () => void = () => {};

    writeValue(value: string | null): void {
        this.value = value ?? '';
    }

    registerOnChange(fn: (value: string) => void): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: () => void): void {
        this.onTouched = fn;
    }

    setDisabledState(isDisabled: boolean): void {
        this.disabled = isDisabled;
    }

    onInputChange(value: string): void {
        this.value = value;
        this.onChange(value);
    }

    onBlur(): void {
        this.onTouched();
    }
}

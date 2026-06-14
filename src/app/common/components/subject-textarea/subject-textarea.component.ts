import { Component, forwardRef, Input } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
    selector: 'app-subject-textarea',
    templateUrl: './subject-textarea.component.html',
    styleUrls: ['./subject-textarea.component.scss'],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => SubjectTextareaComponent),
            multi: true,
        },
    ],
})
export class SubjectTextareaComponent implements ControlValueAccessor {
    @Input() labelText: string = '';
    @Input() placeholder: string = '';
    @Input() content: string = '';
    @Input() readonly: boolean = false;
    @Input() disabled: boolean = false;
    @Input() id = `subject-textarea-${crypto.randomUUID()}`;

    private onChange: (value: string) => void = () => {};
    private onTouched: () => void = () => {};

    writeValue(value: string | null): void {
        this.content = value ?? '';
    }

    registerOnChange(fn: (value: string) => void): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: () => void): void {
        this.onTouched = fn;
    }

    onInputChange(value: string): void {
        this.content = value;
        this.onChange(value);
    }

    onBlur(): void {
        this.onTouched();
    }
}

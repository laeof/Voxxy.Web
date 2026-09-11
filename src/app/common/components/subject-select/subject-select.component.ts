import { NgClass } from '@angular/common';
import { Component, Input, Output, EventEmitter, HostListener, forwardRef } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { SeparatorComponent } from '../separator/separator.component';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { createUuid } from '@common/helpers/uuid.helper';

export interface SubjectSelectOption {
    id: string;
    title: string;
}

@Component({
    selector: 'app-subject-select',
    templateUrl: './subject-select.component.html',
    styleUrl: './subject-select.component.scss',
    imports: [MatIcon, NgClass, SeparatorComponent],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => SubjectSelectComponent),
            multi: true,
        },
    ],
})
export class SubjectSelectComponent implements ControlValueAccessor {
    @Input() subjectOptions: SubjectSelectOption[] = [];
    @Input() selectedSubjects: SubjectSelectOption[] = [];
    @Input() titleText: string = '';
    @Input() placeholder: string = '';
    @Input() multiple: boolean = false;
    @Input() mandatory: boolean = false;
    @Input() readonlyInput: boolean = false;
    @Input() readonly: boolean = false;
    @Input() disabled: boolean = false;
    @Input() id = `subject-select-${createUuid()}`;

    @Output() searchChange = new EventEmitter<string>();

    searchResultsShown: boolean = false;
    searchInputFocused: boolean = false;

    private onChange: (value: SubjectSelectOption[]) => void = () => {};
    private onTouched: () => void = () => {};

    writeValue(value: SubjectSelectOption[] | null): void {
        this.selectedSubjects = value ?? [];
    }

    registerOnChange(fn: (value: SubjectSelectOption[]) => void): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: () => void): void {
        this.onTouched = fn;
    }

    setDisabledState(isDisabled: boolean): void {
        this.disabled = isDisabled;
    }

    onSearchChange(value: string): void {
        const trimmed = value.trim();

        this.searchChange.emit(trimmed);
        this.searchResultsShown = trimmed.length > 0;
    }

    onSubjectChange(value: SubjectSelectOption): void {
        if (this.readonly || this.disabled) {
            return;
        }

        if (this.selectedSubjects.some((v) => v.id === value.id)) {
            return;
        }

        const newSelectedSubjects = this.multiple ? [...this.selectedSubjects, value] : [value];

        this.selectedSubjects = newSelectedSubjects;
        this.onChange(newSelectedSubjects);
        this.onTouched();

        if (!this.multiple) {
            this.searchResultsShown = false;
        }
    }

    onSubjectRemove(value: SubjectSelectOption): void {
        if (this.readonly || this.disabled) {
            return;
        }

        const newSelectedSubjects = this.selectedSubjects.filter((v) => v.id !== value.id);

        this.selectedSubjects = newSelectedSubjects;
        this.onChange(newSelectedSubjects);
        this.onTouched();
    }

    onFocusOut(): void {
        this.searchInputFocused = false;
    }

    onFocusOutWithKeyboard($event: KeyboardEvent): void {
        if ($event.key === 'Escape') {
            this.searchResultsShown = false;
            this.searchInputFocused = false;
        }
    }

    onFocusInWithClick(): void {
        if (this.subjectOptions.length > 0) this.searchResultsShown = true;
    }

    onFocus(): void {
        this.searchInputFocused = true;
    }

    @HostListener('document:mousedown', ['$event'])
    onMouseDown(event: MouseEvent) {
        const target = event.target as HTMLElement;

        if (target.closest('app-subject-select')) {
            return;
        }

        this.searchResultsShown = false;
    }
}

import { Component, Input } from "@angular/core";

@Component({
    selector: "app-subject-input",
    templateUrl: "./subject-input.component.html",
    styleUrls: ["./subject-input.component.scss"],
})
export class SubjectInputComponent {
    @Input() labelText: string = '';
    @Input() placeholder: string = '';
    @Input() content: string = '';
}
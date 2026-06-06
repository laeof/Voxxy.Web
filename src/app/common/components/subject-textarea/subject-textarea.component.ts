import { Component, Input } from "@angular/core";

@Component({
    selector: "app-subject-textarea",
    templateUrl: "./subject-textarea.component.html",
    styleUrls: ["./subject-textarea.component.scss"],
})
export class SubjectTextareaComponent {
    @Input() labelText: string = '';
    @Input() placeholder: string = '';
    @Input() content: string = '';
}
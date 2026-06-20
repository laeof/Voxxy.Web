import { Component, Input } from "@angular/core";
import { PhotoViewerComponent } from "../photo-viewer/photo-viewer.component";
import { MatInputModule } from "@angular/material/input";

@Component({
    selector: 'app-manager',
    standalone: true,
    templateUrl: './manager.component.html',
    styleUrl: './manager.component.scss',
    imports: [PhotoViewerComponent, MatInputModule],
})
export class ManagerComponent {
    @Input() subjectImageUrl: string | undefined = undefined;
    @Input() subjectName: string | undefined = undefined;
    @Input() subjectImageRadius: string | undefined = undefined;

    photoViewerOpened: boolean = false;

    openPhotoViewer(): void {
        this.photoViewerOpened = true;
    }
}

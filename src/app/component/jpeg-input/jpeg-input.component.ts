import { ChangeDetectionStrategy, Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-jpeg-input',
  templateUrl: './jpeg-input.component.html',
  styleUrls: ['./jpeg-input.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JpegInputComponent {
  @Output() fileSelected = new EventEmitter<File | undefined>();
}

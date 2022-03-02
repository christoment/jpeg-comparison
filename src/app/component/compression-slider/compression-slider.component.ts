import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

function clamp(value: number, option?: { min?: number, max?: number }): number {
  const effMin = option?.min ?? 0;
  const effMax = option?.max ?? 100;

  if (value < effMin) {
    return effMin;
  }
  if (value > effMax) {
    return effMax;
  }

  return value;
}

@Component({
  selector: 'app-compression-slider',
  templateUrl: './compression-slider.component.html',
  styleUrls: ['./compression-slider.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompressionSliderComponent {
  @Input() value: number = 0;
  @Output() valueChange = new EventEmitter<number>();

  jpegCompressionChange(rangeValue: string): void {
    this.value = Number(rangeValue);
    const valueInNumber = clamp(this.value, { max: 1, min: 0 });
    this.valueChange.emit(valueInNumber);
  }
}

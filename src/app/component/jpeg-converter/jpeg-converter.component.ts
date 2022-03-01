import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { debounceTime, map, Observable, Subject, switchMap, takeUntil } from 'rxjs';

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
  selector: 'app-jpeg-converter',
  templateUrl: './jpeg-converter.component.html',
  styleUrls: ['./jpeg-converter.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JpegConverterComponent implements OnInit, OnDestroy {
  rangeValue = 50;

  imageUrl?: SafeUrl;
  compressedUrl?: SafeUrl;
  beforeImageSize = '-';
  afterImageSize = '-';

  private canvasContext!: CanvasRenderingContext2D;
  private compressionValueChange$ = new Subject<number>();
  private ngDestroy$ = new Subject<void>();

  @Input() set blob(value: Blob | null) {
    if (value) {
      this.imageUrl = this.sanitiser.bypassSecurityTrustResourceUrl(URL.createObjectURL(value));

      this.beforeImage.nativeElement.onload = () => {
        this.beforeImageSize = this.convertToClosestSize(value.size);

        this.afterImage.nativeElement.width = this.beforeImage.nativeElement.width;
        this.afterImage.nativeElement.height = this.beforeImage.nativeElement.height;
        this.jpegCompressionChange('50');

        this.beforeImage.nativeElement.onload = null;
        this.cdr.markForCheck();
      }
    }
  }

  @ViewChild('beforeImage', { static: true }) beforeImage!: ElementRef<HTMLImageElement>;
  @ViewChild('afterImage', { static: true }) afterImage!: ElementRef<HTMLCanvasElement>;

  constructor(
    private sanitiser: DomSanitizer,
    private cdr: ChangeDetectorRef,
  ) {}

  jpegCompressionChange(rangeValue: string): void {
    this.rangeValue = Number(rangeValue);
    const valueInNumber = clamp(this.rangeValue / 100.0);
    this.compressionValueChange$.next(valueInNumber);
  }

  ngOnInit(): void {
    this.canvasContext = this.afterImage.nativeElement.getContext('2d', { alpha: false })!;

    this.compressionValueChange$.asObservable().pipe(
      debounceTime(250),
      switchMap((compressionRatio) => {
        const { height, width } = this.beforeImage.nativeElement;
        this.canvasContext.drawImage(this.beforeImage.nativeElement, 0, 0, width, height);
        return new Observable<{ dataUrl: SafeUrl | string, fileSize: number }>((subscriber) => {
          this.canvasContext.canvas.toBlob((blob) => {
            const blobUrl = blob
             ? this.sanitiser.bypassSecurityTrustResourceUrl(URL.createObjectURL(blob))
             : '';
            subscriber.next({ dataUrl: blobUrl, fileSize: blob?.size ?? 0 });
            subscriber.complete();
          }, 'image/jpeg', compressionRatio);
        })
      }),
      takeUntil(this.ngDestroy$),
    ).subscribe(({ dataUrl, fileSize }) => {
      this.afterImageSize = this.convertToClosestSize(fileSize);
      this.compressedUrl = dataUrl;
      this.cdr.detectChanges();
    });
  }

  ngOnDestroy(): void {
    this.ngDestroy$.next();
    this.ngDestroy$.complete();
  }

  private convertToClosestSize(value: number): string {
    const divider = 1024.0;
    let level = 0;
    let quotient = value;

    const levelMap: Record<number, string> = {
      0: 'B',
      1: 'kB',
      2: 'MB',
      3: 'GB',
      4: 'TB',
    };
    
    do {
      level += 1;
      quotient = value / divider;
    } while (quotient > divider);

    const integerQuotient = Math.floor(quotient);
    const remainder = (quotient - integerQuotient) * 100;

    return `${integerQuotient}.${remainder.toFixed(0)}${levelMap[level] ?? ''}`
  }
}

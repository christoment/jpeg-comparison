import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { BehaviorSubject, debounceTime, map, Observable, Subject, switchMap, takeUntil } from 'rxjs';

@Component({
  selector: 'app-jpeg-converter',
  templateUrl: './jpeg-converter.component.html',
  styleUrls: ['./jpeg-converter.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JpegConverterComponent implements OnInit, OnDestroy {
  imageUrl?: SafeUrl;
  compressedUrl?: SafeUrl;

  beforeImageSize = '-';
  beforeImageSizeInB = 0;
  afterImageSize = '-';
  afterImageSizeInB = 0;

  private canvasContext!: CanvasRenderingContext2D;
  private compressionValueChange$ = new BehaviorSubject<number>(0);
  private ngDestroy$ = new Subject<void>();

  @Input() set blob(value: Blob | null) {
    if (value) {
      this.imageUrl = this.sanitiser.bypassSecurityTrustResourceUrl(URL.createObjectURL(value));

      this.beforeImage.nativeElement.onload = () => {
        this.beforeImageSizeInB = value.size;
        this.beforeImageSize = this.convertToClosestSize(this.beforeImageSizeInB);

        this.afterImage.nativeElement.width = this.beforeImage.nativeElement.width;
        this.afterImage.nativeElement.height = this.beforeImage.nativeElement.height;
        this.compressionValueChange$.next(this.compressionValueChange$.value);

        this.beforeImage.nativeElement.onload = null;
        this.cdr.markForCheck();
      }
    }
  }
  @Input() set compressionRatio(value: number) {
    this.compressionValueChange$.next(value);
  }

  @ViewChild('beforeImage', { static: true }) beforeImage!: ElementRef<HTMLImageElement>;
  @ViewChild('afterImage', { static: true }) afterImage!: ElementRef<HTMLCanvasElement>;

  constructor(
    private sanitiser: DomSanitizer,
    private cdr: ChangeDetectorRef,
  ) {}

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
      this.afterImageSizeInB = fileSize;
      this.afterImageSize = this.convertToClosestSize(this.afterImageSizeInB);
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

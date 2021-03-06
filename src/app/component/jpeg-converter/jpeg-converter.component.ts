import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, HostListener, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import prettyBytes from 'pretty-bytes';
import { BehaviorSubject, debounceTime, Observable, Subject, switchMap, takeUntil } from 'rxjs';

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
  private refreshCanvas$ = new Subject<void>();
  private ngDestroy$ = new Subject<void>();

  @Input() set blob(value: Blob | null) {
    if (value) {
      this.imageUrl = this.sanitiser.bypassSecurityTrustResourceUrl(URL.createObjectURL(value));

      this.beforeImage.nativeElement.onload = (x) => {
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
  @ViewChild('beforeImagePreview', { static: true }) beforeImagePreview!: ElementRef<HTMLCanvasElement>;
  @ViewChild('afterImagePreview', { static: true }) afterImagePreview!: ElementRef<HTMLCanvasElement>;

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.refreshCanvas();
  }

  constructor(
    private sanitiser: DomSanitizer,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.canvasContext = this.afterImage.nativeElement.getContext('2d', { alpha: false })!;

    this.refreshCanvas$.asObservable().pipe(
      takeUntil(this.ngDestroy$),
    ).subscribe(() => {
      this.compressionValueChange$.next(this.compressionValueChange$.value);
    });

    this.compressionValueChange$.asObservable().pipe(
      debounceTime(100),
      switchMap((compressionRatio) => {
        const { height, width } = this.beforeImage.nativeElement;
        const { height: previewHeight, width: previewWidth } = this.beforeImagePreview.nativeElement;
        this.canvasContext.canvas.width = width;
        this.canvasContext.canvas.height = height;
        this.canvasContext.clearRect(0, 0, width, height);
        this.canvasContext.drawImage(this.beforeImage.nativeElement, 0, 0, width, height);

        this.afterImagePreview.nativeElement.width = previewWidth;
        this.afterImagePreview.nativeElement.height = previewHeight;
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

  public get imageSizeDiff(): number {
    if (this.beforeImageSizeInB <= 0) {
      return this.afterImageSizeInB;
    }

    return this.afterImageSizeInB / this.beforeImageSizeInB;
  }

  private refreshCanvas(): void {
    this.refreshCanvas$.next();
  }

  private convertToClosestSize(sizeInBytes: number): string {
    return prettyBytes(sizeInBytes, { maximumFractionDigits: 2, minimumFractionDigits: 2 });
  }
}

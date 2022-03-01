import { Component, Input, OnInit } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-jpeg-converter',
  templateUrl: './jpeg-converter.component.html',
  styleUrls: ['./jpeg-converter.component.scss']
})
export class JpegConverterComponent implements OnInit {
  imageUrl?: SafeUrl;

  @Input() set blob(value: Blob | null) {
    if (value) {
      this.imageUrl = this.sanitiser.bypassSecurityTrustResourceUrl(URL.createObjectURL(value));
    }
  }

  constructor(
    private sanitiser: DomSanitizer,
  ) { }

  ngOnInit(): void {
  }
}

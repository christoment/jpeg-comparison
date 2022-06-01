import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  blobFile: Blob | undefined;
  compressionRatio: number = 0.5;

  constructor(
    private http: HttpClient
  ) { }

  setBlobFile(targetFile: File | undefined) {
    if (targetFile) {
      this.blobFile = targetFile;
    }
  }

  compressionChange(compressionRate: number) {

  }

  ngOnInit(): void {
    // TODO: DEBUG
    this.http.get('assets/illustration-logo.png', {
      responseType: 'arraybuffer'
    }).subscribe(res => {
      this.blobFile = new Blob([res]);
    });
  }
}

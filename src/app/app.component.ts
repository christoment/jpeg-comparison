import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  blobFile: Blob | undefined;
  
  constructor(
    private http: HttpClient
    ) {}
    
    setBlobFile(files: FileList | null) {
      const targetFile = files?.[0];
      if (targetFile) {
        this.blobFile = targetFile;
      }
    }
    
  ngOnInit(): void {
    // TODO: DEBUG
    this.http.get('/assets/illustration-logo.png', {
      responseType: 'arraybuffer'
    }).subscribe(res => {
      this.blobFile = new Blob([res]);
    });
  }
}

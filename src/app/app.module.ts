import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { JpegConverterComponent } from './component/jpeg-converter/jpeg-converter.component';
import { JpegInputComponent } from './component/jpeg-input/jpeg-input.component';
import { CompressionSliderComponent } from './component/compression-slider/compression-slider.component';

@NgModule({
  declarations: [
    AppComponent,
    JpegConverterComponent,
    JpegInputComponent,
    CompressionSliderComponent
  ],
  imports: [
    BrowserModule,
    CommonModule,
    HttpClientModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }

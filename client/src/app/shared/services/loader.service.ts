import { Injectable } from '@angular/core';
import { NgxUiLoaderService } from 'ngx-ui-loader';

@Injectable({
  providedIn: 'root'
})
export class LoaderService {
  constructor(private ngxLoader: NgxUiLoaderService) {}

  /**
   * Start the global loader
   */
  start(): void {
    this.ngxLoader.start();
  }

  /**
   * Stop the global loader
   */
  stop(): void {
    this.ngxLoader.stop();
  }

  /**
   * Start a background loader with the given ID
   */
  startBackground(id: string = 'default-bg-loader'): void {
    this.ngxLoader.startBackground(id);
  }

  /**
   * Stop a background loader with the given ID
   */
  stopBackground(id: string = 'default-bg-loader'): void {
    this.ngxLoader.stopBackground(id);
  }

  /**
   * Stops all loaders (foreground and background)
   */
  stopAll(): void {
    this.ngxLoader.stopAll();
  }
}
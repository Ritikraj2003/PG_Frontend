import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

let loaderServiceInstance: LoaderService | null = null;

@Injectable({
  providedIn: 'root',
})
export class LoaderService {
  private activeRequests = 0;
  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  public isLoading$: Observable<boolean> = this.isLoadingSubject.asObservable();

  constructor() {
    loaderServiceInstance = this;
  }

  /**
   * Main loader controller function.
   * Call loader('start') to show the loader, loader('stop') to hide it.
   * Also accepts boolean true ('start') / false ('stop').
   */
  public loader(action: 'start' | 'stop' | boolean): void {
    if (action === 'start' || action === true) {
      this.activeRequests++;
      this.isLoadingSubject.next(true);
    } else if (action === 'stop' || action === false) {
      this.activeRequests = Math.max(0, this.activeRequests - 1);
      if (this.activeRequests === 0) {
        this.isLoadingSubject.next(false);
      }
    }
  }

  public start(): void {
    this.loader('start');
  }

  public stop(): void {
    this.loader('stop');
  }

  public forceStop(): void {
    this.activeRequests = 0;
    this.isLoadingSubject.next(false);
  }
}

/**
 * Global function that can be imported and called anywhere in the project:
 * loader('start') -> shows loader
 * loader('stop')  -> hides loader
 */
export function loader(action: 'start' | 'stop' | boolean): void {
  if (loaderServiceInstance) {
    loaderServiceInstance.loader(action);
  } else {
    console.warn('LoaderService has not been initialized yet.');
  }
}

import { Injectable } from '@angular/core';


@Injectable({
  providedIn: 'root'
})
export class ApiUrlService {
  private readonly baseUrl: string;
  
  constructor() {
    // Use the environment configuration but allow for runtime override
    this.baseUrl = '/api';
    console.log('API Base URL:', this.baseUrl);
  }
  
  /**
   * Get the full API URL for a specific endpoint
   * @param endpoint The API endpoint path (without leading slash)
   * @returns The full URL to the API endpoint
   */
  getUrl(endpoint: string): string {
    // Make sure endpoint doesn't start with a slash
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
    return `${this.baseUrl}/${cleanEndpoint}`;
  }
  
  /**
   * Get the base API URL
   * @returns The base API URL
   */
  getBaseUrl(): string {
    return this.baseUrl;
  }
}

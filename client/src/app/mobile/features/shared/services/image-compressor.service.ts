import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ImageCompressorService {
  async compressImage(imageBase64: string, maxSizeKB: number = 500): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = imageBase64;
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Calculate new dimensions while maintaining aspect ratio
        if (width > height) {
          if (width > 800) {
            height = Math.round((height * 800) / width);
            width = 800;
          }
        } else {
          if (height > 800) {
            width = Math.round((width * 800) / height);
            height = 800;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        
        // Start with high quality
        let quality = 0.9;
        let result = canvas.toDataURL('image/jpeg', quality);
        
        // Reduce quality until file size is under maxSizeKB
        while (this.getBase64Size(result) > maxSizeKB * 1024 && quality > 0.1) {
          quality -= 0.1;
          result = canvas.toDataURL('image/jpeg', quality);
        }
        
        resolve(result);
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
    });
  }
  
  private getBase64Size(base64String: string): number {
    // Remove data URL prefix if present
    const base64 = base64String.split(',')[1] || base64String;
    return (base64.length * 3) / 4;
  }
}
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { VendorAsset } from '../models/vendor-asset.model';

@Injectable({ providedIn: 'root' })
export class VendorAssetService {
  // TODO: Update API endpoint URL for vendor assets
  private apiUrl = 'http://localhost:3000/vendor-assets';

  constructor(private http: HttpClient) {}

  /* Fetch all vendor assets from the backend */
  getVendorAssets(): Observable<VendorAsset[]> {
    return this.http.get<VendorAsset[]>(this.apiUrl);
  }

  /* Fetch a single vendor asset by ID */
  getVendorAssetById(id: number): Observable<VendorAsset> {
    return this.http.get<VendorAsset>(`${this.apiUrl}/${id}`);
  }

  /* Add new vendor asset */
  addVendorAsset(asset: VendorAsset): Observable<VendorAsset> {
    return this.http.post<VendorAsset>(this.apiUrl, asset);
  }

  /* Update existing vendor asset */
  updateVendorAsset(asset: VendorAsset): Observable<VendorAsset> {
    return this.http.put<VendorAsset>(`${this.apiUrl}/${asset.rowId}`, asset);
  }

  /* Delete vendor asset by ID */
  deleteVendorAsset(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}

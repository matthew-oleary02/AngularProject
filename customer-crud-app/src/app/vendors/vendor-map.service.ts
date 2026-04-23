import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { VendorMap } from './vendor-map.model';

@Injectable({ providedIn: 'root' })
// Handles CRUD operations for vendor-map API endpoints
export class VendorMapService {
  // Base API URL
  private apiUrl = 'http://localhost:3000/vendor-maps';

  constructor(private http: HttpClient) { }

  getVendorMaps(): Observable<VendorMap[]> {
    return this.http.get<VendorMap[]>(this.apiUrl);
  }

  getVendorMapById(id: number): Observable<VendorMap> {
    return this.http.get<VendorMap>(`${this.apiUrl}/${id}`);
  }

  addVendorMap(vendorMap: VendorMap): Observable<VendorMap> {
    return this.http.post<VendorMap>(this.apiUrl, vendorMap);
  }

  updateVendorMap(vendorMap: VendorMap): Observable<VendorMap> {
    return this.http.put<VendorMap>(`${this.apiUrl}/${vendorMap.rowId}`, vendorMap);
  }

  deleteVendorMap(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
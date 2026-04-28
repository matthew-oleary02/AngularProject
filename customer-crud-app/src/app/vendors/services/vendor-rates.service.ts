import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { VendorRates } from '../models/vendor-rates.model';

@Injectable({ providedIn: 'root' })
export class VendorRatesService {
  private apiUrl = 'http://localhost:3000/vendor-rates';

  constructor(private http: HttpClient) { }

  getAllVendorRates(): Observable<VendorRates[]> {
    return this.http.get<VendorRates[]>(this.apiUrl);
  }

  getVendorRateById(id: number): Observable<VendorRates> {
    return this.http.get<VendorRates>(`${this.apiUrl}/${id}`);
  }

  addVendorRate(vendorRate: VendorRates): Observable<VendorRates> {
    return this.http.post<VendorRates>(this.apiUrl, vendorRate);
  }

  updateVendorRate(id: number, vendorRate: VendorRates): Observable<VendorRates> {
    return this.http.put<VendorRates>(`${this.apiUrl}/${id}`, vendorRate);
  }

  deleteVendorRate(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}

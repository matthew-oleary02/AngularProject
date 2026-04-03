import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { VendorCoverage } from './vendor-coverage.model';

@Injectable({ providedIn: 'root' })
export class VendorCoverageService {
  private apiUrl = 'http://localhost:3000/vendor-coverage';

    constructor(private http: HttpClient) {}

    /* Fetch all vendor coverage records from the backend */
    getVendorCoverage(): Observable<VendorCoverage[]> {
        return this.http.get<VendorCoverage[]>(this.apiUrl);
    }

    /* Fetch a single vendor coverage record by ID */
    getVendorCoverageById(id: number): Observable<VendorCoverage> {
        return this.http.get<VendorCoverage>(`${this.apiUrl}/${id}`);
    }

    /* Add a new vendor coverage record */
    addVendorCoverage(coverage: VendorCoverage): Observable<VendorCoverage> {
        return this.http.post<VendorCoverage>(this.apiUrl, coverage);
    }

    /* Update an existing vendor coverage record */
    updateVendorCoverage(coverage: VendorCoverage): Observable<VendorCoverage> {
        return this.http.put<VendorCoverage>(`${this.apiUrl}/${coverage.rowId}`, coverage);
    }

    deleteVendorCoverage(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }
}
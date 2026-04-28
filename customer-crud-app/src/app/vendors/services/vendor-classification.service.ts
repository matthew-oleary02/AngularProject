import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { VendorClassification } from '../models/vendor-classification.model';

@Injectable({ providedIn: 'root' })
export class VendorClassificationService {
    private apiUrl = 'http://localhost:3000/vendor-classification';

    constructor(private http: HttpClient) {}

    /* Fetch all Vendor Classification records from the backend */
    getClassifications(): Observable<VendorClassification[]> {
        return this.http.get<VendorClassification[]>(this.apiUrl);
    }

    /* Fetch a single Vendor Classification record by ID */
    getClassification(id: number): Observable<VendorClassification> {
        return this.http.get<VendorClassification>(`${this.apiUrl}/${id}`);
    }

    /* Create a new Vendor Classification record */
    addClassification(classification: VendorClassification): Observable<VendorClassification> {
        return this.http.post<VendorClassification>(this.apiUrl, classification);
    }

    /* Update an existing Vendor Classification record */
    updateClassification(classification: VendorClassification): Observable<VendorClassification> {
        return this.http.put<VendorClassification>(`${this.apiUrl}/${classification.rowId}`, classification);
    }

    /* Delete a Vendor Classification record by ID */
    deleteClassification(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }
}

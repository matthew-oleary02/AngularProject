import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { VendorContractStatus } from '../models/vendor-contract-status.model';

@Injectable({ providedIn: 'root' })
export class VendorContractStatusService {
  private apiUrl = 'http://localhost:3000/vendor-contract-status';

  constructor(private http: HttpClient) {}

  /* Fetch all Vendor Contract Status records from the backend */
  getContractStatuses(): Observable<VendorContractStatus[]> {
    return this.http.get<VendorContractStatus[]>(this.apiUrl);
  }

  /* Fetch a single Vendor Contract Status record by ID */
  getContractStatus(id: number): Observable<VendorContractStatus> {
    return this.http.get<VendorContractStatus>(`${this.apiUrl}/${id}`);
  }

  /* Create a new Vendor Contract Status record */
  addContractStatus(status: VendorContractStatus): Observable<VendorContractStatus> {
    return this.http.post<VendorContractStatus>(this.apiUrl, status);
  }

  /* Update an existing Vendor Contract Status record */
  updateContractStatus(status: VendorContractStatus): Observable<VendorContractStatus> {
    return this.http.put<VendorContractStatus>(`${this.apiUrl}/${status.rowId}`, status);
  }

  /* Delete a Vendor Contract Status record by ID */
  deleteContractStatus(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}

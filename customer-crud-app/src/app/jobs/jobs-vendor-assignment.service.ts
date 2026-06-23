import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { JobsVendorAssignment } from './jobs-vendor-assignment.model';

@Injectable({ providedIn: 'root' })
export class JobsVendorAssignmentService {
  private apiUrl = 'http://localhost:3000/jobs-vendor-assignment';

  constructor(private http: HttpClient) {}

  /* Fetch all Jobs Vendor Assignment records from the backend */
  getContractStatuses(): Observable<JobsVendorAssignment[]> {
    return this.http.get<JobsVendorAssignment[]>(this.apiUrl);
  }

  /* Fetch a single Jobs Vendor Assignment record by ID */
  getContractStatus(id: number): Observable<JobsVendorAssignment> {
    return this.http.get<JobsVendorAssignment>(`${this.apiUrl}/${id}`);
  }

  /* Create a new Jobs Vendor Assignment record */
  addContractStatus(status: JobsVendorAssignment): Observable<JobsVendorAssignment> {
    return this.http.post<JobsVendorAssignment>(this.apiUrl, status);
  }

  /* Update an existing Jobs Vendor Assignment record */
  updateContractStatus(status: JobsVendorAssignment): Observable<JobsVendorAssignment> {
    return this.http.put<JobsVendorAssignment>(`${this.apiUrl}/${status.rowId}`, status);
  }

  /* Delete a Jobs Vendor Assignment record by ID */
  deleteContractStatus(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}

import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { JobsETA } from './jobs-eta.model';

@Injectable({ providedIn: 'root' })
export class JobsETAService {
    private apiUrl = 'http://localhost:3000/jobs-eta';

    constructor(private http: HttpClient) {}

    private getAuthHeaders(): HttpHeaders {
        const token = localStorage.getItem('token');
        return new HttpHeaders({
            Authorization: `Bearer ${token}`
        });
    }

    /* Fetch all Job ETA records from the backend */
    getJobsEtas(): Observable<JobsETA[]> {
        return this.http.get<JobsETA[]>(this.apiUrl, { headers: this.getAuthHeaders() });
    }

    /* Fetch a single Job ETA record by ID */
    getJobsEta(id: number): Observable<JobsETA> {
        return this.http.get<JobsETA>(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders() });
    }

    /* Create a new Job ETA record */
    addJobsEta(jeta: JobsETA): Observable<JobsETA> {
        return this.http.post<JobsETA>(this.apiUrl, jeta, { headers: this.getAuthHeaders() });
    }

    /* Update an existing Job ETA record */
    updateJobsEta(jeta: JobsETA): Observable<JobsETA> {
        return this.http.put<JobsETA>(`${this.apiUrl}/${jeta.rowId}`, jeta, { headers: this.getAuthHeaders() });
    }

    /* Delete a Job ETA record by ID */
    deleteJobsEta(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders() });
    }
}

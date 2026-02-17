import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Jobs } from './jobs.model';

@Injectable({ providedIn: 'root' })
export class JobsService {
  private apiUrl = 'http://localhost:3000/jobs';

    constructor(private http: HttpClient) {}

    private getAuthHeaders(): HttpHeaders {
        const token = localStorage.getItem('token');
        return new HttpHeaders({
            Authorization: `Bearer ${token}`
        });
    }

/* Fetch all jobs from the backend */
getJobs(): Observable<Jobs[]> {
    return this.http.get<Jobs[]>(this.apiUrl, { headers: this.getAuthHeaders() });
}

/* Fetch a single job by ID */
getJob(id: number): Observable<Jobs> {
    return this.http.get<Jobs>(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders() });
}

/* Add a new job to the backend */
addJob(job: Jobs): Observable<Jobs> {
    return this.http.post<Jobs>(this.apiUrl, job, { headers: this.getAuthHeaders() });
}

/* Update an existing job in the backend */
updateJob(job: Jobs): Observable<Jobs> {
    return this.http.put<Jobs>(`${this.apiUrl}/${job.rowId}`, job, { headers: this.getAuthHeaders() });
}

/* Delete a job by ID from the backend */
deleteJob(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders() });
}
}
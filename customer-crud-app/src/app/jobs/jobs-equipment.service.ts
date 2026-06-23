import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { JobsEquipment } from './jobs-equipment.model';

@Injectable({ providedIn: 'root' })
export class JobsEquipmentService {
  private apiUrl = 'http://localhost:3000/equipment';
    constructor(private http: HttpClient) {}

    /* Fetch all equipment from the backend */
    getJobsEquipment(): Observable<JobsEquipment[]> {
        return this.http.get<JobsEquipment[]>(this.apiUrl);
    }

    /* Fetch a single equipment by ID */
    getJobsEquipmentById(id: number): Observable<JobsEquipment> {
        return this.http.get<JobsEquipment>(`${this.apiUrl}/${id}`);
    }

    /* Add new equipment */
    addJobsEquipment(jobsEquipment: JobsEquipment): Observable<JobsEquipment> {
        return this.http.post<JobsEquipment>(this.apiUrl, jobsEquipment);
    }

    /* Update existing equipment */
    updateJobsEquipment(jobsEquipment: JobsEquipment): Observable<JobsEquipment> {
        return this.http.put<JobsEquipment>(`${this.apiUrl}/${jobsEquipment.rowId}`, jobsEquipment);
    }

    /* Delete equipment by ID */
    deleteJobsEquipment(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }
}
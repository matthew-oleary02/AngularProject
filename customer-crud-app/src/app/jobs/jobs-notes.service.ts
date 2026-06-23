import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { JobNote } from './jobs-notes.model';

@Injectable({ providedIn: 'root' })
export class JobsNotesService {
  private apiUrl = 'http://localhost:3000/jobs-notes';

  constructor(private http: HttpClient) {}

  /* Fetch all job notes from the backend */
  getJobsNotes(): Observable<JobNote[]> {
    return this.http.get<JobNote[]>(this.apiUrl);
  }

  /* Fetch a single job note by ID */
  getJobNote(id: number): Observable<JobNote> {
    return this.http.get<JobNote>(`${this.apiUrl}/${id}`);
  }

  /* Add a new job note */
  addJobNote(note: JobNote): Observable<JobNote> {
    return this.http.post<JobNote>(this.apiUrl, note);
  }

  /* Update an existing job note */
  updateJobNote(note: JobNote): Observable<JobNote> {
    return this.http.put<JobNote>(`${this.apiUrl}/${note.rowId}`, note);
  }

  /* Delete a job note by ID */
  deleteJobNote(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}

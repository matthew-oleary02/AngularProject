import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ReportGroups } from './report-groups.model';

@Injectable({ providedIn: 'root' })
export class ReportGroupsService {
  private apiUrl = 'http://localhost:3000/report-groups';

  constructor(private http: HttpClient) {}
  
  /* Fetch all departments from the backend */
  getDepartments(): Observable<ReportGroups[]> {
    return this.http.get<ReportGroups[]>(this.apiUrl);
  }
  
  /* Fetch a single department by ID */
  getDepartment(id: number): Observable<ReportGroups> {
    return this.http.get<ReportGroups>(`${this.apiUrl}/${id}`);
  }
  
  /* Add a new department */
  addDepartment(reportGroups: ReportGroups): Observable<ReportGroups> {
    return this.http.post<ReportGroups>(this.apiUrl, reportGroups);
  }
  
  /* Update an existing department */
  updateDepartment(reportGroups: ReportGroups): Observable<ReportGroups> {
    return this.http.put<ReportGroups>(`${this.apiUrl}/${reportGroups.rowId}`, reportGroups);
  }
  
  /* Delete a department by ID */
  deleteDepartment(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
  }
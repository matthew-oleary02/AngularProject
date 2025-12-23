import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Roles } from '../admin/roles.model';

@Injectable({ providedIn: 'root' })
export class RolesService {
  private apiUrl = 'http://localhost:3000/roles';

  constructor(private http: HttpClient) {}

  /** Helper: Get Authorization headers */
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
  }

  /** Fetch all roles */
  getRoles(): Observable<Roles[]> {
    return this.http.get<Roles[]>(this.apiUrl, { headers: this.getAuthHeaders() });
  }

  /** Fetch a single role by ID */
  getRole(id: number): Observable<Roles> {
    return this.http.get<Roles>(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders() });
  }

  /** Add a new role */
  addRole(role: Roles): Observable<Roles> {
    return this.http.post<Roles>(this.apiUrl, role, { headers: this.getAuthHeaders() });
  }

  /** Update an existing role */
  updateRole(role: Roles): Observable<Roles> {
    return this.http.put<Roles>(`${this.apiUrl}/${role.roleId}`, role, { headers: this.getAuthHeaders() });
  }

  /** Delete a role by ID */
  deleteRole(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders() });
  }
}
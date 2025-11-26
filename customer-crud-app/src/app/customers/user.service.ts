
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Users } from './user.model';

@Injectable({ providedIn: 'root' })
export class UserService {
  private apiUrl = 'http://localhost:3000/admin';

  constructor(private http: HttpClient) {}

  /** Helper: Get Authorization headers */
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
  }

  /** Fetch all users */
  getUsers(): Observable<Users[]> {
    return this.http.get<Users[]>(this.apiUrl, { headers: this.getAuthHeaders() });
  }

  /** Fetch a single user by ID */
  getUser(id: number): Observable<Users> {
    return this.http.get<Users>(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders() });
  }

  /** Add a new user */
  addUser(user: Users): Observable<Users> {
    return this.http.post<Users>(this.apiUrl, user, { headers: this.getAuthHeaders() });
  }

  /** Update an existing user */
  updateUser(user: Users): Observable<Users> {
    return this.http.put<Users>(`${this.apiUrl}/${user.id}`, user, { headers: this.getAuthHeaders() });
  }

  /** Delete a user by ID */
  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders() });
  }
}
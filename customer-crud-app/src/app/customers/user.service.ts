import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Users } from './user.model';

@Injectable({ providedIn: 'root' })
export class UserService {
  private apiUrl = 'http://localhost:3000/admin';

  constructor(private http: HttpClient) {}

/* Fetch all users from the backend */
getUsers(): Observable<Users[]> {
  return this.http.get<Users[]>(this.apiUrl);
}

/* Fetch a single user by ID */
getUser(id: number): Observable<Users> {
  return this.http.get<Users>(`${this.apiUrl}/${id}`);
}

/* Add a new user */
addUser(user: Users): Observable<Users> {
  return this.http.post<Users>(this.apiUrl, user);
}

/* Update an existing user */
updateUser(user: Users): Observable<Users> {
  return this.http.put<Users>(`${this.apiUrl}/${user.id}`, user);
}

/* Delete a user by ID */
deleteUser(id: number): Observable<void> {
  return this.http.delete<void>(`${this.apiUrl}/${id}`);
}
}
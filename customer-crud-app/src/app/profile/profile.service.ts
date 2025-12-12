
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Profile } from './profile.model';

@Injectable({ providedIn: 'root' })
export class ProfileService {
    private apiUrl = 'http://localhost:3000/profile';

    constructor(private http: HttpClient) {}


    /** Helper: Get Authorization headers */
    private getAuthHeaders(): HttpHeaders {
        const token = localStorage.getItem('token');
        return new HttpHeaders({
            Authorization: `Bearer ${token}`
        });
    }
    /** Fetch profile of the logged-in user */
    getProfile(): Observable<Profile> {
        return this.http.get<Profile>(this.apiUrl, { headers: this.getAuthHeaders() });
    }   
    /** Update profile of the logged-in user */
    updateProfile(user: Profile): Observable<Profile> {
        return this.http.put<Profile>(this.apiUrl, user, { headers: this.getAuthHeaders() });
    }
}

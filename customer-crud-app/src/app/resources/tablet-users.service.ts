import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { TabletUser } from './tablet-users.model';

@Injectable({ providedIn: 'root' })
export class TabletUsersService {
    private apiUrl = 'http://localhost:3000/tabletUsers';

    constructor(private http: HttpClient) { }

    /* Fetch all tablet users from the backend */
    getTabletUsers(): Observable<TabletUser[]> {
        return this.http.get<TabletUser[]>(this.apiUrl);
    }

    /* Fetch a single tablet user by ID */
    getTabletUser(id: number): Observable<TabletUser> {
        return this.http.get<TabletUser>(`${this.apiUrl}/${id}`);
    }

    /* Add a new tablet user */
    addTabletUser(tabletUser: TabletUser): Observable<TabletUser> {
        return this.http.post<TabletUser>(this.apiUrl, tabletUser);
    }

    /* Update an existing tablet user */
    updateTabletUser(tabletUser: TabletUser): Observable<TabletUser> {
        return this.http.put<TabletUser>(`${this.apiUrl}/${tabletUser.rowId}`, tabletUser);
    }

    /* Delete a tablet user by ID */
    deleteTabletUser(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }
}
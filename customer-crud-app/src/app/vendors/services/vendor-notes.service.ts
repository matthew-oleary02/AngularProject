import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { VendorNote } from '../models/vendor-notes.model';

@Injectable({ providedIn: 'root' })
export class VendorNotesService {
  private apiUrl = 'http://localhost:3000/vendor-notes';

  constructor(private http: HttpClient) {}

  /* Fetch all vendor notes from the backend */
  getVendorNotes(): Observable<VendorNote[]> {
    return this.http.get<VendorNote[]>(this.apiUrl);
  }

  /* Fetch a single vendor note by ID */
  getVendorNote(id: number): Observable<VendorNote> {
    return this.http.get<VendorNote>(`${this.apiUrl}/${id}`);
  }

  /* Add a new vendor note */
  addVendorNote(note: VendorNote): Observable<VendorNote> {
    return this.http.post<VendorNote>(this.apiUrl, note);
  }

  /* Update an existing vendor note */
  updateVendorNote(note: VendorNote): Observable<VendorNote> {
    return this.http.put<VendorNote>(`${this.apiUrl}/${note.rowId}`, note);
  }

  /* Delete a vendor note by ID */
  deleteVendorNote(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}

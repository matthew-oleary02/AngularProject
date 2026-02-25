//customer-files.service.ts
/*
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CustomerFiles } from './customer-files.model';

@Injectable({ providedIn: 'root' })
export class CustomerFilesService {
  private apiUrl = 'http://localhost:3000/customer-files';

  constructor(private http: HttpClient) {}

    getCustomerFiles(): Observable<CustomerFiles[]> {
        return this.http.get<CustomerFiles[]>(this.apiUrl);
    }

    getCustomerFile(id: number): Observable<CustomerFiles> {
        return this.http.get<CustomerFiles>(`${this.apiUrl}/${id}`);
    }

    addCustomerFile(fi: CustomerFiles): Observable<CustomerFiles> {
        return this.http.post<CustomerFiles>(this.apiUrl, fi);
    }
  
    updateCustomerFile(fi: CustomerFiles): Observable<CustomerFiles> {
        return this.http.put<CustomerFiles>(`${this.apiUrl}/${fi.rowId}`, fi);
    }
  
    deleteCustomerFile(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }
}
    */
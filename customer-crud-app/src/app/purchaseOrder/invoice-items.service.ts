import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { InvoiceItem } from './invoice-items.model';

@Injectable({ providedIn: 'root' })
export class InvoiceItemService {
    private apiUrl = 'http://localhost:3000/invoice-items';

    constructor(private http: HttpClient) { }

    /* Fetch all invoice items from the backend */
    getInvoiceItems(): Observable<InvoiceItem[]> {
        return this.http.get<InvoiceItem[]>(this.apiUrl);
    }

    /* Fetch a single invoice item by ID */
    getInvoiceItem(id: number): Observable<InvoiceItem> {
        return this.http.get<InvoiceItem>(`${this.apiUrl}/${id}`);
    }

    /* Add a new invoice item */
    addInvoiceItem(invoiceItem: InvoiceItem): Observable<InvoiceItem> {
        return this.http.post<InvoiceItem>(this.apiUrl, invoiceItem);
    }

    /* Update an existing invoice item */
    updateInvoiceItem(invoiceItem: InvoiceItem): Observable<InvoiceItem> {
        return this.http.put<InvoiceItem>(`${this.apiUrl}/${invoiceItem.rowId}`, invoiceItem);
    }

    /* Delete an invoice item by ID */
    deleteInvoiceItem(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }
}
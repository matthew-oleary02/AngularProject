import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PurchaseOrder } from './purchase-order.model';

@Injectable({ providedIn: 'root' })
export class PurchaseOrderService {
  private apiUrl = 'http://localhost:3000/purchase-orders';

  constructor(private http: HttpClient) {}

/* Fetch all POs from the backend */
getPOs(): Observable<PurchaseOrder[]> {
  return this.http.get<PurchaseOrder[]>(this.apiUrl);
}

/* Fetch a single PO by ID */
getPO(id: number): Observable<PurchaseOrder> {
  return this.http.get<PurchaseOrder>(`${this.apiUrl}/${id}`);
}

/* Add a new PO */
addPO(po: PurchaseOrder): Observable<PurchaseOrder> {
  return this.http.post<PurchaseOrder>(this.apiUrl, po);
}

/* Update an existing PO */
updatePO(po: PurchaseOrder): Observable<PurchaseOrder> {
  return this.http.put<PurchaseOrder>(`${this.apiUrl}/${po.rowId}`, po);
}

/* Delete a PO by ID */
deletePO(id: number): Observable<void> {
  return this.http.delete<void>(`${this.apiUrl}/${id}`);
}
}
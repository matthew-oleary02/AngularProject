import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PurchaseOrderService } from '../purchase-order.service';
import { PurchaseOrder } from '../purchase-order.model';

@Component({
  selector: 'app-po-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './purchase-order.html',
  styleUrls: ['./purchase-order.css']
})
export class POListComponent implements OnInit {
    /* List of purchase orders to display */
    purchaseOrders: PurchaseOrder[] = [];
    /* Full list of purchase orders from the server */
    private allPurchaseOrders: PurchaseOrder[] = [];
    filterText = '';
    activeFilter: boolean | null = true;

    constructor(private purchaseOrderService: PurchaseOrderService) {}

    /* Load all purchase orders on component initialization */
ngOnInit() {
  this.purchaseOrderService.getPOs().subscribe({
    next: pos => {
      // normalize: if items are nested, unwrap; if flat, keep as is
      this.allPurchaseOrders = (pos ?? []).map((po: any) =>
        po?.purchaseOrder ? po.purchaseOrder : po
      );
      this.applyFilters();
    },
    error: err => console.error('Error fetching purchase orders:', err)
  });
}

    /* Filter purchase orders based on user input */
    onFilterChange(query: string) {
        this.filterText = query || '';
        this.applyFilters();
    }

    /* Called when the Active checkbox is toggled */
    onActiveToggle(checked: boolean) {
        // set activeFilter to boolean (true= active, false= inactive)
        this.activeFilter = checked;
        this.applyFilters();
    }

    /* Central filter logic: text + active toggle */
    
private applyFilters() {
  const q = this.filterText.toLowerCase().trim();
  this.purchaseOrders = (this.allPurchaseOrders ?? []).filter(p => {
    const fields = [
      p?.poNumber, p?.total, p?.customer, p?.vendor, p?.employee,
      p?.description, p?.cardType, p?.enteredBy,
      p?.dateEntered, p?.modifiedBy, p?.modifiedOn,
      p?.void !== undefined ? String(p.void) : undefined
    ];
    return !q || fields.some(f => f && String(f).toLowerCase().includes(q));
  });
}

/* Delete a PO after confirmation */
  onDelete(id: number) {
    if (!Number.isFinite(id) || id <= 0) return;
    if (!confirm(`Delete PO #${id}?`)) return;

    this.purchaseOrderService.deletePO(id).subscribe({
      next: () => {
        this.purchaseOrders = this.purchaseOrders.filter(po => po.rowId !== id);
      },
      error: (err) => {
        console.error('Error deleting PO:', err)
        alert('Failed to delete PO. Please try again.');
      }
    });
  }
}
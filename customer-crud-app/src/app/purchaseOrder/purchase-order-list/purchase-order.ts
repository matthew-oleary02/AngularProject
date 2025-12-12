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
        next: po => {
            this.allPurchaseOrders = po || [];
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
        this.purchaseOrders = this.allPurchaseOrders.filter(po => {
        // active filter: if activeFilter is null, don't filter by active; otherwise match boolean
        //const matchesActive = this.activeFilter === null ? true : (po.active === this.activeFilter);
        // text search across multiple fields
        const fields = [
            po.purchaseOrder.poNumber,
            po.purchaseOrder.total,
            po.purchaseOrder.customer,
            po.purchaseOrder.vendor,
            po.purchaseOrder.employee,
            po.purchaseOrder.enteredBy,
            po.purchaseOrder.description,
            po.purchaseOrder.cardType,
            po.purchaseOrder.void,
            po.purchaseOrder.enteredBy,
            po.purchaseOrder.dateEntered,
            po.purchaseOrder.modifiedBy,
            po.purchaseOrder.modifiedOn
        ];
        const matchesQuery = !q || fields.some(f => !!f && String(f).toLowerCase().includes(q));
        return matchesQuery;
        });
    }
}
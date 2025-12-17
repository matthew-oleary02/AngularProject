import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { PurchaseOrderService } from '../purchase-order.service';
import { PurchaseOrder } from '../purchase-order.model';

@Component({
  selector: 'app-po-view',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './purchase-order-view.html',
  styleUrls: ['./purchase-order-view.css']
})

export class POViewComponent implements OnInit {
  po?: PurchaseOrder;

  constructor(private POService: PurchaseOrderService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  /* Load PO details based on route parameter */
  ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('id');
    const id = idParam ? Number(idParam) : NaN;
    if (!Number.isFinite(id) || id <= 0) {
      console.error('Invalid PO ID', idParam);
    };
    
    /* Fetch PO details from the service */
    this.POService.getPO(id).subscribe({
      next: po => this.po = po,
      error: err => console.error('Error fetching PO:', err)
    });
  }
}
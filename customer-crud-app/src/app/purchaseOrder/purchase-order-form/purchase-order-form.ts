import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PurchaseOrderService } from '../purchase-order.service';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PurchaseOrder } from '../purchase-order.model';

@Component({
  selector: 'app-po-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './purchase-order-form.html',
  styleUrls: ['./purchase-order-form.css']
})
export class POFormComponent implements OnInit {
  form!: FormGroup;
  isEdit = false;
  poId!: number;

  constructor(
    private fb: FormBuilder,
    private poService: PurchaseOrderService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  /* Initialize the form and load PO data if editing */
  ngOnInit() {
    this.form = this.fb.group({
        poNumber: ['', Validators.required],
        total: ['', [Validators.required, Validators.min(0)]],
        customer: ['', Validators.required],
        vendor: ['', Validators.required],
        employee: ['', Validators.required],
        description: [''],
        cardType: ['', Validators.required],
        void: [false],
    });

    /* Check if we are in edit mode based on route parameters */
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.poId = Number(idParam);
      if (Number.isFinite(this.poId) && this.poId > 0) {
        this.isEdit = true;
      }
    }

    /* If editing, load the PO data into the form */
    if (this.isEdit) {
      this.poService.getPO(this.poId).subscribe(po => {
        if (po) this.form.patchValue(po);
      });
    }
  }

  /* Handle form submission for add or edit */
  submit() {
    // If not delete action, prevent submission when the form is invalid
    if (this.form.invalid) {
      // mark controls so validation messages appear
      this.form.markAllAsTouched();
      return;
    }

    const po: PurchaseOrder = {
      id: this.poId || 0,
      ...this.form.value
    };

    const request = this.isEdit
      ? this.poService.updatePO(po)
      : this.poService.addPO(po);

    /* Execute the appropriate request and navigate back to the PO list on success */
    request.subscribe({
      next: () => {
        this.router.navigate(['/purchase-orders']);
      },
      error: err => {
        console.error('Error saving PO:', err);
      }
    });
  }

}
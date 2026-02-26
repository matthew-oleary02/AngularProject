//equipment-form.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { EquipmentService } from '../equipment.service';
import { Equipment } from '../equipment.model';
import { CustomerService } from '../customer.service'; // Adjust the path as necessary
import { Customer } from '../customer.model'; // Adjust the path as necessary

@Component({
    selector: 'app-equipment-form',
    standalone: true,
    imports: [CommonModule, RouterModule, ReactiveFormsModule],
    templateUrl: './equipment-form.html',
    styleUrls: ['../../styles/form.css'],
})

export class EquipmentFormComponent implements OnInit {
    form!: FormGroup;
    isEdit = false;
    equipmentId!: number;
    customers: Customer[] = [];

    constructor(
        private fb: FormBuilder,
        private equipmentService: EquipmentService,
        private router: Router,
        private route: ActivatedRoute,
        private customerService: CustomerService
    ) {}

    ngOnInit() {
        this.form = this.fb.group({
            customer: ['', Validators.required],
            location: ['', Validators.required],
            entryStatus: [''],
            manufacturer: [''],
            model: [''],
            serialNumber: [''],
            tonnage: [''],
            age: [''],
            condition: [''],
            typeOfUnit: [''],
            dateLoaded: ['']
        });
    

    /* Check if we are in edit mode based on route parameters and load equipment data if editing */
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
        this.equipmentId = Number(idParam);
        if (Number.isFinite(this.equipmentId) && this.equipmentId > 0) {
            this.isEdit = true;
            }
        }

        /* If editing, load the location data into the form */
    if (this.isEdit) {
      this.equipmentService.getEquipmentById(this.equipmentId).subscribe(c => {
        if (c) this.form.patchValue(c);
      });
    }

    this.loadCustomers();
  }

    loadCustomers(): void {
    this.customerService.getCustomers().subscribe((data: Customer[]) => {
      this.customers = data;
    });
  }

    submit() {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        const equipment: Equipment = {
            rowId: this.equipmentId || 0,
            ...this.form.value
        };

        const request = this.isEdit
            ? this.equipmentService.updateEquipment(equipment)
            : this.equipmentService.addEquipment(equipment);

        request.subscribe({
            next: () => {
                this.router.navigate(['/equipment']);
            },
            error: err => {
                console.error('Error saving equipment:', err);
            }
        });
    }
}
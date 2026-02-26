
//offices-form.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { OfficesService } from '../offices.service';
import { Office } from '../offices.model';

@Component({
    selector: 'app-offices-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule],
    templateUrl: './offices-form.html',
  styleUrls: ['../../styles/form.css'],
})
export class OfficesFormComponent implements OnInit {
    form!: FormGroup;
    isEdit = false;
    officeId!: number;
    constructor(
        private fb: FormBuilder,
        private officesService: OfficesService,
        private router: Router,
        private route: ActivatedRoute
    ) {}
    ngOnInit() {
        this.form = this.fb.group({
            name: ['', Validators.required],
            address1: [''],
            address2: [''],
            city: [''],
            state: [''],
            zip: [''],
            county: [''],
            country: [''],
            phone: [''],
            active: [true],
        });
        const idParam = this.route.snapshot.paramMap.get('id');
        if (idParam) {
            this.officeId = Number(idParam);
            if (Number.isFinite(this.officeId) && this.officeId > 0) {
                this.isEdit = true;
            }
        }
        if (this.isEdit) {
            this.officesService.getOffice(this.officeId).subscribe(o => {
                if (o) this.form.patchValue(o);
            });
        }
    }
    submit() {
        if (this.form.invalid) {
            return;
        }
        const officeData: Office = this.form.value;
        if (this.isEdit) {
            officeData.id = this.officeId;
            this.officesService.updateOffice(officeData).subscribe({
                next: () => this.router.navigate(['/offices']),
                error: err => console.error('Error updating office:', err)
            });
        } else {
            this.officesService.addOffice(officeData).subscribe({
                next: () => this.router.navigate(['/offices']),
                error: err => console.error('Error adding office:', err)
            });
        }
    }
}
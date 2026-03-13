import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { VehiclesService } from '../vehicles.service';
import { Vehicles } from '../vehicles.model';

@Component({
    selector: 'app-vehicles-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule],
    templateUrl: './vehicle-form.html',
  styleUrls: ['../../styles/form.css'],
})
export class VehiclesFormComponent implements OnInit {
    form!: FormGroup;
    isEdit = false;
    vehiclesId!: number;
    constructor(
        private fb: FormBuilder,
        private vehiclesService: VehiclesService,
        private router: Router,
        private route: ActivatedRoute
    ) {}
    ngOnInit() {
        this.form = this.fb.group({
            vehicleCode: ['', Validators.required],
            status: [true],
            gpsType: [''],
            statusNote: [''],
            vehicleType: [''],
            year: [''],
            make: [''],
            model: [''],
            color: [''],
            vin: [''],
            plate: [''],
            state: [''],
            manager: [''],
            assignedTo: [''],
            department: [''],
            registration: [''],
            inspection: [''],
            vendorVehicleID: [''],
            passType: [''],
            passNumber: ['']
        });
        const idParam = this.route.snapshot.paramMap.get('id');
        if (idParam) {
            this.vehiclesId = Number(idParam);
            if (Number.isFinite(this.vehiclesId) && this.vehiclesId > 0) {
                this.isEdit = true;
            }
        }
        if (this.isEdit) {
            this.vehiclesService.getVehicle(this.vehiclesId).subscribe(o => {
                if (o) this.form.patchValue(o);
            });
        }
    }
    submit() {
        if (this.form.invalid) {
            return;
        }
        const vehicleData: Vehicles = this.form.value;
        if (this.isEdit) {
            vehicleData.rowId = this.vehiclesId;
            this.vehiclesService.updateVehicles(vehicleData).subscribe({
                next: () => this.router.navigate(['/vehicles']),
                error: err => console.error('Error updating vehicle:', err)
            });
        } else {
            this.vehiclesService.addVehicles(vehicleData).subscribe({
                next: () => this.router.navigate(['/vehicles']),
                error: err => console.error('Error adding vehicle:', err)
            });
        }
    }
}
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { VendorMap } from '../vendor-map.model';
import { VendorMapService } from '../vendor-map.service';

@Component({
  selector: 'app-vendor-map-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './vendor-map-form.html',
  styleUrls: ['../../styles/form.css'],
})
export class VendorMapFormComponent implements OnInit {
  form!: FormGroup;
  isEdit = false;
  mapId!: number;

  constructor(
    private fb: FormBuilder,
    private vendorMapService: VendorMapService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit() {
    this.form = this.fb.group({
      vendorId: ['', Validators.required],
      vendorCoverageId: ['', Validators.required],
      coordinates: ['', Validators.required]
    });

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.mapId = Number(idParam);
      if (Number.isFinite(this.mapId) && this.mapId > 0) {
        this.isEdit = true;
      }
    }

    if (this.isEdit) {
      this.vendorMapService.getVendorMapById(this.mapId).subscribe(vm => {
        if (vm) this.form.patchValue(vm);
      });
    }
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const vendorMap: VendorMap = {
      rowId: this.mapId,
      ...this.form.value
    };

    const request = this.isEdit
      ? this.vendorMapService.updateVendorMap(vendorMap)
      : this.vendorMapService.addVendorMap(vendorMap);

    request.subscribe({
      next: () => {
        this.router.navigate(['/vendor-map']);
      },
      error: err => {
        console.error('Error saving vendor map', err);
      }
    });
  }
}

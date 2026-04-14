import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { VendorMap } from '../vendor-map.model';
import { VendorMapService } from '../vendor-map.service';

@Component({
  selector: 'app-vendor-map-view',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './vendor-map-view.html',
  styleUrls: ['../../styles/view.css'],
})
export class VendorMapViewComponent implements OnInit {
  vendorMap?: VendorMap;
  constructor(private vendorMapService: VendorMapService,
    private router: Router,
    private route: ActivatedRoute) { }

  ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('id');
    const id = idParam ? parseInt(idParam) : NaN;
    if (!Number.isFinite(id || id <= 0)) {
      console.error('Invalid vendor map ID', idParam);
    }

    this.vendorMapService.getVendorMapById(id).subscribe({
      next: vm => this.vendorMap = vm,
      error: err => console.error('Error fetching vendor map', err)
    });
  }
}

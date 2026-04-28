import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { VendorAssetService } from '../services/vendor-asset.service';
import { VendorAsset } from '../models/vendor-asset.model';

@Component({
    selector: 'app-vendor-asset-view',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './vendor-asset-view.html',
    styleUrls: ['../../styles/view.css'],
})
export class VendorAssetViewComponent implements OnInit {
    asset?: VendorAsset;

    constructor(
        private vendorAssetService: VendorAssetService,
        private router: Router,
        private route: ActivatedRoute
    ) {}

    ngOnInit() {
        const idParam = this.route.snapshot.paramMap.get('id');
        const id = idParam ? Number(idParam) : NaN;
        if (!Number.isFinite(id) || id <= 0) {
            console.error('Invalid vendor asset ID', idParam);
            return;
        }

        this.vendorAssetService.getVendorAssetById(id).subscribe({
            next: asset => this.asset = asset,
            error: err => console.error('Error fetching vendor asset:', err)
        });
    }

    deleteAsset() {
        if (this.asset && confirm('Are you sure you want to delete this asset?')) {
            this.vendorAssetService.deleteVendorAsset(this.asset.rowId).subscribe(() => {
                this.router.navigate(['/vendors/vendor-asset-list']);
            });
        }
    }
}

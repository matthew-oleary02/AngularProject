import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { VendorClassification } from '../models/vendor-classification.model';
import { VendorClassificationService } from '../services/vendor-classification.service';

@Component({
  selector: 'app-vendor-classification-view',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './vendor-classification-view.html',
  styleUrls: ['../../styles/view.css'],
})
export class VendorClassificationViewComponent implements OnInit {
  classification?: VendorClassification;

  constructor(
    private classificationService: VendorClassificationService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('id');
    const id = idParam ? Number(idParam) : NaN;
    if (!Number.isFinite(id) || id <= 0) {
      console.error('Invalid vendor classification ID', idParam);
      return;
    }
    
    this.classificationService.getClassification(id).subscribe({
      next: data => this.classification = data,
      error: err => console.error('Error fetching vendor classification:', err)
    });
  }
}

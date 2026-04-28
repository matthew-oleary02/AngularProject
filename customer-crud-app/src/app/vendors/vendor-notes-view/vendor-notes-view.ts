import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { VendorNotesService } from '../services/vendor-notes.service';
import { VendorNote } from '../models/vendor-notes.model';

@Component({
  selector: 'app-vendor-notes-view',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './vendor-notes-view.html',
  styleUrls: ['../../styles/view.css'],
})
export class VendorNotesViewComponent implements OnInit {
  vendorNote?: VendorNote;

  constructor(private vendorNotesService: VendorNotesService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  /* Load note details based on route parameter */
  ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('id');
    const id = idParam ? Number(idParam) : NaN;
    if (!Number.isFinite(id) || id <= 0) {
      console.error('Invalid vendor note ID', idParam);
      return;
    }
    
    /* Fetch note details from the service */
    this.vendorNotesService.getVendorNote(id).subscribe({
      next: note => this.vendorNote = note,
      error: err => console.error('Error fetching vendor note:', err)
    });
  }
}

import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { VendorNotesService } from '../services/vendor-notes.service';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { VendorNote } from '../models/vendor-notes.model';
import { VendorService } from '../vendors.service';
import { Vendor } from '../vendors.model';

@Component({
  selector: 'app-vendor-notes-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './vendor-notes-form.html',
  styleUrls: ['../../styles/form.css'],
})
export class VendorNotesFormComponent implements OnInit {
  form!: FormGroup;
  isEdit = false;
  noteId!: number;
  vendors: Vendor[] = [];

  constructor(
    private fb: FormBuilder,
    private vendorNotesService: VendorNotesService,
    private router: Router,
    private route: ActivatedRoute,
    private vendorService: VendorService
  ) {}

  /* Initialize the form and load note data if editing */
  ngOnInit() {
    this.form = this.fb.group({
        vendor: ['', Validators.required],
        status: ['', Validators.required],
        message: ['', [Validators.required, Validators.maxLength(500)]],
        active: [true]
    });

    /* Check if we are in edit mode based on route parameters */
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.noteId = Number(idParam);
      if (Number.isFinite(this.noteId) && this.noteId > 0) {
        this.isEdit = true;
      }
    }

    /* If editing, load the note data into the form */
    if (this.isEdit) {
      this.vendorNotesService.getVendorNote(this.noteId).subscribe(note => {
        if (note) this.form.patchValue(note);
      });
    }

    this.loadVendors();
  }

  loadVendors(): void {
    this.vendorService.getVendors().subscribe((data: Vendor[]) => {
      this.vendors = data;
    });
  }

  /* Handle form submission for add or edit */
  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const note: VendorNote = {
      rowId: this.noteId || 0,
      ...this.form.value
    };

    const request = this.isEdit
      ? this.vendorNotesService.updateVendorNote(note)
      : this.vendorNotesService.addVendorNote(note);

    /* Execute the appropriate request and navigate back on success */
    request.subscribe({
      next: () => {
        // TODO: Verify target route for vendor notes navigation
        this.router.navigate(['/vendors']);
      },
      error: err => {
        console.error('Error saving vendor note:', err);
      }
    });
  }
}

/*
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CustomerService } from '../customer.service';
import { Customer } from '../customer.model';
import { CustomerFilesService } from '../customer-files.service';
import { CustomerFiles } from '../customer-files.model';

@Component({
  selector: 'app-customer-files-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './customer-files-form.component.html',
  styleUrls: ['./customer-files-form.component.css']
})
export class CustomerFilesFormComponent implements OnInit {
  form!: FormGroup;
  isEdit = false;
  documentId!: number;
  selectedFileName = '';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private customerService: CustomerService,
    private customerFilesService: CustomerFilesService
  ) {}

  ngOnInit() {
    this.form = this.fb.group({
      customer: ['', Validators.required],
      file: [null, Validators.required]
    });

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.documentId = Number(idParam);
      if (Number.isFinite(this.documentId) && this.documentId > 0) {
        this.isEdit = true;

        // Load existing document if needed
        // this.documentService.getDocument(this.documentId).subscribe({
        //   next: doc => {
        //     this.form.patchValue({ customer: doc.customer });
        //     this.selectedFileName = doc.fileName;
        //   }
        // });
      }
    }
  }

  onFileSelect(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    const validTypes = ['image/png', 'image/jpeg', 'application/pdf'];

    if (!validTypes.includes(file.type)) {
      alert('Only PNG, JPG, or PDF files are allowed.');
      this.form.patchValue({ file: null });
      return;
    }

    this.selectedFileName = file.name;
    this.form.patchValue({ file });
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const uploadData: CustomerFiles = {
      rowId: this.documentId || 0,
      ...this.form.value
    };

    console.log('Submitting form:', uploadData);

    // Example request logic:
    // const request = this.isEdit
    //     ? this.documentService.updateDocument(uploadData)
    //     : this.documentService.uploadDocument(uploadData);

    // request.subscribe({
    //   next: () => this.router.navigate(['/documents']),
    //   error: err => console.error('Error during upload:', err)
    // });

    // For now:
    this.router.navigate(['/documents']);
  }
}
*/
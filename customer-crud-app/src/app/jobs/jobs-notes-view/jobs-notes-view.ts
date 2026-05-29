import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { JobsNotesService } from '../jobs-notes.service';
import { JobNote } from '../jobs-notes.model';

@Component({
  selector: 'app-jobs-notes-view',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './jobs-notes-view.html',
  styleUrls: ['../../styles/view.css'],
})
export class JobsNotesViewComponent implements OnInit {
  jobNote?: JobNote;

  constructor(private jobsNotesService: JobsNotesService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  /* Load note details based on route parameter */
  ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('id');
    const id = idParam ? Number(idParam) : NaN;
    if (!Number.isFinite(id) || id <= 0) {
      console.error('Invalid job note ID', idParam);
      return;
    }
    
    /* Fetch note details from the service */
    this.jobsNotesService.getJobNote(id).subscribe({
      next: note => this.jobNote = note,
      error: err => console.error('Error fetching job note:', err)
    });
  }
}

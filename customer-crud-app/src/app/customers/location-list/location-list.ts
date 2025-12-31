import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LocationService } from '../location.service';
import { Location } from '../location.model';

@Component({
  selector: 'app-location-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './location-list.html',
  styleUrls: ['./location-list.css']
})
export class LocationListComponent implements OnInit {
  /* List of locations to display */
  locations: Location[] = [];
  /* Full list of locations from the server */
  private allLocations: Location[] = [];
  filterText = '';
  activeFilter: boolean | null = true;

  constructor(private locationService: LocationService) {}

  /* Load all locations on component initialization */
  ngOnInit() {
    this.locationService.getLocations().subscribe({
      next: loc => {
        this.allLocations = loc || [];
        this.applyFilters();
      },
      error: err => console.error('Error fetching locations:', err)
    });
  }

  /* Filter locations based on user input */
  onFilterChange(query: string) {
    this.filterText = query || '';
    this.applyFilters();
  }

  /* Called when the Active checkbox is toggled */
  onActiveToggle(checked: boolean) {
    // set activeFilter to boolean (true= active, false= inactive)
    this.activeFilter = checked;
    this.applyFilters();
  }

  /* Central filter logic: text + active toggle */
  private applyFilters() {
    const q = this.filterText.toLowerCase().trim();

    this.locations = this.allLocations.filter(loc => {
      // active filter: if activeFilter is null, don't filter by active; otherwise match boolean
      const matchesActive = this.activeFilter === null ? true : (loc.active === this.activeFilter);

      // text search across multiple fields
      const fields = [
        loc.customer,
        loc?.storeNumber,
        loc.siteAddress?.address1,
        loc.siteAddress?.address2,
        loc.siteAddress?.city,
        loc.siteAddress?.state,
        loc.siteAddress?.zip,
        loc.primaryContact?.email,
        loc.primaryContact?.phone,
        loc.siteNote
      ];
      const matchesQuery = !q || fields.some(f => !!f && String(f).toLowerCase().includes(q));

      return matchesActive && matchesQuery;
    });
  }

  /* Clear the filter input and reset location list */
  clearFilter() {
    this.filterText = '';
    this.applyFilters();
  }

  /* Delete a location after confirmation */
  onDelete(id: number) {
    if (!Number.isFinite(id) || id <= 0) return;
    if (!confirm(`Delete location #${id}?`)) return;

    this.locationService.deleteLocation(id).subscribe({
      next: () => {
        this.locations = this.locations.filter(loc => loc.rowId !== id);
      },
      error: (err) => {
        console.error('Error deleting location:', err)
        alert('Failed to delete location. Please try again.');
      }
    });
  }
}
import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { VehiclesService } from '../vehicles.service';
import { Vehicles } from '../vehicles.model';

@Component({
  selector: 'app-vehicles-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './vehicles-list.html',
  styleUrls: ['../../styles/list.css'],
})
export class VehiclesListComponent implements OnInit {
  vehicles: Vehicles[] = [];
  private allVehicles: Vehicles[] = [];

  filterText = '';
  /**
   * activeFilter: boolean | null
   * - true  => show only active
   * - false => show only inactive (if you later add this)
   * - null  => show all
   */
  activeFilter: boolean | null = true;

  constructor(private vehiclesService: VehiclesService) {}

  ngOnInit() {
    this.vehiclesService.getVehicles().subscribe({
      next: v => {
        this.allVehicles = v || [];
        this.applyFilters();
      },
      error: err => console.error('Error fetching vehicles:', err)
    });
  }

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

  clearFilter() {
    this.filterText = '';
    this.applyFilters();
  }

  onDelete(id: number) {
    if (!id) return;
    if (!confirm('Delete this vehicles?')) return;

    this.vehiclesService.deleteVehicles(id).subscribe({
      next: () => {
        this.allVehicles = this.allVehicles.filter(v => v.rowId !== id);
        this.applyFilters();
      },
      error: err => console.error('Delete failed:', err)
    });
  }

  private applyFilters() {
    const q = this.filterText.toLowerCase().trim();

    this.vehicles = this.allVehicles.filter(v => {
      const matchesActive =
        this.activeFilter === null ? true : (v.status === this.activeFilter);

      const fields = [
        v.vehicleCode,
        v.status?.toString(),
        v.status,
        v.gpsType,
        v.statusNote,
        v.vehicleType,
        v.year,
        v.make,
        v.model,
        v.color,
        v.vin,
        v.plate,
        v.state,
        v.manager,
        v.assignedTo,
        v.department,
        v.registration,
        v.inspection,
        v.vendorVehicleID,
        v.passType,
        v.passNumber,
      ];
      const matchesText = q === '' || fields.some(f => f?.toString().toLowerCase().includes(q));
      return matchesActive && matchesText;
    });
  }
}

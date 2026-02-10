import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { EquipmentService } from '../equipment.service';
import { Equipment } from '../equipment.model';

@Component({
  selector: 'app-equipment-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './equipment-list.html',
  styleUrls: ['./equipment-list.css']
})
export class EquipmentListComponent implements OnInit {
  /* List of locations to display */
  equipment: Equipment[] = [];
  /* Full list of locations from the server */
  private allEquipment: Equipment[] = [];
  filterText = '';
  activeFilter: boolean | null = true;

  constructor(private equipmentService: EquipmentService) {}

  /* Load all equipment on component initialization */
  ngOnInit() {
    this.equipmentService.getEquipment().subscribe({
      next: eq => {
        this.allEquipment = eq || [];
        this.applyFilters();
      },
      error: err => console.error('Error fetching equipment:', err)
    });
  }

  /* Filter equipment based on user input */
  onFilterChange(query: string) {
    this.filterText = query || '';
    this.applyFilters();
  }

  /* Central filter logic: text toggle */
  private applyFilters() {
    const q = this.filterText.toLowerCase().trim();

    this.equipment = this.allEquipment.filter(eq => {
      // active filter: if activeFilter is null, don't filter by active; otherwise match boolean

      // text search across multiple fields
      const fields = [
        eq.customer,
        eq.location,
        eq.entryStatus,
        eq.manufacturer,
        eq.model,
        eq.serialNumber,
        eq.tonnage,
        eq.age,
        eq.condition,
        eq.typeOfUnit,
        eq.dateLoaded
      ];
      const matchesQuery = !q || fields.some(f => !!f && String(f).toLowerCase().includes(q));

      return matchesQuery;
    });
  }

  /* Clear the filter input and reset equipment list */
  clearFilter() {
    this.filterText = '';
    this.applyFilters();
  }

  /* Delete a equipment after confirmation */
  onDelete(id: number) {
    if (!Number.isFinite(id) || id <= 0) return;
    if (!confirm(`Delete equipment #${id}?`)) return;

    this.equipmentService.deleteEquipment(id).subscribe({
      next: () => {
        this.equipment = this.equipment.filter(eq => eq.rowId !== id);
      },
      error: (err) => {
        console.error('Error deleting equipment:', err)
        alert('Failed to delete equipment. Please try again.');
      }
    });
  }
}
export interface VendorAsset {
  /** Unique identifier */
  rowId: number;
  /** Identifier of the vendor owning this asset */
  vendorId: number;
  /** Human-readable name of the asset */
  assetName: string;
  /** Whether the asset is currently active */
  active: boolean;
  /** Asset usage start time */
  startTime: Date;
  /** Asset usage end time */
  endTime: Date;
  /** Monthly cost or rate */
  monthly: number;
  /** User who created the record */
  createdBy?: string;
  /** Timestamp of creation */
  createdOn?: Date;
  /** Last user to modify the record */
  modifiedBy?: string;
  /** Timestamp of last modification */
  modifiedOn?: Date;
}

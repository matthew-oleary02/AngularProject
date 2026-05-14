// Domain model for vendor-rates entity
export interface VendorRates {
  rowId: number;
  vendorName: string;
  trade: string;
  rateType: string;
  state: string;
  rate: number;
}

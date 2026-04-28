// Domain model for vendor-rates entity
export interface VendorRates {
  id?: number;
  vendorName: string;
  trade: string;
  rateType: string;
  state: string;
  rate: number;
}

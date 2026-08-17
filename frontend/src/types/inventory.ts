import type { Timestamp } from "firebase-admin/firestore";

export type InventoryMaterial = "Copper" | "Aluminum" | "CRGO" | "Oil";

export const INVENTORY_MATERIALS: InventoryMaterial[] = ["Copper", "Aluminum", "CRGO", "Oil"];

/** Firestore document at `inventory/{material}` — doc ID is the material name itself. */
export interface InventoryDoc {
  availableKg: number;
  reservedKg: number;
  updatedAt: Timestamp;
  updatedBy: string;
}

/** Firestore document in the `inventory/{material}/batches` subcollection. */
export interface InventoryBatchDoc {
  heatNumber: string;
  receivedKg: number;
  receivedDate: Timestamp;
  createdAt: Timestamp;
  createdBy: string;
}

/** Firestore document in the `inventory/{material}/scrapLedger` subcollection. */
export interface ScrapLedgerEntryDoc {
  scrapKg: number;
  reason: string;
  reference: string | null;
  recordedAt: Timestamp;
  recordedBy: string;
}

export type Winding = "lv" | "hv";
export type IssuanceUom = "Meters" | "Turns";

/** Firestore document in the `designs/{id}/issuances` subcollection. */
export interface IssuanceDoc {
  winding: Winding;
  material: InventoryMaterial;
  uom: IssuanceUom;
  inputValue: number;
  computedKg: number;
  issuedAt: Timestamp;
  issuedBy: string;
}

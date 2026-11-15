import type { City } from "./renewalPolicy";

export const REGISTRY_KEY = "moveup-demo-registry-v1";
export const MAX_DEMO_RECORDS = 25;

export type SupportPurpose = "assistance" | "organizing";
export type DemoRegistryRecord = {
  id: string;
  createdAt: string;
  city: City;
  purposes: SupportPurpose[];
  issue: string;
  packet: string;
  delivery: "local_demo" | "moveup_demo_inbox";
};

/**
 * The current product has zero verified tenant-union receiving integrations.
 * Geographic grouping is a real demo operation, not proof of partner delivery.
 */
export const CITY_ROUTING: Record<City, { label: string; connectedUnions: 0 }> = {
  "Los Angeles": { label: "Los Angeles intake", connectedUnions: 0 },
  "San Francisco": { label: "San Francisco intake", connectedUnions: 0 },
  "San Diego": { label: "San Diego intake", connectedUnions: 0 },
  "Seattle": { label: "Seattle intake", connectedUnions: 0 },
};

export function createDemoRecord(input: {
  id: string; createdAt: string; city: City;
  purposes: SupportPurpose[]; issue: string; packet: string;
  delivery: "local_demo" | "moveup_demo_inbox";
}): DemoRegistryRecord {
  if (!input.purposes.length || !input.packet.trim() || !CITY_ROUTING[input.city]) {
    throw new Error("A valid city, purpose and case packet are required.");
  }
  return { ...input, purposes: [...new Set(input.purposes)] };
}

export function readDemoRegistry(store: Pick<Storage,"getItem">): DemoRegistryRecord[] {
  try {
    const raw = store.getItem(REGISTRY_KEY);
    if (!raw) return [];
    const saved: unknown = JSON.parse(raw);
    if (!Array.isArray(saved)) return [];
    return saved.filter((item): item is DemoRegistryRecord =>
      item && typeof item === "object" &&
      typeof item.id === "string" && typeof item.city === "string" &&
      Object.prototype.hasOwnProperty.call(CITY_ROUTING,item.city) &&
      Array.isArray(item.purposes) && typeof item.packet === "string" &&
      typeof item.createdAt === "string").slice(-MAX_DEMO_RECORDS);
  } catch { return []; }
}

export function saveDemoRecord(
  store: Pick<Storage,"getItem"|"setItem">, record: DemoRegistryRecord,
): DemoRegistryRecord[] {
  const next = [...readDemoRegistry(store),record].slice(-MAX_DEMO_RECORDS);
  store.setItem(REGISTRY_KEY,JSON.stringify(next));
  return next;
}

export function clearDemoRegistry(store: Pick<Storage,"removeItem">): void {
  store.removeItem(REGISTRY_KEY);
}

export function countDemoRecordsByCity(records: DemoRegistryRecord[]): Record<City,number> {
  return Object.keys(CITY_ROUTING).reduce((counts,key)=>{
    const city=key as City;
    counts[city]=records.filter(r=>r.city===city).length;
    return counts;
  },{} as Record<City,number>);
}

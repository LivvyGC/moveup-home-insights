import type { City } from "../lib/renewalPolicy";

export type OrganizationKind = "Tenant union" | "Tenant organizing" | "Tenant counseling" | "Legal support";
export type TenantOrganization = {
  id: string;
  city: City;
  name: string;
  kind: OrganizationKind;
  summary: string;
  url: string;
  sourceUrl: string;
  focus: "organizing" | "assistance" | "both";
};

/**
 * Curated public examples, checked 2026-11-14.
 * Listing is NOT partnership, endorsement, comprehensive market sizing,
 * eligibility verification, or proof of services offered to every visitor.
 */
export const TENANT_ORGANIZATIONS: readonly TenantOrganization[] = [
  {
    id:"la-latu",city:"Los Angeles",name:"Los Angeles Tenants Union",
    kind:"Tenant union",focus:"organizing",
    summary:"Member-led local chapters for renter organizing and collective action.",
    url:"https://latenantsunion.org/locals/",
    sourceUrl:"https://latenantsunion.org/about/",
  },
  {
    id:"la-iu",city:"Los Angeles",name:"Inquilinos Unidos",
    kind:"Tenant organizing",focus:"both",
    summary:"Tenant education, advocacy and organizing in Los Angeles communities.",
    url:"https://www.inquilinosunidos.org/",
    sourceUrl:"https://www.inquilinosunidos.org/",
  },
  {
    id:"la-tenants-ca",city:"Los Angeles",name:"Tenants of California",
    kind:"Tenant organizing",focus:"both",
    summary:"Tenant education, resource referrals and tenant association support.",
    url:"https://www.tenantsofla.com/",
    sourceUrl:"https://www.tenantsofla.com/",
  },
  {
    id:"sf-sftu",city:"San Francisco",name:"San Francisco Tenants Union",
    kind:"Tenant union",focus:"both",
    summary:"Tenant-rights counseling, education and renter advocacy.",
    url:"https://sftu.org/",
    sourceUrl:"https://sftu.org/",
  },
  {
    id:"sf-hrcsf",city:"San Francisco",name:"Housing Rights Committee of SF",
    kind:"Tenant counseling",focus:"both",
    summary:"Tenant-rights counseling and organizing for San Francisco renters.",
    url:"https://www.hrcsf.org/tenant-counseling-services",
    sourceUrl:"https://www.hrcsf.org/about-us",
  },
  {
    id:"sd-tcsd",city:"San Diego",name:"Tenant Councils of San Diego",
    kind:"Tenant union",focus:"organizing",
    summary:"Member-led tenant councils and neighborhood organizing.",
    url:"https://actionnetwork.org/groups/tcsd",
    sourceUrl:"https://actionnetwork.org/groups/tcsd",
  },
  {
    id:"sd-acce",city:"San Diego",name:"ACCE Action, San Diego",
    kind:"Tenant organizing",focus:"organizing",
    summary:"Grassroots housing justice campaigns and renter organizing.",
    url:"https://www.acceaction.org/san_diego",
    sourceUrl:"https://www.acceaction.org/san_diego",
  },
  {
    id:"sd-lassd",city:"San Diego",name:"Legal Aid Society of San Diego",
    kind:"Legal support",focus:"assistance",
    summary:"Free housing-related legal information and help, subject to eligibility.",
    url:"https://www.lassd.org/resource/landlord-tenant-issues/",
    sourceUrl:"https://www.lassd.org/resource/landlord-tenant-issues/",
  },
  {
    id:"sea-tuwa",city:"Seattle",name:"Tenants Union of Washington State",
    kind:"Tenant union",focus:"both",
    summary:"Renter education, organizing and tenant-rights information.",
    url:"https://tenantsunion.org/",
    sourceUrl:"https://tenantsunion.org/",
  },
  {
    id:"sea-pstu",city:"Seattle",name:"Puget Sound Tenants Union",
    kind:"Tenant union",focus:"organizing",
    summary:"Collective renter organizing across Seattle and Puget Sound.",
    url:"https://soundtenants.org/",
    sourceUrl:"https://soundtenants.org/",
  },
  {
    id:"sea-beseattle",city:"Seattle",name:"Be:Seattle",
    kind:"Tenant organizing",focus:"organizing",
    summary:"Renter organizing workshops and community housing advocacy.",
    url:"https://beseattle.org/",
    sourceUrl:"https://beseattle.org/",
  },
  {
    id:"sea-solidground",city:"Seattle",name:"Solid Ground Tenant Services",
    kind:"Tenant counseling",focus:"assistance",
    summary:"Renter education and housing counseling; does not provide rental assistance.",
    url:"https://www.solid-ground.org/housing/for-tenants/",
    sourceUrl:"https://www.solid-ground.org/housing/for-tenants/",
  },
] as const;

export const DIRECTORY_LAST_REVIEWED = "2026-11-14";

export function organizationsForCity(city:City):TenantOrganization[] {
  return TENANT_ORGANIZATIONS.filter(item=>item.city===city);
}
export function totalDirectoryOrganizations():number {
  return TENANT_ORGANIZATIONS.length;
}
export function organizationsByFocus(city:City,interest:"organizing"|"assistance"|"all"):TenantOrganization[] {
  const results=organizationsForCity(city);
  return interest==="all"?results:results.filter(item=>item.focus===interest||item.focus==="both");
}

/** Shared venue config for /api/availability — keep in sync with searchable courts in lib/locations.ts */

export type AvailabilityProvider = 'triangle' | 'matchi' | 'lta';

export interface AvailabilityLocationConfig {
  activityId: string;
  siteId: string;
  locationId: string;
  type: AvailabilityProvider;
}

export const AVAILABILITY_LOCATION_CONFIGS: Record<string, AvailabilityLocationConfig> = {
  'triangle-padel': {
    activityId: '149A001015',
    siteId: '149',
    locationId: '149ZPAD001',
    type: 'triangle',
  },
  'triangle-tennis': {
    activityId: '149A000010',
    siteId: '149',
    locationId: 'MultipleLocation_a9001c36-c5a8-42f0-9ac2-c33cfd0671d0',
    type: 'triangle',
  },
  'hove-tennis': {
    activityId: '2668',
    siteId: '1',
    locationId: '',
    type: 'matchi',
  },
  'hove-padel': {
    activityId: '2668',
    siteId: '5',
    locationId: '',
    type: 'matchi',
  },
  'patcham-tennis': {
    activityId: '883bec85-55c3-4765-82e9-87c94210abde',
    siteId: '',
    locationId: '',
    type: 'lta',
  },
  'archbishop-tennis': {
    activityId: '307b4855-9c90-4b69-b855-415ff80a7417',
    siteId: '',
    locationId: '',
    type: 'lta',
  },
  'geraldine-mary-tennis': {
    activityId: '8d4edcff-b880-4e21-a027-ca82cc343fa5',
    siteId: '',
    locationId: '',
    type: 'lta',
  },
  'kennington-park-tennis': {
    activityId: '38f9b2bb-b840-45a9-9c6e-dc685f04ed25',
    siteId: '',
    locationId: '',
    type: 'lta',
  },
  'burgess-park-tennis': {
    activityId: '12e87a80-3f5f-4985-9e81-eb064ba8f71b',
    siteId: '',
    locationId: '',
    type: 'lta',
  },
  'battersea-park-tennis': {
    activityId: 'b2eed0a9-2cf4-4d9d-95b8-46248117c9ba',
    siteId: '',
    locationId: '',
    type: 'lta',
  },
  'clapham-common-tennis': {
    activityId: '2fb20762-62d1-4fc7-961c-f4404d4d1ae8',
    siteId: '',
    locationId: '',
    type: 'lta',
  },
  'vauxhall-park-tennis': {
    activityId: 'ed2c2180-e21f-494a-bf03-199755c45b64',
    siteId: '',
    locationId: '',
    type: 'lta',
  },
  'finsbury-park-tennis': {
    activityId: '422ffc17-2283-483d-8ec3-65f7fda31a05',
    siteId: '',
    locationId: '',
    type: 'lta',
  },
  'clissold-park-tennis': {
    activityId: '24e84e6c-f529-4cd1-8793-cb0cc106e6e7',
    siteId: '',
    locationId: '',
    type: 'lta',
  },
  'victoria-park-tennis': {
    activityId: '6b29fc40-ca47-1067-b31d-714051078669',
    siteId: '',
    locationId: '',
    type: 'lta',
  },
  'london-fields-park-tennis': {
    activityId: 'c67a5893-b53e-4b77-8013-95fcfbe1526a',
    siteId: '',
    locationId: '',
    type: 'lta',
  },
  'southwark-park-tennis': {
    activityId: '4123ed12-8dd6-4f48-a706-6ab2fbde16ba',
    siteId: '',
    locationId: '',
    type: 'lta',
  },
  'tanner-st-park-tennis': {
    activityId: '678288d9-d179-40aa-8727-9db920d15fdc',
    siteId: '',
    locationId: '',
    type: 'lta',
  },
  'myatts-fields-park-tennis': {
    activityId: 'c7968b48-2c0c-4e2f-a2ae-850976a46f5e',
    siteId: '',
    locationId: '',
    type: 'lta',
  },
  'brockwell-park-tennis': {
    activityId: '03a2d315-2b9a-411d-8891-1bfde4cb4cf3',
    siteId: '',
    locationId: '',
    type: 'lta',
  },
  'stationers-park-tennis': {
    activityId: 'fdd0dd8d-f332-46a5-bb22-cb403ce136bf',
    siteId: '',
    locationId: '',
    type: 'lta',
  },
  'hackney-downs-park-tennis': {
    activityId: '3df475ea-0986-403a-9f64-e520e234c73a',
    siteId: '',
    locationId: '',
    type: 'lta',
  },
  'vauxhall-padel-yard': {
    activityId: '3011',
    siteId: '5',
    locationId: '',
    type: 'matchi',
  },
  'tower-hill-padel': {
    activityId: '2996',
    siteId: '5',
    locationId: '',
    type: 'matchi',
  },
  'hays-galleria-padel': {
    activityId: '3041',
    siteId: '5',
    locationId: '',
    type: 'matchi',
  },
};

export function hasAvailabilityApi(locationId: string): boolean {
  return locationId in AVAILABILITY_LOCATION_CONFIGS;
}

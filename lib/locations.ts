export type CourtType = 'padel' | 'tennis';
export type City = 'brighton' | 'london';

export interface CourtLocation {
  id: string;
  name: string;
  type: CourtType;
  available: boolean;
  description: string;
  hasFloodLights?: boolean;
  price?: string;
  city: City;
  lat: number;
  lng: number;
  bookingUrl?: string;
}

export const COURT_LOCATIONS: CourtLocation[] = [
  {
    id: 'triangle-padel',
    name: 'Triangle Padel',
    type: 'padel',
    available: true,
    description: 'The Triangle Leisure Centre - Padel Courts',
    hasFloodLights: true,
    price: 'Membership',
    city: 'brighton',
    lat: 50.8397,
    lng: -0.1504,
  },
  {
    id: 'triangle-tennis',
    name: 'Triangle Tennis',
    type: 'tennis',
    available: true,
    description: 'The Triangle Leisure Centre - Tennis Courts',
    hasFloodLights: true,
    price: 'Membership',
    city: 'brighton',
    lat: 50.8397,
    lng: -0.1504,
  },
  {
    id: 'patcham-tennis',
    name: 'Patcham Tennis',
    type: 'tennis',
    available: true,
    description: 'Patcham Tennis Courts',
    hasFloodLights: false,
    price: '£9.30',
    city: 'brighton',
    lat: 50.8648,
    lng: -0.1512,
  },
  {
    id: 'hove-padel',
    name: 'Hove Padel',
    type: 'padel',
    available: true,
    description: 'Seafront Padel Courts',
    hasFloodLights: true,
    price: '£28.00',
    city: 'brighton',
    lat: 50.8212,
    lng: -0.1632,
  },
  {
    id: 'hove-tennis',
    name: 'Hove Tennis',
    type: 'tennis',
    available: true,
    description: 'Seafront Tennis Courts',
    hasFloodLights: true,
    price: '£8.90',
    city: 'brighton',
    lat: 50.8212,
    lng: -0.1632,
  },
  {
    id: 'archbishop-tennis',
    name: 'Archbishops Park',
    type: 'tennis',
    available: true,
    description: 'Archbishops Park Tennis Courts',
    hasFloodLights: false,
    price: '£7.70',
    city: 'london',
    lat: 51.4877,
    lng: -0.1254,
    bookingUrl:
      'https://www.lta.org.uk/play/book-a-tennis-court/courts/archbishops-park_307b4855-9c90-4b69-b855-415ff80a7417/',
  },
  {
    id: 'geraldine-mary-tennis',
    name: 'Geraldine Mary',
    type: 'tennis',
    available: true,
    description: 'Geraldine Mary Harmsworth Tennis Courts',
    hasFloodLights: false,
    city: 'london',
    lat: 51.4945,
    lng: -0.1138,
    bookingUrl:
      'https://www.lta.org.uk/play/book-a-tennis-court/courts/geraldine-mary-harmsworth_8d4edcff-b880-4e21-a027-ca82cc343fa5/',
  },
  {
    id: 'kennington-park-tennis',
    name: 'Kennington Park',
    type: 'tennis',
    available: true,
    description: 'Kennington Park Tennis Courts',
    hasFloodLights: false,
    city: 'london',
    lat: 51.4824,
    lng: -0.1112,
    bookingUrl:
      'https://www.lta.org.uk/play/book-a-tennis-court/courts/kennington-park_38f9b2bb-b840-45a9-9c6e-dc685f04ed25/',
  },
  {
    id: 'burgess-park-tennis',
    name: 'Burgess Park',
    type: 'tennis',
    available: true,
    description: 'Burgess Park Tennis Courts',
    hasFloodLights: false,
    city: 'london',
    lat: 51.4834,
    lng: -0.0779,
    bookingUrl:
      'https://www.lta.org.uk/play/book-a-tennis-court/courts/burgess-park_12e87a80-3f5f-4985-9e81-eb064ba8f71b/',
  },
  {
    id: 'hyde-park-tennis',
    name: 'Hyde Park Tennis',
    type: 'tennis',
    available: false,
    description: 'Hyde Park Tennis Courts',
    hasFloodLights: false,
    price: '£9/hr',
    city: 'london',
    lat: 51.5078,
    lng: -0.1629,
  },
];

export const SEARCHABLE_COURTS = COURT_LOCATIONS.filter((c) => c.available);

export function getCourtById(id: string): CourtLocation | undefined {
  return COURT_LOCATIONS.find((c) => c.id === id);
}

export function courtsByCity(city: City): CourtLocation[] {
  return SEARCHABLE_COURTS.filter((c) => c.city === city);
}

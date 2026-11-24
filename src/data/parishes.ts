export interface Parish {
  id: string;
  name: string;
  city: string;
  address: string;
  lat: number;
  lng: number;
  shepherd: string;
  phone: string;
  founded: string;
  feast: string;
  schedule: { day: string; hours: string }[];
}

const wed = ['18 h 30', '19 h', '19 h 30'];
const fri = ['20 h', '21 h', '22 h'];
const sun = ['8 h 30', '9 h', '10 h', '10 h 30'];
const sched = (i: number) => [
  { day: 'Mercredi', hours: `${wed[i % 3]} — Culte de miséricorde` },
  { day: 'Vendredi', hours: `${fri[(i + 1) % 3]} — Veillée de prière` },
  { day: 'Dimanche', hours: `${sun[i % 4]} — Culte dominical` },
];

/** Paroisses de démonstration (positions approximatives). */
export const parishes: Parish[] = [
  { id: 'alpha-omega-djegbe', name: 'Alpha Oméga de Djègbé-Lokossa', city: 'Lokossa', address: 'Carrefour, Lokossa, Ouèssè/Djègbé, Bénin', lat: 6.6386, lng: 1.7167, shepherd: 'Berger fictif A. Houngbo', phone: '+229 01 00 00 00 01', founded: '1984-03-12', feast: '12 mars', schedule: sched(1) },
  { id: 'jericho-cotonou', name: 'Paroisse Jéricho', city: 'Cotonou', address: 'Akpakpa, Cotonou, Bénin', lat: 6.3654, lng: 2.4561, shepherd: 'Berger fictif J. Sossou', phone: '+229 01 00 00 00 02', founded: '1971-06-20', feast: '20 juin', schedule: sched(2) },
  { id: 'sion-porto-novo', name: 'Paroisse Sion', city: 'Porto-Novo', address: 'Quartier Ouando, Porto-Novo, Bénin', lat: 6.4969, lng: 2.6289, shepherd: 'Berger fictif M. Agbo', phone: '+229 01 00 00 00 03', founded: '1952-09-29', feast: '29 septembre', schedule: sched(3) },
  { id: 'bethel-calavi', name: 'Paroisse Béthel', city: 'Abomey-Calavi', address: 'Zogbadjè, Abomey-Calavi, Bénin', lat: 6.4485, lng: 2.3557, shepherd: 'Berger fictif P. Dossa', phone: '+229 01 00 00 00 04', founded: '1990-01-14', feast: '14 janvier', schedule: sched(4) },
  { id: 'emmanuel-ouidah', name: 'Paroisse Emmanuel', city: 'Ouidah', address: 'Route des Esclaves, Ouidah, Bénin', lat: 6.3631, lng: 2.0851, shepherd: 'Berger fictif E. Ahyi', phone: '+229 01 00 00 00 05', founded: '1979-12-25', feast: '25 décembre', schedule: sched(5) },
  { id: 'canaan-bohicon', name: 'Paroisse Canaan', city: 'Bohicon', address: 'Centre, Bohicon, Bénin', lat: 7.1782, lng: 2.0667, shepherd: 'Berger fictif K. Tossou', phone: '+229 01 00 00 00 06', founded: '1987-05-02', feast: '2 mai', schedule: sched(6) },
  { id: 'galilee-parakou', name: 'Paroisse Galilée', city: 'Parakou', address: 'Quartier Banikanni, Parakou, Bénin', lat: 9.3372, lng: 2.6303, shepherd: 'Berger fictif R. Fanou', phone: '+229 01 00 00 00 07', founded: '1995-08-15', feast: '15 août', schedule: sched(7) },
  { id: 'shiloh-cotonou', name: 'Paroisse Shiloh', city: 'Cotonou', address: 'Fidjrossè, Cotonou, Bénin', lat: 6.3527, lng: 2.3708, shepherd: 'Berger fictif S. Kiki', phone: '+229 01 00 00 00 08', founded: '2001-04-08', feast: '8 avril', schedule: sched(8) },
  { id: 'bethanie-allada', name: 'Paroisse Béthanie', city: 'Allada', address: 'Centre, Allada, Bénin', lat: 6.6651, lng: 2.1508, shepherd: 'Berger fictif L. Zinsou', phone: '+229 01 00 00 00 09', founded: '1983-11-30', feast: '30 novembre', schedule: sched(9) },
  { id: 'horeb-lome', name: 'Paroisse Horeb', city: 'Lomé', address: 'Bè, Lomé, Togo', lat: 6.1375, lng: 1.2123, shepherd: 'Berger fictif D. Akakpo', phone: '+228 90 00 00 10', founded: '1976-02-18', feast: '18 février', schedule: sched(10) },
  { id: 'nazareth-lagos', name: 'Paroisse Nazareth', city: 'Lagos', address: 'Ikeja, Lagos, Nigeria', lat: 6.6018, lng: 3.3515, shepherd: 'Berger fictif O. Adeyemi', phone: '+234 800 000 0011', founded: '1969-07-07', feast: '7 juillet', schedule: sched(11) },
  { id: 'galilee-abomey', name: 'Paroisse Siloé', city: 'Abomey', address: 'Goho, Abomey, Bénin', lat: 7.1829, lng: 1.9912, shepherd: 'Berger fictif G. Adjovi', phone: '+229 01 00 00 00 12', founded: '1998-10-10', feast: '10 octobre', schedule: sched(12) },
];

export const getParish = (id: string) => parishes.find((p) => p.id === id);

/** Distance à vol d'oiseau (km). */
export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

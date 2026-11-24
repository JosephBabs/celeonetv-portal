import type { Member } from './types';

/** Comptes de démonstration — personnes fictives. */
export const members: Member[] = [
  { id: 'admin', name: 'Admin Cèlè One', parish: 'Administration', hue: 172, official: true, verified: true },
  { id: 'celeone-tv', name: 'Cèlè One TV', parish: 'Chaîne officielle', hue: 172, official: true, verified: true },
  { id: 'celeone-officiel', name: 'Cèlè One Officiel', parish: 'Compte officiel', hue: 172, official: true, verified: true },
  { id: 'me', name: 'Isaac Togbé', parish: 'Paroisse Alpha Oméga, Lokossa', hue: 168 },
  { id: 'grace', name: 'Grâce Houénou', parish: 'Paroisse Jéricho, Cotonou', hue: 330, online: true, mutualFriends: 12, city: 'Cotonou', bio: 'Choriste · Servante dans la joie 🎶' },
  { id: 'joel', name: 'Joël Akpovi', parish: 'Paroisse Sion, Porto-Novo', hue: 210, online: true, mutualFriends: 4, city: 'Porto-Novo', bio: 'Pianiste de la chorale juniors' },
  { id: 'rachel', name: 'Rachel Dossou', parish: 'Paroisse Béthel, Abomey-Calavi', hue: 20, online: true, mutualFriends: 8, city: 'Abomey-Calavi', bio: 'Louange · Témoignages · Gratitude' },
  { id: 'samuel', name: 'Samuel Kpadé', parish: 'Paroisse Emmanuel, Ouidah', hue: 260, mutualFriends: 3 },
  { id: 'benedicte', name: 'Bénédicte Agossou', parish: 'Paroisse Canaan, Bohicon', hue: 45, online: true, mutualFriends: 15 },
  { id: 'pascal', name: 'Pascal Hounsa', parish: 'Paroisse Galilée, Parakou', hue: 120, mutualFriends: 1 },
  { id: 'ruth', name: 'Ruth Sossa', parish: 'Paroisse Shiloh, Cotonou', hue: 290, online: true, mutualFriends: 6 },
  { id: 'daniel', name: 'Daniel Ahouandjinou', parish: 'Paroisse Horeb, Lomé', hue: 190, mutualFriends: 2, private: true, city: 'Lomé' },
  { id: 'mireille', name: 'Mireille Zannou', parish: 'Paroisse Béthanie, Allada', hue: 355, mutualFriends: 9 },
  { id: 'fiacre', name: 'Fiacre Tchibozo', parish: 'Paroisse Nazareth, Lagos', hue: 95, online: true, mutualFriends: 5 },
  { id: 'eunice', name: 'Eunice Gbaguidi', parish: 'Paroisse Jéricho, Cotonou', hue: 15, mutualFriends: 7, city: 'Cotonou' },
  { id: 'josue', name: 'Josué Adandé', parish: 'Paroisse Sion, Porto-Novo', hue: 200, mutualFriends: 3, city: 'Porto-Novo' },
  { id: 'marthe', name: 'Marthe Kiki', parish: 'Paroisse Béthel, Abomey-Calavi', hue: 310, mutualFriends: 11, city: 'Abomey-Calavi' },
  { id: 'elie', name: 'Élie Dossa', parish: 'Paroisse Galilée, Parakou', hue: 140, mutualFriends: 2, city: 'Parakou' },
  { id: 'chorale', name: 'Chorale Saint-Gabriel', parish: 'Paroisse Sion, Porto-Novo', hue: 230, verified: true },
];

const byId = new Map(members.map((m) => [m.id, m]));

export function getMember(id: string): Member {
  return byId.get(id) ?? { id, name: 'Membre CélèOne', parish: '', hue: 170 };
}

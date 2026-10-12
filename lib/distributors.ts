/**
 * PAINTIRO points of sale shown on the Algeria map.
 *
 * ⚠️ EXAMPLE DATA: these entries only demonstrate the map. Replace every entry with
 * the real distributors (name, exact address, phone) before publishing the website.
 *
 * - `wilaya` is the official wilaya number (16 = Alger, 31 = Oran...), see lib/algeria-map.ts.
 * - `phone` is optional; when present a "Call" button appears.
 * - "Directions" opens Google Maps with the name + address.
 */

export type DistributorType = "distributor" | "store" | "showroom";

export type Distributor = {
  id: string;
  wilaya: number;
  name: string;
  city: string;
  address: string;
  phone?: string;
  type: DistributorType;
};

export const DISTRIBUTORS: Distributor[] = [
  { id: "alg-1", wilaya: 16, name: "PAINTIRO Showroom Alger", city: "Alger", address: "Centre-ville, Alger", type: "showroom" },
  { id: "alg-2", wilaya: 16, name: "Distributeur agréé PAINTIRO", city: "Bab Ezzouar", address: "Bab Ezzouar, Alger", type: "distributor" },
  { id: "alg-3", wilaya: 16, name: "Point de vente PAINTIRO", city: "Chéraga", address: "Chéraga, Alger", type: "store" },
  { id: "bli-1", wilaya: 9, name: "Distributeur agréé PAINTIRO", city: "Blida", address: "Centre-ville, Blida", type: "distributor" },
  { id: "bou-1", wilaya: 35, name: "Point de vente PAINTIRO", city: "Boumerdès", address: "Centre-ville, Boumerdès", type: "store" },
  { id: "tiz-1", wilaya: 15, name: "Distributeur agréé PAINTIRO", city: "Tizi Ouzou", address: "Centre-ville, Tizi Ouzou", type: "distributor" },
  { id: "bej-1", wilaya: 6, name: "Point de vente PAINTIRO", city: "Béjaïa", address: "Centre-ville, Béjaïa", type: "store" },
  { id: "set-1", wilaya: 19, name: "Distributeur agréé PAINTIRO", city: "Sétif", address: "Centre-ville, Sétif", type: "distributor" },
  { id: "set-2", wilaya: 19, name: "Point de vente PAINTIRO", city: "El Eulma", address: "El Eulma, Sétif", type: "store" },
  { id: "con-1", wilaya: 25, name: "PAINTIRO Showroom Constantine", city: "Constantine", address: "Centre-ville, Constantine", type: "showroom" },
  { id: "ann-1", wilaya: 23, name: "Distributeur agréé PAINTIRO", city: "Annaba", address: "Centre-ville, Annaba", type: "distributor" },
  { id: "bat-1", wilaya: 5, name: "Point de vente PAINTIRO", city: "Batna", address: "Centre-ville, Batna", type: "store" },
  { id: "ora-1", wilaya: 31, name: "PAINTIRO Showroom Oran", city: "Oran", address: "Centre-ville, Oran", type: "showroom" },
  { id: "ora-2", wilaya: 31, name: "Distributeur agréé PAINTIRO", city: "Bir El Djir", address: "Bir El Djir, Oran", type: "distributor" },
  { id: "tle-1", wilaya: 13, name: "Point de vente PAINTIRO", city: "Tlemcen", address: "Centre-ville, Tlemcen", type: "store" },
  { id: "chl-1", wilaya: 2, name: "Distributeur agréé PAINTIRO", city: "Chlef", address: "Centre-ville, Chlef", type: "distributor" },
  { id: "bis-1", wilaya: 7, name: "Point de vente PAINTIRO", city: "Biskra", address: "Centre-ville, Biskra", type: "store" },
  { id: "gha-1", wilaya: 47, name: "Distributeur agréé PAINTIRO", city: "Ghardaïa", address: "Centre-ville, Ghardaïa", type: "distributor" },
  { id: "oua-1", wilaya: 30, name: "Point de vente PAINTIRO", city: "Ouargla", address: "Centre-ville, Ouargla", type: "store" },
];

// Gedeelde functies van het paneel, ingevuld door app.js (vermijdt kringverwijzingen tussen weergaven).
export const app = {
  preview: null,
  navigeer: (hash) => { location.hash = hash; },
  gaNaarVeld: () => {},
  opslaan: async () => {},
  ververs: () => {},
  zetPreviewZichtbaar: () => {},
  analyse: null, // belofte van de lopende analyse
};

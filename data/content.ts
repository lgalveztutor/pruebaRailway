export const SITE = {
  name: 'La Chispa Gamer',
  version: '1.8',
  fullName: 'La Chispa Gamer 1.8',
  themeColor: '#0E0F14',
  metaTitle: 'La Chispa Gamer 1.8 · El nuevo punto gamer de Berazategui',
  metaDescription: 'PS5, realidad virtual, baile y la única mesa de PoolFútbol oficial del país. Reservá por hora o festejá tu cumpleaños en Berazategui Centro.',
};

export const CONTACT = {
  whatsappPhone: '5491159045262',
  whatsappDisplay: '+54 9 11 6846-8563',
  instagramHandle: '@lachispagamer1.8',
  instagramUrl: 'https://instagram.com/lachispagamer1.8',
};

export const LOCATION = {
  addressLine: 'Av. 14 N°4143',
  cityLine: 'Berazategui Centro, Buenos Aires',
  mapsUrl: 'https://www.google.com/maps?q=-34.764437,-58.213813',
  iframeSrc: 'https://maps.google.com/maps?q=-34.764437,-58.213813&hl=es&z=17&output=embed',
  coords: '-34.764437,-58.213813',
};

export const PRICING = {
  hourFrom: '$—',
  poolFutbol: 'Mesa 6×3',
};

export const WHATSAPP_TEMPLATES = {
  reserveTurn: '¡Hola La Chispa Gamer! 👋 Quiero reservar un turno para jugar. ¿Tienen disponibilidad?',
  poolFutbol: '¡Hola La Chispa Gamer! 👋 Quiero reservar una partida de PoolFútbol. ¿Qué disponibilidad tienen?',
  birthdayInfo: '¡Hola La Chispa Gamer! 👋 Quiero info para festejar un cumpleaños. ¿Me pasan los detalles?',
  hourBooking: '¡Hola La Chispa Gamer! 👋 Quiero reservar una hora de juego. ¿Qué turnos tienen libres?',
  comboFriends: '¡Hola LaChispaGamer! Quiero averiguar el "Pack de horas" con - COMBO AMIGOS - y probar todas las experiencias del salón!',
};

export const HOME_COPY = {
  heroTitleLeft: 'El nuevo punto gamer de',
  heroTitleHighlight: 'Berazategui',
  heroSubtitle: 'PS5, realidad virtual, baile y la única mesa de PoolFútbol oficial del país. Vení con amigos, festejá tu cumple o jugá por hora.',
  trust: ['Nuevo en Berazategui', 'Alquiler por hora', 'Cumpleaños'],
  footerIntro: 'El nuevo punto gamer de Berazategui. PS5, realidad virtual, baile y la única mesa de PoolFútbol del país.',
};

export function buildWhatsappUrl(message: string) {
  const text = encodeURIComponent(message);
  return `https://wa.me/${CONTACT.whatsappPhone}?text=${text}`;
}

export function replaceWhatsappPhone(url: string) {
  return String(url || '').replace(/wa\.me\/\d+/, `wa.me/${CONTACT.whatsappPhone}`);
}
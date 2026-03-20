// 📰 Contapyme V2 — Mocks Premium de Noticias Magallanes
// Fechas ISO fijas para evitar errores de hidratación entre SSR y Cliente.

export const MOCK_NEWS = [
  {
    id: '1',
    title: 'Era del Hidrógeno Verde: Magallanes proyecta inversión histórica de US$ 15.000 millones.',
    slug: 'era-del-hidrogeno-verde-magallanes-proyecta-inversion-historica',
    category: 'INVERSIONES',
    content: 'La región de Magallanes se prepara para liderar la transición energética global con proyectos de gran escala y tecnología de punta. Se espera que los primeros parques eólicos comiencen su construcción el próximo semestre, generando miles de empleos directos e indirectos en la zona.',
    image_url: '/news-hydrogen.png',
    source_url: 'https://laprensaaustral.cl',
    published_at: '2026-03-18T12:00:00Z',
    is_featured: true,
    summary: 'Magallanes liderará la transición energética global con una inversión de US$ 15.000 millones en hidrógeno verde.'
  },
  {
    id: '2',
    title: 'Deportes: Regional de Fútbol inicia con récord de asistencia en el Estadio Fiscal.',
    slug: 'deportes-regional-de-futbol-inicia-con-record-de-asistencia',
    category: 'DEPORTES',
    content: 'Miles de magallánicos se reunieron para celebrar el inicio del torneo más importante del extremo sur. El ambiente fue de total fiesta regional pese a las bajas temperaturas, demostrando el compromiso de la comunidad con el deporte local.',
    image_url: '/news-stadium.png',
    source_url: 'https://elpinguino.com',
    published_at: '2026-03-19T08:00:00Z',
    is_featured: false,
    summary: 'Récord de asistencia en el inicio del torneo regional de fútbol de Magallanes.'
  },
  {
    id: '3',
    title: 'Alerta Climática: Vientos de hasta 100km/h se esperan para el fin de semana en Magallanes.',
    slug: 'alerta-climatica-vientos-de-hasta-100kmh-se-esperan-para-el-fin-de-semana',
    category: 'CLIMA',
    content: 'La Onemi regional hace un llamado a la precaución debido a las fuertes ráfagas pronosticadas. Se recomienda asegurar techumbres y evitar actividades al aire libre cerca de la costa o zonas expuestas. Se espera que las rachas más intensas ocurran el sábado por la tarde.',
    image_url: '/news-weather.png',
    source_url: 'https://laprensaaustral.cl',
    published_at: '2026-03-19T10:00:00Z',
    is_featured: false,
    summary: 'Onemi activa alerta por fuertes vientos en toda la región de Magallanes para este sábado.'
  },
  {
    id: '4',
    title: 'Horóscopo Regional: ¿Qué dicen los astros del sur sobre el inicio de este nuevo ciclo?',
    slug: 'horoscopo-regional-que-dicen-los-astros-del-sur',
    category: 'CULTURA',
    content: 'Descubre lo que el cielo de la Patagonia tiene preparado para tu signo este mes. Una alineación única en el hemisferio sur promete cambios positivos para quienes buscan emprender en sectores tecnológicos y sustentables.',
    image_url: '/news-horoscopo.png',
    source_url: 'https://elpinguino.com',
    published_at: '2026-03-19T14:00:00Z',
    is_featured: false,
    summary: 'Descubre los vaticinios para este mes bajo los cielos de la Patagonia.'
  }
];

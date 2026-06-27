import { cookies } from 'next/headers'

export type Locale = 'en' | 'es'

// ─── Translation strings ──────────────────────────────────────────

const en = {
  // Common
  save: 'Save', cancel: 'Cancel', delete: 'Delete', edit: 'Edit', close: 'Close',
  optional: 'optional', loading: 'Loading…', undo: 'Undo',

  // Auth
  signIn: 'Sign in', signOut: 'Sign out',
  signInGoogle: 'Sign in with Google',
  sendMagicLink: 'Send magic link', sending: 'Sending…',
  emailAddress: 'Email address',
  noPassword: 'No account or password needed.',
  checkEmail: 'Check your email',
  checkEmailBody: "We sent a sign-in link to . Click it to finish signing in — no password needed.",
  useDifferentEmail: 'Use a different email',
  loginSubtitle: 'Your name will be credited automatically when you add or edit family members.',
  signingAs: 'Signed in as',
  switchAccount: 'Switch account',

  // Home / landing
  appTitle: 'Family Calendar',
  appSubtitle: 'Build your family tree — birthdays and anniversaries fill the calendar automatically.',
  createTitle: 'Create your family calendar',
  createSubtitle: "You'll get a share link for family members and a private manage link.",
  familyName: 'Family name',
  familyNamePlaceholder: 'e.g. The Johnson Family',
  timezone: 'Timezone',
  hemisphere: 'Hemisphere', northern: 'Northern', southern: 'Southern',
  showMemorial: 'Show memorial dates on the calendar',
  showMemorialDesc: 'When on, death anniversaries appear alongside birthdays.',
  createButton: 'Create calendar',
  getStarted: 'Sign in to get started',
  noPasswordShort: 'No password needed — magic link or Google',
  myCalendarsLink: '← My calendars',

  // Stats / tree header
  people: 'people', person: 'person',
  relationships: 'relationships', relationship: 'relationship',
  generations: 'generations', couples: 'couples', oldest: 'Oldest',
  live: 'Live',

  // Search & canvas
  searchPlaceholder: 'Search family members…',
  found: 'found', noMatches: 'No matches',
  fitView: '⊞ Fit view', resetLayout: '↺ Reset layout', savingDots: 'Saving…',
  dragTip: 'Drag cards to rearrange · positions auto-saved · zoom with scroll',
  tapTip: 'Pan by dragging · Zoom with scroll · Tap a card to view profile',
  emptyTitle: 'No one in the tree yet',
  emptyDesc: 'Add the first family member using the form below.',

  // Who are you
  whoAreYou: 'Who are you?', identifyYourself: 'Identify yourself in the tree',
  clearMe: "Clear — I'm not in this tree",

  // Add person
  addMember: 'Add a family member',
  addMemberDesc: 'Just add their details — you can connect them to the tree later.',
  addingAs: 'Adding as',
  yourName: 'Your name',
  theirName: 'Their name',
  photo: 'Photo',
  maidenName: 'Maiden / birth name',
  birthday: 'Birthday',
  passedAway: 'Passed away',
  dateOfPassing: 'Date of passing',
  familyBranch: "Family branch",
  familyBranchPlaceholder: "e.g. Dad's side",
  shortBio: 'Short bio',
  bioPh: 'A few words about them…',
  linkExisting: 'Also link to an existing person (optional)',
  removeRel: 'Remove relationship',
  addToTree: 'Add to family tree',

  // Link / relationship
  linkPeople: 'Link two people',
  linkPeopleDesc: 'Connect family members with a relationship.',
  linkingAs: 'Linking as',
  relatedTo: 'Related to',
  selectPerson: 'Select a person…',
  relType: 'Relationship',
  rel_partner: 'Partner / Spouse', rel_parentChild: 'Parent → Child', rel_sibling: 'Siblings',
  relStatus: 'Status', married: 'Married', partners: 'Partners', divorced: 'Divorced',
  weddingDate: 'Wedding date',
  personIsThe: 'This new person is the…',
  isChild: 'Child (the selected person is their parent)',
  isParent: 'Parent (the selected person is their child)',
  linkBtn: 'Link these people',
  personA: 'Person A', personB: 'Person B', parentLabel: 'Parent', childLabel: 'Child',
  siblingA: 'Sibling A', siblingB: 'Sibling B',

  // Profile modal
  familyMemberLabel: 'Family member',
  profileTab: 'Profile', memoriesTab: 'Memories',
  bornLabel: 'Born', ageLabel: 'age', deceasedLabel: 'Deceased', passedLabel: 'Passed',
  addedBy: 'Added by',
  childOf: 'Child of', partnerOf: 'Partner of', exPartnerOf: 'Ex-partner of',
  parentOf: 'Parent of', siblingOf: 'Sibling of',
  noMemories: 'No memories yet. Add the first one above!',
  addMemoryBtn: '+ Add memory / life event', saveMemory: 'Save memory',
  memoryTitle: 'Title', memoryTitlePh: 'e.g. 5th Birthday, Graduation, Wedding Day',
  memoryNote: 'Note (optional)', memoryNotePh: 'A few words about this moment…',

  // Manage
  privateWarning: "This is your private manage link — keep it secret. Anyone with this URL can edit or delete entries.",
  manageSettings: 'Calendar settings', managePeople: 'People', manageRels: 'Relationships',
  viewTree: 'View tree →', saveSettings: 'Save settings',
  printBtn: '🖨 Print calendar', icsBtn: '↓ .ics export',
  deleting: 'Deleting',

  // Dashboard
  myCalendars: 'My calendars', noCalendars: 'No calendars yet',
  noCalendarsDesc: 'Create your first family tree to get started.',
  newCalendar: '+ New calendar', createLink: 'Create a calendar',
  shareLink: '🔗 Share link', manageLink: '🔑 Manage link', keepPrivate: '(keep private)',

  // Created page
  calendarReady: 'Your calendar is ready!',
  shareWithFamily: 'Share the link below with family to start building the tree.',
  shareLinkLabel: 'Share link',
  shareAnyone: 'Anyone with this link can add people to the family tree.',
  manageLinkLabel: 'Your manage link',
  managePrivate: 'Keep this private. Lets you edit, moderate, and export the tree.',
  findInDashboard: 'You can always find this link again in your',
  dashboardWord: 'Dashboard',
  startBuilding: 'Start building your family tree →',
  backToCalendars: '← Back to my calendars',

  // CTA / footer
  startOwnTree: '🌱 Start your own tree',
  startOwnDesc: 'Create a separate tree to share with your branch of the family.',
  wantOwn: 'Want your own family calendar?',
  shareToSocial: '📤 Share to social',
  printCalendar: '🖨 Print calendar',

  // Upcoming events
  upcomingTitle: '📅 Coming up in the next 30 days',
  inDays: 'in', today: 'today',

  // Share / snapshot
  sharePageTitle: 'Share this family tree',
  readOnly: 'This page is read-only — no one can add or edit through this link.',
  downloadInstagram: '📸 Download image for Instagram',
  copyLink: '🔗 Copy link', copied: 'Copied!',

  // Print
  allEvents: 'All events',

  feature_share: 'Share a link',
  feature_shareDesc: 'Family adds themselves',
  feature_calendar: 'Auto calendar',
  feature_calendarDesc: 'Birthdays & anniversaries',
  feature_manage: 'You manage it',
  feature_manageDesc: 'Private owner link',

  months: ['January','February','March','April','May','June','July','August','September','October','November','December'],
  monthsShort: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
  days: ['Su','Mo','Tu','We','Th','Fr','Sa'],
} satisfies Record<string, unknown>

const es: typeof en = {
  save: 'Guardar', cancel: 'Cancelar', delete: 'Eliminar', edit: 'Editar', close: 'Cerrar',
  optional: 'opcional', loading: 'Cargando…', undo: 'Deshacer',

  signIn: 'Iniciar sesión', signOut: 'Cerrar sesión',
  signInGoogle: 'Iniciar sesión con Google',
  sendMagicLink: 'Enviar enlace mágico', sending: 'Enviando…',
  emailAddress: 'Correo electrónico',
  noPassword: 'Sin cuenta ni contraseña.',
  checkEmail: 'Revisa tu correo',
  checkEmailBody: 'Enviamos un enlace de acceso a . Haz clic para terminar — no necesitas contraseña.',
  useDifferentEmail: 'Usar otro correo',
  loginSubtitle: 'Tu nombre se acreditará automáticamente cuando agregues o edites familiares.',
  signingAs: 'Sesión iniciada como',
  switchAccount: 'Cambiar cuenta',

  appTitle: 'Calendario Familiar',
  appSubtitle: 'Construye tu árbol genealógico — los cumpleaños y aniversarios llenan el calendario automáticamente.',
  createTitle: 'Crear tu calendario familiar',
  createSubtitle: 'Obtendrás un enlace para compartir con la familia y un enlace privado de gestión.',
  familyName: 'Nombre de la familia',
  familyNamePlaceholder: 'p.ej. La Familia Salazar',
  timezone: 'Zona horaria',
  hemisphere: 'Hemisferio', northern: 'Norte', southern: 'Sur',
  showMemorial: 'Mostrar fechas de difuntos en el calendario',
  showMemorialDesc: 'Cuando está activado, los aniversarios de fallecimiento aparecen junto a los cumpleaños.',
  createButton: 'Crear calendario',
  getStarted: 'Inicia sesión para comenzar',
  noPasswordShort: 'Sin contraseña — enlace mágico o Google',
  myCalendarsLink: '← Mis calendarios',

  people: 'personas', person: 'persona',
  relationships: 'relaciones', relationship: 'relación',
  generations: 'generaciones', couples: 'parejas', oldest: 'Mayor',
  live: 'En vivo',

  searchPlaceholder: 'Buscar familiar…',
  found: 'encontrado(s)', noMatches: 'Sin resultados',
  fitView: '⊞ Ajustar vista', resetLayout: '↺ Restablecer diseño', savingDots: 'Guardando…',
  dragTip: 'Arrastra las tarjetas para reorganizar · posiciones guardadas automáticamente · zoom con scroll',
  tapTip: 'Arrastra para desplazar · Zoom con scroll · Toca una tarjeta para ver el perfil',
  emptyTitle: 'Aún no hay nadie en el árbol',
  emptyDesc: 'Agrega el primer familiar usando el formulario de abajo.',

  whoAreYou: '¿Quién eres?', identifyYourself: 'Identifícate en el árbol',
  clearMe: 'Borrar — no estoy en este árbol',

  addMember: 'Agregar un familiar',
  addMemberDesc: 'Solo agrega sus datos — puedes conectarlo al árbol después.',
  addingAs: 'Agregando como',
  yourName: 'Tu nombre',
  theirName: 'Su nombre',
  photo: 'Foto',
  maidenName: 'Apellido de soltera / nombre de nacimiento',
  birthday: 'Cumpleaños',
  passedAway: 'Falleció',
  dateOfPassing: 'Fecha de fallecimiento',
  familyBranch: 'Rama familiar',
  familyBranchPlaceholder: 'p.ej. Lado de mamá',
  shortBio: 'Breve descripción',
  bioPh: 'Algunas palabras sobre esta persona…',
  linkExisting: 'También vincular con una persona existente (opcional)',
  removeRel: 'Quitar relación',
  addToTree: 'Agregar al árbol familiar',

  linkPeople: 'Vincular dos personas',
  linkPeopleDesc: 'Conecta familiares con una relación.',
  linkingAs: 'Vinculando como',
  relatedTo: 'Relacionado con',
  selectPerson: 'Selecciona una persona…',
  relType: 'Tipo de relación',
  rel_partner: 'Pareja / Esposo(a)', rel_parentChild: 'Padre/Madre → Hijo(a)', rel_sibling: 'Hermanos',
  relStatus: 'Estado', married: 'Casados', partners: 'Pareja', divorced: 'Divorciados',
  weddingDate: 'Fecha de boda',
  personIsThe: 'Esta nueva persona es el/la…',
  isChild: 'Hijo(a) (la persona seleccionada es su padre/madre)',
  isParent: 'Padre/Madre (la persona seleccionada es su hijo(a))',
  linkBtn: 'Vincular estas personas',
  personA: 'Persona A', personB: 'Persona B', parentLabel: 'Padre/Madre', childLabel: 'Hijo(a)',
  siblingA: 'Hermano(a) A', siblingB: 'Hermano(a) B',

  familyMemberLabel: 'Familiar',
  profileTab: 'Perfil', memoriesTab: 'Recuerdos',
  bornLabel: 'Nació', ageLabel: 'años', deceasedLabel: 'Fallecido(a)', passedLabel: 'Falleció',
  addedBy: 'Agregado por',
  childOf: 'Hijo(a) de', partnerOf: 'Pareja de', exPartnerOf: 'Expareja de',
  parentOf: 'Padre/Madre de', siblingOf: 'Hermano(a) de',
  noMemories: 'Sin recuerdos todavía. ¡Agrega el primero arriba!',
  addMemoryBtn: '+ Agregar recuerdo / evento de vida', saveMemory: 'Guardar recuerdo',
  memoryTitle: 'Título', memoryTitlePh: 'p.ej. 5 años, Graduación, Boda',
  memoryNote: 'Nota (opcional)', memoryNotePh: 'Algunas palabras sobre este momento…',

  privateWarning: 'Este es tu enlace privado de gestión — mantenlo en secreto. Cualquiera con esta URL puede editar o eliminar entradas.',
  manageSettings: 'Configuración del calendario', managePeople: 'Personas', manageRels: 'Relaciones',
  viewTree: 'Ver árbol →', saveSettings: 'Guardar configuración',
  printBtn: '🖨 Imprimir calendario', icsBtn: '↓ Exportar .ics',
  deleting: 'Eliminando',

  myCalendars: 'Mis calendarios', noCalendars: 'Sin calendarios todavía',
  noCalendarsDesc: 'Crea tu primer árbol genealógico para comenzar.',
  newCalendar: '+ Nuevo calendario', createLink: 'Crear un calendario',
  shareLink: '🔗 Enlace para compartir', manageLink: '🔑 Enlace de gestión', keepPrivate: '(mantener privado)',

  calendarReady: '¡Tu calendario está listo!',
  shareWithFamily: 'Comparte el enlace de abajo con tu familia para empezar a construir el árbol.',
  shareLinkLabel: 'Enlace para compartir',
  shareAnyone: 'Cualquiera con este enlace puede agregar personas al árbol familiar.',
  manageLinkLabel: 'Tu enlace de gestión',
  managePrivate: 'Mantenlo privado. Te permite editar, moderar y exportar el árbol.',
  findInDashboard: 'Siempre puedes encontrar este enlace en tu',
  dashboardWord: 'Panel',
  startBuilding: 'Empezar a construir tu árbol familiar →',
  backToCalendars: '← Volver a mis calendarios',

  startOwnTree: '🌱 Inicia tu propio árbol',
  startOwnDesc: 'Crea un árbol separado para compartir con tu rama de la familia.',
  wantOwn: '¿Quieres tu propio calendario familiar?',
  shareToSocial: '📤 Compartir en redes',
  printCalendar: '🖨 Imprimir calendario',

  upcomingTitle: '📅 Próximos eventos en 30 días',
  inDays: 'en', today: 'hoy',

  sharePageTitle: 'Compartir este árbol genealógico',
  readOnly: 'Esta página es de solo lectura — nadie puede agregar ni editar con este enlace.',
  downloadInstagram: '📸 Descargar imagen para Instagram',
  copyLink: '🔗 Copiar enlace', copied: '¡Copiado!',

  allEvents: 'Todos los eventos',

  feature_share: 'Comparte un enlace',
  feature_shareDesc: 'La familia se agrega sola',
  feature_calendar: 'Calendario automático',
  feature_calendarDesc: 'Cumpleaños y aniversarios',
  feature_manage: 'Tú lo administras',
  feature_manageDesc: 'Enlace privado de gestión',

  months: ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'],
  monthsShort: ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'],
  days: ['Do','Lu','Ma','Mi','Ju','Vi','Sá'],
}

// ─── Helpers ──────────────────────────────────────────────────────

const dict: Record<Locale, typeof en> = { en, es }

export type TKey = keyof typeof en

/** Translate a key for a given locale. */
export function t(key: TKey, locale: Locale): string {
  const val = dict[locale][key] ?? dict.en[key]
  return Array.isArray(val) ? (val as string[]).join(',') : String(val)
}

/** Get typed array from a translation key (months, monthsShort, days). */
export function ta(key: 'months' | 'monthsShort' | 'days', locale: Locale): string[] {
  return dict[locale][key] as string[]
}

/** Server-side: read locale from cookie. */
export async function getLocale(): Promise<Locale> {
  const store = await cookies()
  const lang  = store.get('lang')?.value
  return lang === 'es' ? 'es' : 'en'
}

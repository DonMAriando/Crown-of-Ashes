'use strict';

function C(id,advisor,text,left,right,opt={}){
  return {
    id,advisor,text,left,right,
    weight:opt.weight??10,tags:opt.tags||[],rarity:opt.rarity||'común',
    requires:opt.requires||null,excludes:opt.excludes||null,cooldown:opt.cooldown??10,
    once:!!opt.once,chain:opt.chain||'',minReign:opt.minReign||0,maxReign:opt.maxReign||999,
    minDecision:opt.minDecision||0,maxDecision:opt.maxDecision||999,unlock:opt.unlock||null,
    years:opt.years??1,interrupt:!!opt.interrupt,season:opt.season||null,
    minAge:opt.minAge||0,maxAge:opt.maxAge||200,ally:!!opt.ally,foe:!!opt.foe,
    coda:opt.coda||null,tutorial:!!opt.tutorial,pack:opt.pack||null,
    consult:opt.consult||null,place:opt.place||null,work:opt.work||null,
    needsHeir:!!opt.needsHeir,needsHeirNamed:!!opt.needsHeirNamed,minHeirAge:opt.minHeirAge||0,
    allowGone:!!opt.allowGone
  };
}
function O(label,effects={},extra={}){return {label,effects,...extra}}

const VERSION='2.4.0';
const STAT_KEYS=['pueblo','tesoro','ejercito','saber'];
const STAT_LABELS={pueblo:'Pueblo',tesoro:'Tesoro',ejercito:'Ejército',saber:'Saber'};
const STAT_ICONS={pueblo:'♟',tesoro:'◆',ejercito:'⚔',saber:'✦'};
const STAT_TIPS={
  pueblo:'Si llega a 0, una revuelta te arrastra. Si llega a 100, una asamblea te declara innecesario.',
  tesoro:'Si llega a 0, la Corona quiebra. Si llega a 100, el oro te encierra en una jaula.',
  ejercito:'Si llega a 0, te invaden. Si llega a 100, tus generales te reemplazan.',
  saber:'Si llega a 0, la superstición te señala. Si llega a 100, los sabios te declaran hipótesis.'
};
const FACTION_KEYS=['nobleza','clero','gremios','frontera'];
const FACTION_LABELS={nobleza:'Nobleza',clero:'Clero',gremios:'Gremios',frontera:'Frontera'};
const NEIGHBOR_KEYS=['norte','sahr','ceniza'];
const NEIGHBOR_LABELS={norte:'Ducado del Norte',sahr:'Sahr',ceniza:'Paso de Ceniza'};
const SEASON_NAMES=['Primavera','Verano','Otoño','Invierno'];
const SEASON_KEYS=['spring','summer','autumn','winter'];

const ADVISORS={
  ines:{name:'Inés de Aramonte',title:'Cancillera de la Corona',glyph:'♛',mood:'◈',sil:'ines',portrait:'img/advisor-ines.jpg'},
  bruno:{name:'Bruno Varda',title:'Tesorero Real',glyph:'♜',mood:'◆',sil:'bruno',portrait:'img/advisor-bruno.jpg'},
  tala:{name:'Tala',title:'Voz de los Barrios',glyph:'♟',mood:'❖',sil:'tala',portrait:'img/advisor-tala.jpg'},
  roldan:{name:'Roldán Hierro',title:'Mariscal de Valdoria',glyph:'⚔',mood:'✣',sil:'roldan',portrait:'img/advisor-roldan.jpg'},
  elian:{name:'Elián de los Nueve',title:'Archivero Mayor',glyph:'✦',mood:'⌘',sil:'elian',portrait:'img/advisor-elian.jpg'},
  mara:{name:'Mara Velo',title:'Maestra de Espías',glyph:'◐',mood:'♠',sil:'mara',portrait:'img/advisor-mara.jpg'},
  odon:{name:'Odón Grís',title:'Médico de la Corte',glyph:'⚕',mood:'✧',sil:'odon',portrait:'img/advisor-odon.jpg'},
  soraya:{name:'Soraya del Estuario',title:'Almirante Mercante',glyph:'⚓',mood:'◇',sil:'soraya',portrait:'img/advisor-soraya.jpg'},
  naia:{name:'Naia Brumal',title:'Astróloga Proscrita',glyph:'☽',mood:'✦',sil:'naia',portrait:'img/advisor-naia.jpg'},
  garrik:{name:'Garrik del Umbral',title:'Embajador del Norte',glyph:'♞',mood:'❄',sil:'garrik',portrait:'img/advisor-garrik.jpg'},
  lupo:{name:'Lupo',title:'Bufón y Oído del Palacio',glyph:'☼',mood:'♣',sil:'lupo',portrait:'img/advisor-lupo.jpg'},
  ferran:{name:'Ferran Cobre',title:'Maestro de Gremios',glyph:'⚒',mood:'⬡',sil:'ferran',portrait:'img/advisor-ferran.jpg'},
  iva:{name:'Iva Grís',title:'Médica de la Corte',glyph:'⚕',mood:'✧',sil:'iva'}
};

const REGIONS=[
  {id:'capital',name:'Valdoria',d:'M118 92 L148 70 L176 88 L168 128 L122 130 Z',on:s=>true,hurt:s=>s.hidden.salud<30,mark:s=>s.flags.includes('hospital')?'Hospital':s.flags.includes('imprenta')?'Imprenta':''},
  {id:'puerto',name:'Puerto Azul',d:'M40 150 L88 138 L96 172 L52 186 Z',on:s=>s.flags.includes('puerto_franco')||s.flags.includes('mapa_costero')||s.flags.includes('banco'),hurt:s=>s.flags.includes('schism_open'),mark:s=>s.flags.includes('banco')?'Banco':s.flags.includes('puerto_franco')?'Puerto franco':''},
  {id:'valle',name:'Valle Hondo',d:'M96 96 L118 92 L122 130 L90 138 Z',on:s=>s.flags.includes('calzada_sur')||s.flags.includes('escuela'),hurt:s=>false,mark:s=>s.flags.includes('escuela')?'Escuela':''},
  {id:'marismas',name:'Las Marismas',d:'M88 138 L122 130 L140 168 L96 172 Z',on:s=>s.flags.includes('flood_canal')||s.flags.includes('flood_dike'),hurt:s=>s.flags.includes('flood_on')||s.flags.includes('flood_active'),mark:s=>s.flags.includes('flood_canal')?'Canal':''},
  {id:'piedra',name:'Piedra Alta',d:'M148 70 L188 48 L196 92 L176 88 Z',on:s=>s.flags.includes('piedra_reconquista'),hurt:s=>s.flags.includes('piedra_perdida')},
  {id:'frontera',name:'Frontera oriental',d:'M176 88 L196 92 L210 130 L168 128 Z',on:s=>s.flags.includes('pacto_norte')||s.flags.includes('academia_militar'),hurt:s=>false,mark:s=>s.flags.includes('academia_militar')?'Academia':''},
  {id:'isla',name:'Isla Bruma',d:'M28 168 L52 186 L44 208 L22 196 Z',on:s=>s.flags.includes('mapa_costero')},
  {id:'sur',name:'Viñedos del Sur',d:'M122 130 L168 128 L160 176 L140 168 Z',on:s=>s.flags.includes('calzada_sur')||s.flags.includes('silos'),hurt:s=>s.flags.includes('famine_active'),mark:s=>s.flags.includes('silos')?'Silos':s.flags.includes('calzada_sur')?'Calzada':''},
  {id:'paso',name:'Paso de Ceniza',d:'M188 48 L226 40 L230 78 L196 92 Z',on:s=>s.flags.includes('war_peace')||s.flags.includes('war_tribute'),hurt:s=>s.flags.includes('war_active')}
];

const deathReasons={
  puebloLow:['La ciudad dejó de obedecer. Una multitud atravesó las puertas del palacio antes del amanecer.','El reino se vació de lealtad. Tus estandartes ardieron en la plaza y nadie salió a defenderte.'],
  puebloHigh:['La voluntad popular devoró a la Corona. Una asamblea declaró que Valdoria ya no necesitaba soberano.','Fuiste amado hasta volverte innecesario: el pueblo te escoltó fuera del palacio entre vítores.'],
  tesoroLow:['La Corona quebró. Tus acreedores compraron jueces, guardias y, finalmente, tu trono.','Sin una moneda para pagar la guarnición, el palacio fue rematado por partes.'],
  tesoroHigh:['La riqueza se concentró tanto en palacio que mercaderes y nobles te encerraron en una jaula de oro.','El tesoro se volvió un poder propio. Tus administradores te declararon un gasto prescindible.'],
  ejercitoLow:['El ejército se deshizo. Una compañía de mercenarios cruzó la frontera y llegó a tu alcoba sin resistencia.','Los cuarteles estaban vacíos cuando sonaron las campanas de invasión.'],
  ejercitoHigh:['Tus generales descubrieron que tenían más hombres que vos. La coronación del mariscal fue breve.','El ejército ocupó cada plaza “por seguridad”. Al mediodía, también ocupó el trono.'],
  saberLow:['La ignorancia se volvió ley. Una epidemia de superstición terminó señalándote como la causa de todos los males.','Los archivos ardieron, las escuelas cerraron y el reino olvidó por qué debía obedecerte.'],
  saberHigh:['Los sabios concluyeron que la monarquía era una hipótesis innecesaria. Te reemplazaron por un Consejo de Cálculo.','La búsqueda de conocimiento abrió una puerta que nadie supo cerrar.'],
  age:['El cuerpo cedió antes que el reino. Odón cerró los ojos del soberano y pidió que nadie tocara la corona hasta el alba.','Se durmió durante un consejo sobre peajes y no despertó. Fue una muerte ofensivamente administrativa.','No fue una daga. Fue el invierno, por dentro.'],
  betrayal:['La copa llegó antes que la guardia. Los cuatro pilares seguían en pie. El oficio, no.'],
  betrayal_gold:['El vino tenía un dejo de cobre. Bruno juró que los libros cerraban. Cerraban, sí: sobre tu nombre.','Dormiste con el tesoro en calma. El copero no. Por eso despertó el reino sin vos.'],
  betrayal_protocol:['El ceremonial reservaba un asiento a tu izquierda. Desde ahí se corta la carne. Esa noche, también el reinado.','Firmaste de más y leíste de menos. El protocolo es un cuchillo que sonríe.'],
  betrayal_cipher:['El correo no pedía respuesta. Pedía un cambio de guardia a medianoche. La medianoche cumplió.','Mara habría avisado. O avisó, y alguien leyó antes que vos.'],
  abdicate:['Dejó la corona sobre la mesa, alineada con el tintero. El Consejo tardó un día en creer que no era una broma de Lupo.','Abdicó de pie. Dijo que el trono era un oficio, no un destino. El heredero no dijo nada: ya estaba sentado.']
};

const DELAYED={
  inflation:{advisor:'bruno',text:'La moneda adulterada perdió credibilidad. Los precios suben cada semana y los comerciantes exigen plata real.',left:O('Retirá las monedas',{tesoro:-10,pueblo:4},{hidden:{corrupcion:-4}}),right:O('Negá el problema',{tesoro:4,pueblo:-9},{hidden:{corrupcion:7}}),tags:['consecuencia','tesoro'],interrupt:true},
  powder_accident:{advisor:'roldan',text:'Explotó un depósito de pólvora junto a la muralla. Hay muertos y un enorme cráter.',left:O('Cerrá el programa',{ejercito:-7,saber:-5,pueblo:2}),right:O('Reconstruí mejor',{tesoro:-9,ejercito:6,saber:3}),tags:['consecuencia','tecnologia'],interrupt:true,years:0},
  mercenary_due:{advisor:'mara',text:'Los mercenarios reclaman una “gratificación de despedida”. Están acampados frente a la capital.',left:O('Que intenten cobrarla',{ejercito:-8,pueblo:-4},{hidden:{mercenarios:8}}),right:O('Pagales y que se vayan',{tesoro:-12,ejercito:-3},{hidden:{mercenarios:-10}}),tags:['consecuencia','ejercito'],interrupt:true},
  plague_stage1:{advisor:'odon',text:'Ya no hay dudas: la Fiebre de Vidrio se transmite entre personas. Los hospitales están llenos.',left:O('Priorizá el orden',{ejercito:5,pueblo:-8},{hidden:{salud:-8},setFlags:['plague_active']}),right:O('Priorizá la investigación',{saber:8,tesoro:-7},{hidden:{salud:-3},setFlags:['plague_active','plague_research']}),tags:['consecuencia','salud','arco'],chain:'Fiebre de Vidrio',interrupt:true},
  war_stage1:{advisor:'garrik',text:'La Guerra de las Tres Banderas cruzó el Paso de Ceniza. Ya combaten dentro de nuestras fronteras.',left:O('Fortificá y esperá',{ejercito:7,tesoro:-6,pueblo:-3},{setFlags:['war_active'],schedule:[{after:[12,18],type:'war_climax'}]}),right:O('Entrá en campaña',{ejercito:-4,tesoro:-8,pueblo:2},{setFlags:['war_active','war_campaign'],schedule:[{after:[9,14],type:'war_climax'}]}),tags:['consecuencia','guerra','arco'],chain:'Tres Banderas',interrupt:true},
  war_climax:{advisor:'roldan',text:'Ningún bando puede ganar. El Paso de Ceniza es un cementerio y todos buscan una salida.',left:O('Aplastemos al más débil',{ejercito:-7,tesoro:5},{setFlags:['war_climax']}),right:O('Prepará una conferencia',{saber:4,pueblo:3},{setFlags:['war_climax']}),tags:['consecuencia','guerra','arco'],chain:'Tres Banderas',interrupt:true},
  void_signal:{advisor:'naia',text:'La estrella negra respondió. Tres pulsos de luz, exactamente después de que encendiéramos el observatorio.',left:O('Apagalo para siempre',{saber:-5,pueblo:2},{setFlags:['void_closed']}),right:O('Respondé con tres pulsos',{saber:8},{hidden:{void:8},setFlags:['void_active']}),tags:['consecuencia','arcano','arco'],chain:'Observatorio Negro',interrupt:true,years:0},
  famine_stage:{advisor:'tala',text:'El Sur ya no pide: informa muertos. La capital todavía desayuna. Esa diferencia se oye.',left:O('Priorizá la capital',{pueblo:-6,tesoro:3},{setFlags:['famine_capital']}),right:O('Priorizá el Sur',{tesoro:-5,pueblo:4,ejercito:-2},{setFlags:['famine_south']}),tags:['consecuencia','arco'],chain:'Hambruna del Sur',interrupt:true},
  schism_stage:{advisor:'ines',text:'El cisma ya tiene himnos distintos en la misma misa. Un diácono se fue al muelle. Un marinero se arrodilló en tierra.',left:O('Que se separen',{pueblo:-4,saber:3},{setFlags:['schism_open']}),right:O('Una sola voz',{ejercito:3,pueblo:-5},{setFlags:['schism_open']}),tags:['consecuencia','arco'],chain:'Cisma del Estuario',interrupt:true},
  crisis_stage:{advisor:'mara',text:'Alguien clavó dos coronas de papel en la plaza. El pueblo se rió. Los guardias, no.',left:O('Arrancá los papeles',{ejercito:3,pueblo:-4},{setFlags:['crisis_open']}),right:O('Dejá que se rían',{pueblo:4,saber:2},{setFlags:['crisis_open'],hidden:{autoridad:-3}}),tags:['consecuencia','arco'],chain:'Crisis dinástica',interrupt:true,years:0},
  sahr_stage:{advisor:'soraya',text:'La embajada llegó a Sahr. El aire huele a especias y a cláusulas. ¿Seguimos tierra adentro o firmamos en el puerto?',left:O('Puerto y vuelta',{tesoro:3,saber:2},{setFlags:['sahr_away','sahr_return']}),right:O('Tierra adentro',{saber:5,ejercito:-2},{setFlags:['sahr_away']}),tags:['consecuencia','arco'],chain:'Viaje a Sahr'},
  mutiny_stage:{advisor:'roldan',text:'La guardia no abre la puerta del palacio. Dicen que esperan la paga. Dicen “por ahora”.',left:O('Forzá la puerta',{ejercito:-6,pueblo:-3},{setFlags:['mutiny_on']}),right:O('Hablá desde el balcón',{pueblo:3,ejercito:-2},{setFlags:['mutiny_on']}),tags:['consecuencia','arco'],chain:'Motín de la Guardia',interrupt:true,years:0},
  wedding_stage:{advisor:'ines',text:'Las casas aceptan la boda si vos aceptás una cláusula de sucesión que no leíste dos veces.',left:O('Leé dos veces',{saber:3,tesoro:-2},{setFlags:['wedding_on']}),right:O('Firmá y casá',{tesoro:4,pueblo:2},{setFlags:['wedding_on']}),tags:['consecuencia','arco'],chain:'Boda real'},
  flood_stage:{advisor:'tala',text:'El agua llegó al segundo templo. Los peces no rezan. La gente, sí, más alto.',left:O('Evacuá',{tesoro:-4,pueblo:5,ejercito:-3},{setFlags:['flood_on']}),right:O('Aguantad el dique',{ejercito:4,pueblo:-5,tesoro:-3},{setFlags:['flood_on']}),tags:['consecuencia','arco'],chain:'Inundación de las Marismas',interrupt:true},
  heresy_stage:{advisor:'elian',text:'El culto de la estrella ya no se esconde. Piden que la Corona “mire hacia abajo” en un acto público.',left:O('Prohibido',{ejercito:3,pueblo:-4,saber:-2},{setFlags:['heresy_on']}),right:O('Que miren',{saber:5,pueblo:2},{hidden:{void:4},setFlags:['heresy_on']}),tags:['consecuencia','arco'],chain:'Herejía de la estrella'},
  plot_gold_knock:{advisor:'lupo',text:'En la mesa hay un cubierto de más. Nadie se sienta ahí. El copero limpia ese lugar dos veces y no canta.',left:O('Es un cubierto sucio',{pueblo:1},{special:'plotIgnore',hidden:{autoridad:2}}),right:O('Contá los cubiertos',{saber:2},{special:'plotLook'}),tags:['consecuencia','arco'],chain:'La mesa de Bruno',interrupt:true,years:0,consult:'Si hay un cubierto de más, hay un oficio de menos.'},
  plot_protocol_knock:{advisor:'ines',text:'Falta una rúbrica en el protocolo del banquete. Alguien la arrancó. El espacio sigue caliente, como una silla recién ocupada.',left:O('Reescribí el ceremonial',{saber:1},{special:'plotIgnore',hidden:{autoridad:3}}),right:O('¿Quién rasgó la hoja?',{saber:3},{special:'plotLook'}),tags:['consecuencia','arco'],chain:'Firma del protocolo',interrupt:true,years:0,consult:'El protocolo no se rasga solo. Se rasga para que entre un cuchillo.'},
  plot_cipher_knock:{advisor:'mara',text:'Llegó un correo sin sello. El papel huele a Norte y a prisa. Nadie lo pidió. Yo tampoco, y eso me ofende.',left:O('Al fuego',{ejercito:2},{special:'plotIgnore',hidden:{inteligencia:-4}}),right:O('Leé conmigo',{saber:3},{special:'plotLook'}),tags:['consecuencia','arco'],chain:'Correo cifrado',interrupt:true,years:0,consult:'Un correo sin sello es una daga que todavía no eligió cuándo.'},
  age_death:{advisor:'odon',text:'El pulso se va. No es peste ni daga: es el oficio, cumplido. Pedí que nadie toque la corona hasta que el Consejo nombre la mano que sigue.',left:O('Cerrá los ojos',{},{special:'ageDeath'}),right:O('Llamad al heredero',{},{special:'ageDeath'}),tags:['consecuencia','dinastia'],chain:'El cuerpo cedió',interrupt:true,years:0,consult:'Odón no está preguntando. Está informando.'},
  kin_return:{advisor:'ines',text:'{kin} cruzó la puerta sin pedirle permiso al ceremonial. Dice que la cuna era la misma y la corona, no. Quiere tierra o un asiento.',left:O('Sin tierra',{ejercito:3,pueblo:-4},{hidden:{autoridad:3},special:'kinRefuse'}),right:O('Dales un feudo',{tesoro:-7,pueblo:3},{special:'kinSettle'}),tags:['consecuencia','dinastia'],chain:'La cuna que no heredó',interrupt:true,years:0},
  odon_farewell:{advisor:'odon',text:'Iva Grís ya sabe dónde está cada vena de palacio. Yo puedo quedarme un invierno más. O ceder la silla, que no se hereda: se deja.',left:O('Quedate un invierno',{saber:1},{special:'odonStay',relationship:{odon:2}}),right:O('La silla es de Iva',{saber:2,pueblo:1},{special:'odonGone'}),tags:['consecuencia','dinastia','salud'],chain:'El oficio se cede',interrupt:true,years:0,allowGone:true,consult:'Odón no pide permiso. Informa el recambio.'}
};
const DETONANTES={
  plague_active:'Fiebre de Vidrio',war_active:'Tres Banderas',void_active:'Estrella negra',void_door:'La puerta',
  famine_active:'Hambruna del Sur',schism_open:'Cisma del Estuario',schism_healed:'Los dos ritos',
  mutiny_on:'Motín de la Guardia',flood_on:'Inundación de las Marismas',heresy_on:'Herejía de la estrella',
  crisis_active:'Crisis dinástica',plot_named:'El nombre en la mesa',plot_foiled:'La daga no alcanzó',
  casado:'Nupcias de Estado',testamento:'Testamento',constitucion:'Carta de Derechos',
  hospital:'El hospital de la fortaleza',imprenta:'La imprenta de Ferran',plague_cured:'Cura de la fiebre',war_peace:'Paz de Ceniza',
  escuela:'La escuela del monasterio',banco:'El banco mercante',silos:'Los silos reales',
  calzada_sur:'La calzada del Sur',academia_militar:'La academia militar',puerto_franco:'Puerto Azul zona franca',
  segundo_hijo:'Segunda cuna',regencia:'Regencia',abdicate_rumor:'Rumores de abdicación',
  odon_gone:'Odón deja el oficio',iva_court:'Iva toma el pulso',kin_returned:'El pariente volvió',
  kin_settled:'Feudo para la otra cuna',kin_spurned:'La otra cuna, sin tierra',
  heir_named:'Heredero nombrado',heir_married:'Boda del heredero',abdicate_done:'Abdicación'
};

const PROCEDURAL={
  petitions:[
    ['Los {grupo} de {lugar} piden {obra}.','tala'],
    ['El gremio de {oficio} exige {demanda}.','ferran'],
    ['Una delegación de {lugar} reclama {demanda}.','ines'],
    ['Los soldados destinados en {lugar} solicitan {demandaMil}.','roldan']
  ],
  groups:['pescadores','campesinos','tejedores','canteros','estibadores','molineros','viudas de guerra','aprendices','carboneros','salineros'],
  places:['Puerto Azul','Valle Hondo','las Marismas','Piedra Alta','el barrio de las Campanas','la frontera oriental','Isla Bruma','los viñedos del Sur'],
  works:['un pozo nuevo','un puente de piedra','una escuela','un mercado cubierto','un canal de riego','una posta médica','una muralla contra inundaciones','un horno comunal'],
  trades:['herreros','curtidores','cerveceros','impresores','carpinteros','vidrieros','albañiles','navegantes','cereros','tejedores'],
  demands:['menos impuestos','protección contra competidores extranjeros','un asiento en el Consejo','perdón de deudas','derecho a comerciar los domingos','un precio mínimo para sus productos'],
  demandsMil:['raciones dobles','botas de invierno','tres meses de licencia','un capellán propio','una paga extraordinaria']
};

const ACHIEVEMENTS=[
  ['first-blood','La primera corona','Terminá tu primer reinado.','♚',s=>s.meta.totalReigns>=1],
  ['long-25','Un cuarto de siglo','Goberná 25 años en un solo reinado.','⌛',s=>s.reignYear>=25],
  ['long-50','Medio siglo','Goberná 50 años en un solo reinado.','∞',s=>s.reignYear>=50],
  ['balanced','El arte del equilibrio','Mantené los cuatro recursos entre 40 y 60 durante 12 decisiones.','◇',s=>s.hidden.balanceStreak>=12],
  ['rich-poor','De mendigo a magnate','Llevá el Tesoro por debajo de 10 y luego por encima de 90 en el mismo reinado.','◆',s=>s.hidden.treasuryLowSeen&&s.stats.tesoro>=90],
  ['printer','La palabra impresa','Financiá la primera imprenta.','▤',s=>s.flags.includes('imprenta')],
  ['constitution','Corona limitada','Firmá la Carta de Derechos.','⚖',s=>s.flags.includes('constitucion')],
  ['plague','Médico del reino','Encontrá una cura para la Fiebre de Vidrio.','⚕',s=>s.flags.includes('plague_cured')],
  ['peace','Mesa de tres','Terminá la Guerra de las Tres Banderas mediante diplomacia.','♞',s=>s.flags.includes('war_peace')],
  ['void','La puerta imposible','Construí la puerta del Observatorio Negro.','☽',s=>s.flags.includes('void_door')],
  ['cat','Inspector de bigotes','Nombrá al gato negro inspector del Consejo.','♣',s=>s.flags.includes('gato_inspector')],
  ['century','Dinastía centenaria','Acumulá 100 años de historia entre reinados.','✦',s=>s.worldYear>=100],
  ['ten-reigns','Sangre persistente','Alcanzá diez reinados en la misma dinastía.','♜',s=>s.reign>=10],
  ['secret-master','Ojos en cada taberna','Llevá Inteligencia oculta a 80 o más.','◐',s=>s.hidden.inteligencia>=80],
  ['clean-hands','Manos limpias','Goberná 30 años con Corrupción oculta por debajo de 20.','✧',s=>s.reignYear>=30&&s.hidden.corrupcion<20],
  ['married','Nupcias de Estado','Casate.','◇',s=>s.flags.includes('casado')],
  ['famine-mercy','Pan para el Sur','Perdoná las deudas de la hambruna.','♟',s=>s.flags.includes('famine_mercy')],
  ['two-rites','Dos ritos','Saná el cisma del Estuario.','⚓',s=>s.flags.includes('schism_healed')],
  ['canal','El río mudado','Cavá el canal de las Marismas.','⬡',s=>s.flags.includes('flood_canal')],
  ['old-crown','Corona larga','Llegá a los 65 años en el trono.','⌛',s=>s.rulerAge>=65],
  ['natural-end','El cuerpo cedió','Morí de causas naturales.','⌛',s=>(s.meta.lifetimeDeaths.age||0)>=1],
  ['child-crown','Cuna y cetro','Un menor de dieciséis heredó la corona.','♜',s=>(s.lineage||[]).some(r=>r.heirAge>0&&r.heirAge<16)],
  ['named-knife','El nombre en la palma','Desenmascará una traición y viví para contarla.','🗡',s=>s.flags.includes('plot_foiled')&&s.flags.includes('plot_named')],
  ['cup-refused','La copa retirada','Sobreviví a una conspiración sin conocer el nombre.','◇',s=>s.flags.includes('plot_foiled')&&!s.flags.includes('plot_named')],
  ['by-dagger','Oficio de cuchillo','Morí por una traición, no por los cuatro pilares.','♠',s=>(s.meta.lifetimeDeaths.betrayal||0)>=1],
  ['let-go','La corona se deja','Abdicá en el heredero.','♜',s=>(s.meta.lifetimeDeaths.abdicate||0)>=1],
  ['new-pulse','Otro pulso','Que Iva herede el oficio de Odón.','⚕',s=>s.flags.includes('iva_court')||s.meta.discoveredAdvisors.includes('iva')],
  ['other-cradle','La otra cuna','Que vuelva quien no heredó.','♟',s=>s.flags.includes('kin_returned')||(s.meta.chronicles||[]).some(b=>(b.lineage||[]).some(r=>(r.fork||[]).length))]
];

const PERKS=[
  ['granero','Graneros dinásticos','Cada nuevo reinado comienza con +5 Pueblo.',15,'♟'],
  ['cofre','Cofre del Fundador','Cada nuevo reinado comienza con +5 Tesoro.',15,'◆'],
  ['guardia','Guardia hereditaria','Cada nuevo reinado comienza con +5 Ejército.',15,'⚔'],
  ['archivo','Archivo de sangre','Cada nuevo reinado comienza con +5 Saber.',15,'✦'],
  ['destino','Dados de marfil','Aumenta la aparición de cartas raras y reduce repeticiones.',30,'◇'],
  ['ancla','Ancla de la Corona','Una vez por reinado evita una muerte por recurso extremo.',40,'⚓'],
  ['primogenitura','Primogenitura','El heredero se nombra solo y llega más formado al trono.',25,'♜'],
  ['consejo','Consejo obligatorio','Consultar al Consejo no tiene espera. Las pistas son más claras.',25,'⌘'],
  ['tesoro_sagrado','Tesoro sagrado','Las pérdidas de Tesoro se reducen un cuarto.',30,'◆'],
  ['pacto_sangre','Pacto de sangre','Cada reinado empieza con mejor trato con el Norte.',20,'♞'],
  ['cronista','Cronista real','Los anales se escriben más largos y cada final da legado extra.',15,'▤']
];

const SPECIAL_ENDINGS=[
  {id:'constitutional',title:'La Corona que Cedió',text:'Valdoria dejó de depender del carácter de una sola persona. La Carta de Derechos convirtió tu dinastía en símbolo, no en dueño del reino.',test:s=>s.flags.includes('constitucion')&&s.reignYear>=35&&s.stats.pueblo>45&&s.stats.saber>55,pack:'republic',terminal:false},
  {id:'enlightened',title:'El Siglo de las Lámparas',text:'Escuelas, imprentas, hospitales y academias transformaron Valdoria en el centro intelectual del continente.',test:s=>s.flags.includes('imprenta')&&s.flags.includes('hospital')&&s.flags.includes('academia_militar')&&s.stats.saber>=88&&s.reignYear>=40,pack:'republic',terminal:false},
  {id:'black-star',title:'La Ciudad Invertida',text:'La puerta se abrió sin ruido. Al otro lado, una versión de Valdoria llevaba siglos esperándote. Esta crónica no continúa en este cielo.',test:s=>s.flags.includes('void_door')&&s.hidden.void>=28&&s.reignYear>=24,pack:'void',terminal:true},
  {id:'golden-age',title:'La Edad de Oro',text:'Ninguna facción dominó a las demás. El reino prosperó durante décadas gracias a una estabilidad que tus antepasados habrían considerado imposible.',test:s=>s.reignYear>=60&&STAT_KEYS.every(k=>s.stats[k]>=35&&s.stats[k]<=75),pack:null,terminal:false},
  {id:'two-shores',title:'Las Dos Orillas',text:'El Estuario rezó dos veces y zarpó una. Valdoria aprendió que un reino puede tener más de un cielo sin partirse del todo.',test:s=>s.flags.includes('schism_healed')&&s.reignYear>=28&&s.stats.pueblo>40,pack:'republic',terminal:false},
  {id:'south-bread',title:'El Sur que Comió',text:'La hambruna quedó en los anales, no en los huesos. Quien come, a veces, perdona.',test:s=>s.flags.includes('famine_mercy')&&s.reignYear>=20,pack:null,terminal:false}
];

const NAME_F=['Beatriz','Dalia','Fiona','Helena','Julia','Lara','Nerea','Petra','Rhea','Tania','Vera','Alba','Clara','Elena','Irene','Luz','Rosa','Sara','Teresa','Yara'];
const NAME_M=['Aldo','Ciro','Elías','Gaspar','Ivo','Kael','Martín','Oriol','Quino','Silvio','Ulric','Mateo','Nilo','Pablo','Tomás','Vidal','Yago','Bruno'];
const EPITHETS=['el Prudente','la Roja','el Navegante','la Serena','el Gris','la Audaz','el Cartógrafo','la Breve','el Justo','la Tormenta','el Silencioso','la Lúcida','el de la Ceniza','la del Estuario'];

const EDICT_LABELS={
  imprenta:'La imprenta',hospital:'El hospital',academia_militar:'La academia militar',calzada_sur:'La calzada del Sur',
  censo:'El censo',banco:'El banco mercante',silos:'Los silos',puerto_franco:'Puerto franco',polvora:'La pólvora',
  constitucion:'La Carta de Derechos',pacto_norte:'El pacto del Norte',justicia_reformada:'La justicia reformada',
  mapa_costero:'El mapa de la costa',escuela:'La escuela del monasterio',gato_inspector:'El inspector de bigotes',
  flood_canal:'El canal de las Marismas',schism_healed:'Los dos ritos',famine_mercy:'El perdón del Sur',
  mutiny_charter:'La carta de la Guardia',boda_real:'La boda de Estado',casado:'El matrimonio real',
  pan_fijo:'El precio del pan',canales_abiertos:'Los canales del jardín',cementerio_civil:'El cementerio civil',
  plot_foiled:'La copa retirada',odon_gone:'El retiro de Odón',iva_court:'Iva Grís en la corte',
  kin_settled:'El feudo de la otra cuna',kin_spurned:'La otra cuna, sin tierra',heir_married:'La boda del heredero'
};

function whisperFor(state){
  const w=[];
  if(state.hidden.corrupcion>60)w.push('Bruno cuenta monedas que no suenan a plata.');
  if(state.hidden.salud<35)w.push(state.flags.includes('odon_gone')?'Iva mira el pozo como a un acusado.':'Odón tose y mira el pozo como a un acusado.');
  if(state.hidden.inteligencia>70)w.push('Mara sonríe demasiado poco para lo que sabe.');
  if(state.hidden.autoridad<30)w.push('Inés endereza papeles como quien endereza un reino.');
  if(state.hidden.autoridad>75)w.push('Hasta Lupo baja la voz cuando pasás.');
  if(state.hidden.religion>70)w.push('Las campanas marcan el Consejo mejor que el reloj.');
  if(state.hidden.deuda>45)w.push('Hay pasos de acreedor en el patio aunque no se vean.');
  if((state.relationships.mara||0)<=-18)w.push('Hay un rumor que llega antes que la carta.');
  if((state.relationships.tala||0)>=18)w.push('En los barrios todavía dicen tu nombre sin escupir.');
  if(state.season===3)w.push('El invierno enseña los huesos del palacio.');
  if(state.season===1&&state.hidden.reservas<4)w.push('El verano cuenta el grano con más rigor que Bruno.');
  if(state.flags.includes('plot_gold'))w.push('El copero limpia un cubierto que nadie usa.');
  if(state.flags.includes('plot_protocol'))w.push('Hay una rúbrica faltante y demasiada cortesía.');
  if(state.flags.includes('plot_cipher'))w.push('Un papel sin sello espera en la mesa de Mara.');
  if(state.flags.includes('plot_named'))w.push('El nombre cabe en una palma. No en un salón.');
  if(state.flags.includes('plot_seeded')&&!state.flags.includes('plot_active'))w.push('En la cocina se habla bajo, y no de recetas.');
  if(state.persistent?.assassin)w.push('El que sirvió el vino de ayer todavía tiene las llaves.');
  if(state.flags.includes('regencia'))w.push('El sello lo firma otra mano. El niño mira.');
  else if(state.rulerAge>=65)w.push('El trono es más alto que el pulso.');
  else if(state.rulerAge>=55)w.push('Inés habla de testamento como quien habla del tiempo: sin pedirlo.');
  else if(state.rulerAge>=40)w.push(state.flags.includes('odon_gone')?'Iva cuenta las pausas entre una palabra y la siguiente.':'Odón cuenta las pausas entre una palabra y la siguiente.');
  if(state.heir?.name)w.push(`En los pasillos ya dicen ${state.heir.name} como quien ensaya el futuro.`);
  if(state.flags.includes('odon_gone'))w.push('La silla de Odón está corrida. Iva no la mueve.');
  if((state.persistent?.shadowKin||[])[0]?.name)w.push(`Hay quien todavía dice ${state.persistent.shadowKin[0].name} cuando habla de la cuna.`);
  return w;
}

const TUTORIAL=[];
const CARDS=[];

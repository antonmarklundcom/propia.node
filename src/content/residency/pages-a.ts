import type { ResidencyPage } from "./types";

const DISCLAIMER =
  "Las reglas migratorias cambian y cada caso tiene sus matices: confirmá siempre los requisitos vigentes con la Dirección Nacional de Migraciones antes de iniciar el trámite.";

export const PAGES_A: ResidencyPage[] = [
  {
    slug: "residencia-paraguay",
    metaTitle: "Residencia en Paraguay: guía completa paso a paso",
    metaDescription:
      "Todo sobre la residencia en Paraguay: tipos, requisitos, documentos, cédula y plazos. Guía clara para extranjeros que quieren radicarse legalmente.",
    h1: "Residencia en Paraguay: la guía completa",
    lead: "Qué es la residencia paraguaya, qué tipos existen, qué documentos pide Migraciones y cómo es el camino desde el primer trámite hasta la cédula.",
    label: "Guía completa",
    sections: [
      {
        h2: "Qué significa tener residencia en Paraguay",
        paras: [
          "La residencia es el permiso que te habilita a vivir legalmente en Paraguay más allá de lo que permite el ingreso como turista. Se tramita ante la Dirección Nacional de Migraciones y, una vez otorgada, te permite obtener la cédula de identidad paraguaya, abrir cuentas, firmar contratos a tu nombre y, según tu caso, trabajar o emprender.",
          "Paraguay es conocido entre extranjeros porque su proceso es de los más accesibles de la región: no exige grandes montos de inversión para la mayoría de las categorías y se puede preparar gran parte de la documentación antes de viajar. Aun así, el trámite tiene pasos, sellos y turnos que conviene no descubrir sobre la marcha.",
        ],
      },
      {
        h2: "Los dos escalones: residencia temporal y permanente",
        paras: [
          "El camino habitual empieza por la radicación temporal, que se otorga por un período limitado. Cumplido ese tiempo y los requisitos de permanencia, se puede solicitar la radicación permanente, que no tiene vencimiento comparable. Los detalles de cada una están en sus páginas: residencia temporal y residencia permanente.",
          "Hay vías específicas para nacionales de países del Mercosur y asociados, que cuentan con un acuerdo propio de residencia. Si sos argentino, brasileño, uruguayo o de otro país incluido, revisá la guía de residencia Mercosur antes de armar la carpeta.",
        ],
      },
      {
        h2: "Qué se necesita, en líneas generales",
        paras: [
          "Aunque los requisitos exactos dependen de tu nacionalidad y de la categoría elegida, casi siempre se piden los mismos grupos de documentos:",
        ],
        bullets: [
          "Pasaporte vigente y comprobante de ingreso al país.",
          "Certificado de antecedentes penales de tu país de origen (y, según el caso, de los países donde viviste), legalizado o apostillado.",
          "Partida de nacimiento, y de matrimonio si corresponde, también apostilladas.",
          "Certificado de salud.",
          "Comprobante de medios de vida o de la actividad que justifica tu radicación.",
          "Fotografías, formularios y el pago de las tasas oficiales.",
        ],
      },
      {
        h2: "Después de la residencia: cédula, RUC y vida diaria",
        paras: [
          "Con la radicación aprobada se tramita la cédula de identidad paraguaya, el documento que realmente usás en el día a día. Quien quiere facturar, alquilar o abrir un negocio suma además el RUC ante la autoridad tributaria. Nuestra guía de la cédula paraguaya para extranjeros explica ese segundo tramo.",
          DISCLAIMER,
        ],
      },
    ],
    faq: [
      {
        q: "¿Cuánto tarda sacar la residencia en Paraguay?",
        a: "Depende de los tiempos de cada organismo público y de que la carpeta esté completa desde el inicio. Lo que sí está en tus manos es llegar con los documentos apostillados y en orden, que es lo que más demoras evita.",
      },
      {
        q: "¿Tengo que vivir en Paraguay para mantener la residencia?",
        a: "Las condiciones de permanencia las fija la normativa migratoria y pueden variar según la categoría. Consultanos tu caso y lo confirmamos con la normativa vigente antes de que tomes decisiones.",
      },
      {
        q: "¿Puedo hacer parte del trámite desde mi país?",
        a: "Sí: reunir y apostillar los documentos se hace en origen. Después hay pasos presenciales en Paraguay, como la presentación en Migraciones y la toma de datos biométricos.",
      },
      {
        q: "¿La residencia da derecho a la nacionalidad paraguaya?",
        a: "La naturalización es un trámite distinto, con sus propios requisitos y tiempos de residencia. La residencia es el primer paso, pero no la concede por sí sola.",
      },
    ],
    related: [
      "requisitos-residencia-paraguay",
      "residencia-temporal-paraguay",
      "residencia-permanente-paraguay",
      "como-sacar-residencia-paraguay",
    ],
  },
  {
    slug: "requisitos-residencia-paraguay",
    metaTitle: "Requisitos para la residencia en Paraguay (lista)",
    metaDescription:
      "Requisitos para sacar la residencia en Paraguay: pasaporte, antecedentes penales, partidas apostilladas, certificado de salud y medios de vida. Lista clara.",
    h1: "Requisitos para sacar la residencia en Paraguay",
    lead: "La lista de lo que suele pedir Migraciones, cómo se prepara cada documento y los errores que más tiempo hacen perder.",
    label: "Requisitos",
    sections: [
      {
        h2: "La lista base de documentos",
        paras: [
          "Los requisitos se agrupan en pocos bloques. Que todos estén completos y con el formato correcto desde la primera presentación es lo que más acelera el trámite.",
        ],
        bullets: [
          "Pasaporte vigente, con validez suficiente y copia de las páginas de datos y del sello de ingreso.",
          "Certificado de antecedentes penales de tu país de origen, vigente al momento de presentarlo y apostillado.",
          "Partida de nacimiento apostillada. Si estás casado y querés incluir a tu cónyuge, la partida de matrimonio también.",
          "Certificado de salud emitido según lo que indique la autoridad.",
          "Documentación que respalde tus medios de vida: ingresos, pensión, inversión o actividad, según la categoría.",
          "Datos del domicilio en Paraguay y los formularios oficiales completos.",
          "Fotografías y comprobante de pago de las tasas.",
        ],
      },
      {
        h2: "Apostilla y traducción: lo que más confunde",
        paras: [
          "Los documentos públicos extranjeros se presentan apostillados cuando el país de origen es parte del Convenio de La Haya, o legalizados por la vía consular cuando no lo es. La apostilla se pide en el organismo de tu país que emite o certifica el documento.",
          "Si tus documentos están en otro idioma, hay que traducirlos al español con un traductor público habilitado en Paraguay. Para quienes llegan de países de habla hispana este paso suele no ser necesario.",
        ],
      },
      {
        h2: "Vigencia: documentos que caducan",
        paras: [
          "El certificado de antecedentes penales y el de salud tienen un período de validez corto. Un error frecuente es apostillar todo con meses de anticipación y descubrir en Asunción que alguno venció. Conviene coordinar las fechas con el momento real de presentación.",
          DISCLAIMER,
        ],
      },
      {
        h2: "Requisitos según tu situación",
        paras: [
          "El motivo de tu radicación cambia la prueba de medios de vida: un jubilado presenta su pensión, un inversor documenta su actividad en el país y un trabajador remoto demuestra ingresos recurrentes. Revisá las páginas para jubilados, inversores y nómadas digitales.",
        ],
      },
    ],
    faq: [
      {
        q: "¿Qué documentos necesito para la residencia en Paraguay?",
        a: "Pasaporte, antecedentes penales apostillados, partida de nacimiento apostillada, certificado de salud, prueba de medios de vida y los formularios y tasas oficiales. Pueden sumarse otros según tu categoría.",
      },
      {
        q: "¿Los antecedentes penales caducan?",
        a: "Sí, se piden con una vigencia reciente, por eso es importante coordinar cuándo los emitís con la fecha en que vas a presentar la carpeta.",
      },
      {
        q: "¿Qué pasa si me falta un documento?",
        a: "El expediente puede quedar observado hasta completarlo. Armar la carpeta con revisión previa evita viajar dos veces.",
      },
      {
        q: "¿Necesito abogado para tramitar la residencia?",
        a: "No es obligatorio, pero muchas personas contratan acompañamiento porque el proceso tiene pasos presenciales y formatos precisos que es fácil equivocar.",
      },
    ],
    related: [
      "documentos-residencia-paraguay",
      "como-sacar-residencia-paraguay",
      "cuanto-cuesta-residencia-paraguay",
      "preguntas-frecuentes-residencia-paraguay",
    ],
  },
  {
    slug: "residencia-temporal-paraguay",
    metaTitle: "Residencia temporal en Paraguay: cómo se obtiene",
    metaDescription:
      "Residencia temporal (temporaria) en Paraguay: qué es, para quién, cuánto dura, qué documentos pide y cómo se pasa después a la permanente.",
    h1: "Residencia temporal en Paraguay",
    lead: "El primer escalón de la radicación: qué otorga, cuánto dura, qué se pide y cómo se prepara el paso a la residencia permanente.",
    label: "Residencia temporal",
    sections: [
      {
        h2: "Qué es la radicación temporal",
        paras: [
          "La residencia temporal, que muchos buscan como residencia temporaria, es el permiso inicial que te autoriza a vivir en Paraguay por un período determinado. Es la puerta de entrada para la gran mayoría de los extranjeros que se radican: inversores, jubilados, familias y trabajadores remotos.",
          "Con ella accedés a la cédula de identidad paraguaya y a la posibilidad de operar localmente: contratos, servicios, cuentas y trámites que un turista no puede hacer.",
        ],
      },
      {
        h2: "Para quién es",
        paras: [
          "Es la vía habitual para quien llega desde fuera del Mercosur —por ejemplo desde España, Estados Unidos o Europa— y no tiene vínculo familiar que dé otra categoría. Quien sí es nacional de un país con acuerdo de residencia puede acceder por esa vía específica.",
        ],
        bullets: [
          "Jubilados y pensionados con ingresos estables.",
          "Inversores y emprendedores que operan en el país.",
          "Trabajadores y nómadas digitales con ingresos del exterior.",
          "Familiares de personas que ya residen legalmente.",
        ],
      },
      {
        h2: "Cómo es el proceso",
        paras: [
          "Primero se reúne y apostilla la documentación en origen. Luego se presenta el expediente en Migraciones, con la toma de datos biométricos, y se espera la resolución. Con la radicación otorgada se tramita la cédula y, si corresponde, el RUC.",
          "La temporal no es el final del camino: transcurrido el período que fija la normativa y cumpliendo las condiciones, se puede pedir la residencia permanente. Planificar eso desde el primer día evita sorpresas.",
          DISCLAIMER,
        ],
      },
    ],
    faq: [
      {
        q: "¿Cuánto dura la residencia temporal en Paraguay?",
        a: "Se otorga por un período limitado que establece la normativa migratoria. Al aproximarse el vencimiento se solicita la permanente o, según el caso, la renovación.",
      },
      {
        q: "¿Se puede trabajar con residencia temporal?",
        a: "Dependiendo de la categoría de radicación y de la actividad. Confirmalo para tu caso concreto antes de empezar a operar.",
      },
      {
        q: "¿Es lo mismo residencia temporal que temporaria?",
        a: "En el uso cotidiano sí: son dos formas de nombrar el mismo permiso inicial de radicación.",
      },
    ],
    related: [
      "residencia-permanente-paraguay",
      "requisitos-residencia-paraguay",
      "residencia-paraguay-para-espanoles",
      "cedula-paraguaya-extranjeros",
    ],
  },
  {
    slug: "residencia-permanente-paraguay",
    metaTitle: "Residencia permanente en Paraguay: requisitos y pasos",
    metaDescription:
      "Residencia permanente en Paraguay: cuándo se puede pedir, qué requisitos hay, en qué se diferencia de la temporal y cómo prepararla.",
    h1: "Residencia permanente en Paraguay",
    lead: "Cuándo se puede solicitar, qué la diferencia de la temporal y qué conviene tener preparado para no perder tiempo en el segundo trámite.",
    label: "Residencia permanente",
    sections: [
      {
        h2: "Qué es la radicación permanente",
        paras: [
          "La residencia permanente es la categoría de largo plazo: sin el vencimiento corto de la temporal, con mayor estabilidad migratoria y menos trámites de renovación. Es lo que buscan quienes se instalan en Paraguay de manera definitiva.",
        ],
      },
      {
        h2: "Cómo se llega a ella",
        paras: [
          "Para la mayoría de las personas el camino es secuencial: primero se obtiene la residencia temporal y, cumplido el período y las condiciones que fija la normativa, se solicita la permanente. Quienes califican en determinadas categorías, como algunas vías de inversión o de vínculo familiar, pueden tener un camino más directo.",
          "Por eso importa elegir bien la categoría desde el inicio. Una decisión apresurada al comienzo puede retrasar la permanente.",
        ],
      },
      {
        h2: "Qué suele pedirse",
        paras: [
          "Se actualiza gran parte de la carpeta: documentos vigentes, certificados de antecedentes al día, prueba de que cumplís las condiciones de permanencia y la documentación de tu situación económica. Mantener ordenados los papeles de la temporal acelera este segundo tramo.",
          DISCLAIMER,
        ],
      },
      {
        h2: "Permanente no es nacionalidad",
        paras: [
          "Tener radicación permanente no equivale a ser ciudadano paraguayo. La nacionalidad por naturalización es otro proceso, con sus propios requisitos. La permanente sí te da una base muy sólida para vivir, trabajar e invertir en el país.",
        ],
      },
    ],
    faq: [
      {
        q: "¿Puedo pedir la residencia permanente directamente?",
        a: "Para la mayoría de las personas primero se obtiene la temporal. Algunas categorías específicas tienen una vía más directa; revisamos cuál te corresponde.",
      },
      {
        q: "¿La residencia permanente vence?",
        a: "No tiene el vencimiento corto de la temporal, aunque el documento de identidad asociado sí se renueva con su propia periodicidad.",
      },
      {
        q: "¿Qué diferencia hay entre residencia permanente y ciudadanía?",
        a: "La residencia es un permiso migratorio; la ciudadanía es la nacionalidad, que se obtiene por un trámite aparte.",
      },
    ],
    related: [
      "residencia-temporal-paraguay",
      "cedula-paraguaya-extranjeros",
      "residencia-paraguay",
      "preguntas-frecuentes-residencia-paraguay",
    ],
  },
  {
    slug: "residencia-paraguay-para-espanoles",
    metaTitle: "Residencia en Paraguay para españoles: cómo hacerlo",
    metaDescription:
      "Residencia en Paraguay para españoles: documentos que se preparan en España, apostilla, trámite en Asunción, cédula y consejos para mudarte con tiempo.",
    h1: "Residencia en Paraguay para españoles",
    lead: "Cómo se prepara desde España: qué papeles se tramitan antes de viajar, cómo se apostillan y qué se hace en Asunción.",
    label: "Para españoles",
    sections: [
      {
        h2: "Un trámite que se prepara casi todo desde España",
        paras: [
          "Cada vez más españoles eligen Paraguay para vivir, jubilarse, emprender o trabajar en remoto. La buena noticia es que el idioma es el mismo —no necesitás traducciones oficiales de tus documentos— y gran parte de la carpeta se resuelve antes de subir al avión.",
          "Los ciudadanos españoles no entran por el acuerdo de residencia del Mercosur, así que el camino habitual es la radicación temporal por la vía general, con la categoría que corresponda a tu situación.",
        ],
      },
      {
        h2: "Qué se tramita en España",
        paras: [
          "Los documentos clave se piden en España y se presentan apostillados, ya que España y Paraguay forman parte del Convenio de La Haya sobre la apostilla:",
        ],
        bullets: [
          "Certificado de antecedentes penales del Ministerio de Justicia, con apostilla.",
          "Certificado de nacimiento del Registro Civil, con apostilla; y de matrimonio si viajás en pareja.",
          "Prueba de ingresos o pensión: certificados de la Seguridad Social, nóminas o contratos, según tu caso.",
          "Pasaporte con vigencia suficiente.",
        ],
      },
      {
        h2: "Qué se hace en Asunción",
        paras: [
          "Ya en Paraguay se presenta el expediente en Migraciones, se completa la toma de datos y se sigue el trámite hasta la radicación. Después viene la cédula de identidad paraguaya y, si vas a facturar o abrir una actividad, el RUC. Si preparás bien la carpeta, tu estancia en Asunción puede ser corta.",
          DISCLAIMER,
        ],
      },
      {
        h2: "Consejos prácticos para quien viene de España",
        paras: [
          "Coordiná las fechas: los antecedentes penales y el certificado de salud tienen vigencia corta. Pedí varias copias apostilladas de la partida de nacimiento, que se vuelve a usar en otros trámites. Y definí antes de viajar dónde vas a vivir, porque el domicilio forma parte del expediente.",
        ],
      },
    ],
    faq: [
      {
        q: "¿Los españoles necesitan visado para vivir en Paraguay?",
        a: "Se ingresa como turista y se inicia la radicación una vez en el país. Confirmá las condiciones de ingreso vigentes para tu pasaporte antes de viajar.",
      },
      {
        q: "¿Tengo que traducir mis documentos?",
        a: "En general no, porque están en español. Sí deben estar apostillados.",
      },
      {
        q: "¿Puedo conservar mi nacionalidad española?",
        a: "La residencia no implica renunciar a tu nacionalidad. Tus obligaciones fiscales y de seguridad social en España dependen de tu situación y conviene consultarlas con un asesor.",
      },
      {
        q: "¿Cuánto tiempo tengo que quedarme en Asunción?",
        a: "Con la carpeta completa, la presencia necesaria es la del trámite en Migraciones y la identificación. Te contamos cuántos días conviene reservar para tu caso.",
      },
    ],
    related: [
      "requisitos-residencia-paraguay",
      "documentos-residencia-paraguay",
      "residencia-paraguay-nomadas-digitales",
      "residencia-paraguay-jubilados",
    ],
  },
  {
    slug: "residencia-mercosur-paraguay",
    metaTitle: "Residencia Mercosur en Paraguay: argentinos y otros",
    metaDescription:
      "Residencia por el Acuerdo Mercosur en Paraguay: quién puede usarla, documentos, diferencias con la vía general y pasos para argentinos, brasileños y más.",
    h1: "Residencia Mercosur en Paraguay",
    lead: "El acuerdo de residencia para nacionales del Mercosur y países asociados: a quién aplica, qué se pide y por qué suele ser más simple.",
    label: "Residencia Mercosur",
    sections: [
      {
        h2: "Qué es el acuerdo de residencia del Mercosur",
        paras: [
          "Los países del Mercosur y varios asociados firmaron un acuerdo que facilita la residencia de sus nacionales dentro de la región. En Paraguay permite a los ciudadanos incluidos tramitar su radicación por una vía específica, normalmente más ágil y con menos exigencias de prueba económica que la categoría general.",
          "Si sos argentino, brasileño, uruguayo, boliviano, chileno, colombiano, ecuatoriano o peruano, conviene revisar esta opción antes de elegir otra. Confirmá siempre que tu nacionalidad esté incluida según el acuerdo vigente.",
        ],
      },
      {
        h2: "Documentos habituales",
        paras: ["La lista base es parecida a la del resto de las categorías, con ajustes propios del acuerdo:"],
        bullets: [
          "Documento de identidad o pasaporte vigente.",
          "Partida de nacimiento.",
          "Certificado de antecedentes penales o de conducta de tu país.",
          "Declaración jurada de que no tenés antecedentes que lo impidan.",
          "Formularios, fotografías y tasas oficiales.",
        ],
      },
      {
        h2: "Ventajas de esta vía",
        paras: [
          "La residencia por Mercosur puede resolver la radicación con menos exigencias económicas y, para muchos, con una carpeta más corta. Para argentinos que llegan a Asunción, Encarnación o Ciudad del Este, suele ser el camino más directo.",
          DISCLAIMER,
        ],
      },
    ],
    faq: [
      {
        q: "¿Los argentinos pueden pedir la residencia por el acuerdo Mercosur?",
        a: "Sí, los argentinos están entre los nacionales a los que aplica. Revisamos tu caso y la documentación exacta vigente.",
      },
      {
        q: "¿Los españoles entran por Mercosur?",
        a: "No. España no es parte del acuerdo, así que el camino es la vía general de radicación temporal.",
      },
      {
        q: "¿Después de la Mercosur se puede pasar a permanente?",
        a: "Sí, con las condiciones y plazos que fija la normativa para esa categoría.",
      },
    ],
    related: [
      "residencia-paraguay",
      "residencia-temporal-paraguay",
      "documentos-residencia-paraguay",
      "cedula-paraguaya-extranjeros",
    ],
  },
  {
    slug: "cuanto-cuesta-residencia-paraguay",
    metaTitle: "¿Cuánto cuesta la residencia en Paraguay? Costos",
    metaDescription:
      "Cuánto cuesta sacar la residencia en Paraguay: tasas oficiales, apostillas, certificados, cédula y gastos de acompañamiento. Cómo presupuestar sin sorpresas.",
    h1: "¿Cuánto cuesta la residencia en Paraguay?",
    lead: "Los componentes del costo total, qué es tasa oficial y qué es gasto de preparación, y cómo presupuestarlo antes de empezar.",
    label: "Costos",
    sections: [
      {
        h2: "Por qué no hay un único precio",
        paras: [
          "El costo final depende de tu nacionalidad, de la categoría de radicación, de cuántos documentos tengas que apostillar o traducir y de si contratás acompañamiento. Por eso desconfiá de cifras cerradas sin conocer tu caso, y de quien promete un precio fijo sin preguntar de dónde venís.",
        ],
      },
      {
        h2: "De qué se compone el gasto",
        paras: ["Conviene separar los rubros para entender qué es obligatorio y qué es opcional:"],
        bullets: [
          "Tasas oficiales de Migraciones por la radicación y por la cédula de identidad.",
          "Costos en tu país de origen: antecedentes penales, partidas, apostillas y, si hace falta, traducciones.",
          "Certificado de salud y fotografías.",
          "RUC y trámites tributarios, si vas a operar.",
          "Honorarios de acompañamiento o gestoría, si decidís contratarlos.",
          "Traslado y alojamiento durante tu estancia en Asunción para la parte presencial.",
        ],
      },
      {
        h2: "Cómo ahorrar sin arriesgar el trámite",
        paras: [
          "Lo más caro es repetir pasos: un documento vencido o mal apostillado obliga a volver a pagarlo y a esperar. Armar la carpeta bien a la primera, coordinando fechas de vigencia, es la forma real de ahorrar.",
          "Si querés una estimación de tu caso, pedinos presupuesto: te indicamos qué es tasa oficial y qué es servicio, por separado.",
          DISCLAIMER,
        ],
      },
    ],
    faq: [
      {
        q: "¿Es caro sacar la residencia en Paraguay?",
        a: "Comparado con otros países, suele ser accesible, pero el total depende de tu caso. Te desglosamos tasas oficiales y gastos de preparación por separado.",
      },
      {
        q: "¿Las tasas oficiales cambian?",
        a: "Sí, se actualizan. Siempre se confirma el valor vigente en el momento de presentar el trámite.",
      },
    ],
    related: [
      "requisitos-residencia-paraguay",
      "como-sacar-residencia-paraguay",
      "residencia-temporal-paraguay",
      "preguntas-frecuentes-residencia-paraguay",
    ],
  },
];

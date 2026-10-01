import type { ResidencyPage } from "./types";

const DISCLAIMER =
  "Las reglas migratorias cambian y cada caso tiene sus matices: confirmá siempre los requisitos vigentes con la Dirección Nacional de Migraciones antes de iniciar el trámite.";

export const PAGES_B: ResidencyPage[] = [
  {
    slug: "documentos-residencia-paraguay",
    metaTitle: "Documentos para la residencia en Paraguay: apostilla",
    metaDescription:
      "Documentos para la residencia en Paraguay: antecedentes penales, partida de nacimiento, certificado de salud y cómo apostillarlos. Evitá documentos vencidos.",
    h1: "Documentos para la residencia en Paraguay",
    lead: "Cómo se obtiene, se apostilla y se presenta cada documento, y cómo coordinar las vigencias para no repetir nada.",
    label: "Documentos y apostilla",
    sections: [
      {
        h2: "Los tres documentos que más consultas generan",
        paras: [
          "Antecedentes penales, partida de nacimiento y certificado de salud concentran casi todas las dudas. Los dos primeros se tramitan en tu país de origen y se apostillan; el tercero se obtiene según lo que indique la autoridad paraguaya.",
        ],
        bullets: [
          "Antecedentes penales: se piden recientes y tienen vigencia corta. Pedilos cerca de la fecha de presentación.",
          "Partida de nacimiento: se usa en varios trámites, así que conviene apostillar más de una copia.",
          "Certificado de salud: se coordina para que esté vigente cuando presentás el expediente.",
        ],
      },
      {
        h2: "Cómo funciona la apostilla",
        paras: [
          "La apostilla es un sello que certifica la autenticidad de un documento público para usarlo en otro país del Convenio de La Haya. Se solicita en el organismo designado de tu país, que cambia según el documento: en general, el ministerio competente o el registro que lo emitió.",
          "Si tu país no es parte del convenio, el documento se legaliza por vía consular. En ambos casos, el resultado es un documento que Paraguay reconoce como válido.",
        ],
      },
      {
        h2: "Orden recomendado",
        paras: [
          "Primero fijá la fecha tentativa de viaje. Después pedí los documentos de vigencia corta, y recién entonces los de vigencia larga. Revisá nombre y apellidos en cada uno: una diferencia con el pasaporte es una de las causas más comunes de observación del expediente.",
          DISCLAIMER,
        ],
      },
    ],
    faq: [
      {
        q: "¿Qué es una apostilla y para qué sirve?",
        a: "Es la certificación que permite que un documento público de tu país sea aceptado en Paraguay sin más legalizaciones.",
      },
      {
        q: "¿Hace falta traducir los documentos?",
        a: "Solo si no están en español. En ese caso se traducen con un traductor público habilitado en Paraguay.",
      },
      {
        q: "¿Puedo apostillar online?",
        a: "Depende de cada país. Algunos organismos ofrecen la gestión en línea y otros solo presencial.",
      },
    ],
    related: [
      "requisitos-residencia-paraguay",
      "residencia-paraguay-para-espanoles",
      "como-sacar-residencia-paraguay",
      "residencia-temporal-paraguay",
    ],
  },
  {
    slug: "cedula-paraguaya-extranjeros",
    metaTitle: "Cédula paraguaya para extranjeros: cómo sacarla",
    metaDescription:
      "Cédula de identidad paraguaya para extranjeros residentes: requisitos, dónde se tramita, para qué sirve y su relación con el RUC. Guía práctica.",
    h1: "Cédula paraguaya para extranjeros",
    lead: "El documento que usás todos los días una vez radicado: cómo se tramita, para qué sirve y qué otros trámites habilita.",
    label: "Cédula paraguaya",
    sections: [
      {
        h2: "Qué es y por qué importa",
        paras: [
          "La cédula de identidad paraguaya para extranjeros es el documento que acredita tu identidad y tu condición de residente. Es el que te piden bancos, empresas de servicios, escribanías y casi cualquier trámite cotidiano; el pasaporte no la reemplaza en la vida diaria.",
        ],
      },
      {
        h2: "Cómo se obtiene",
        paras: [
          "Se tramita una vez otorgada la radicación, ante el organismo encargado de la identificación civil. Se presentan los documentos de la radicación, se toman fotografía y huellas y se abonan las tasas correspondientes.",
          "Tener los datos de tu domicilio y la documentación migratoria ordenados evita idas y vueltas.",
        ],
      },
      {
        h2: "La cédula y el RUC",
        paras: [
          "Si vas a facturar, abrir una empresa o alquilar con fines comerciales, además de la cédula se tramita el RUC (Registro Único del Contribuyente) ante la autoridad tributaria. Son trámites distintos y conviene hacerlos en orden.",
          DISCLAIMER,
        ],
      },
    ],
    faq: [
      {
        q: "¿Puedo sacar la cédula antes de tener la residencia?",
        a: "La cédula de extranjero se emite a partir de la radicación otorgada, por eso es el paso siguiente a Migraciones.",
      },
      {
        q: "¿Con la cédula se puede abrir una cuenta bancaria?",
        a: "Es uno de los documentos que piden los bancos, junto con otra información según cada entidad.",
      },
      {
        q: "¿La cédula se renueva?",
        a: "Sí, tiene su propia vigencia. Se anota su vencimiento para renovarla a tiempo.",
      },
    ],
    related: [
      "residencia-temporal-paraguay",
      "residencia-permanente-paraguay",
      "residencia-paraguay",
      "residencia-paraguay-nomadas-digitales",
    ],
  },
  {
    slug: "como-sacar-residencia-paraguay",
    metaTitle: "Cómo sacar la residencia en Paraguay: paso a paso",
    metaDescription:
      "Cómo sacar la residencia en Paraguay paso a paso: preparar documentos, apostillar, viajar, presentar en Migraciones, cédula y RUC. Orden recomendado.",
    h1: "Cómo sacar la residencia en Paraguay paso a paso",
    lead: "El orden recomendado, desde la decisión hasta tener la cédula en la mano.",
    label: "Paso a paso",
    sections: [
      {
        h2: "Paso 1: elegí la categoría",
        paras: [
          "Antes de pedir ningún papel, definí por qué vía vas a radicarte: Mercosur, jubilación, inversión, trabajo remoto o vínculo familiar. De eso depende qué prueba de medios de vida preparás.",
        ],
      },
      {
        h2: "Paso 2: reuní y apostillá la documentación",
        paras: [
          "Pedí en tu país los antecedentes penales y la partida de nacimiento, y apostillalos. Coordiná las fechas para que nada venza antes de presentar. Revisá que los nombres coincidan con el pasaporte.",
        ],
      },
      {
        h2: "Paso 3: viajá y presentá el expediente",
        paras: [
          "Una vez en Paraguay se presenta la solicitud en Migraciones, con la toma de datos biométricos, y se abonan las tasas. Tené definido tu domicilio, porque forma parte del expediente.",
        ],
      },
      {
        h2: "Paso 4: seguí el trámite hasta la radicación",
        paras: [
          "Con el expediente presentado se sigue su avance hasta la resolución. Responder rápido a cualquier observación es lo que evita que se frene.",
        ],
      },
      {
        h2: "Paso 5: cédula, RUC y vida local",
        paras: [
          "Con la radicación otorgada, se tramita la cédula de identidad paraguaya y, si corresponde, el RUC. A partir de ahí podés abrir cuentas, firmar contratos y operar a tu nombre.",
          DISCLAIMER,
        ],
      },
    ],
    faq: [
      {
        q: "¿Cuánto tiempo tengo que estar en Paraguay durante el trámite?",
        a: "Si la carpeta llega completa, la presencia necesaria se concentra en la presentación y la identificación. Te indicamos cuántos días conviene reservar.",
      },
      {
        q: "¿Puedo hacerlo yo solo?",
        a: "Sí, pero hay pasos presenciales y formatos precisos. Muchas personas prefieren acompañamiento para no equivocarse.",
      },
      {
        q: "¿Qué hago después de tener la cédula?",
        a: "Podés abrir una cuenta, contratar servicios, alquilar o comprar una propiedad y, si querés operar, tramitar el RUC.",
      },
    ],
    related: [
      "requisitos-residencia-paraguay",
      "documentos-residencia-paraguay",
      "cuanto-cuesta-residencia-paraguay",
      "cedula-paraguaya-extranjeros",
    ],
  },
  {
    slug: "residencia-paraguay-inversores",
    metaTitle: "Residencia en Paraguay para inversores y empresarios",
    metaDescription:
      "Residencia en Paraguay para inversores y emprendedores: cómo se acredita la actividad, qué categorías existen y cómo ordenar la inversión con el trámite.",
    h1: "Residencia en Paraguay para inversores",
    lead: "Cómo se relaciona la inversión con la radicación, qué se acredita y por qué conviene planificar ambos trámites juntos.",
    label: "Inversores",
    sections: [
      {
        h2: "Residir e invertir, dos decisiones conectadas",
        paras: [
          "Muchos extranjeros llegan a Paraguay para abrir un negocio, comprar un inmueble o invertir en una actividad productiva, y quieren que su residencia respalde esa actividad. Paraguay contempla categorías de radicación vinculadas a la inversión y a la actividad económica.",
          "Qué se acredita y en qué forma depende de la categoría: constitución de una sociedad, actividad registrada, bienes en el país u otros comprobantes. Por eso conviene definir primero el esquema de inversión y después el trámite migratorio, no al revés.",
        ],
      },
      {
        h2: "Qué suele preparar un inversor",
        paras: ["Además de la base de documentos personales, es habitual reunir:"],
        bullets: [
          "Documentación de la sociedad o actividad, si corresponde, con su inscripción.",
          "Comprobantes de la inversión o de los bienes en el país.",
          "RUC y situación tributaria al día.",
          "Domicilio en Paraguay.",
        ],
      },
      {
        h2: "Inversión inmobiliaria y residencia",
        paras: [
          "Comprar una propiedad es una forma frecuente de afianzar la radicación: da domicilio, arraigo y respaldo patrimonial. Se trata de dos trámites distintos, con sus propios requisitos; coordinarlos desde el inicio evita duplicar gestiones. Si estás evaluando comprar, mirá las propiedades en inmobiliaria.com.py.",
          DISCLAIMER,
        ],
      },
    ],
    faq: [
      {
        q: "¿Hace falta invertir para tener residencia en Paraguay?",
        a: "No para todas las categorías. La inversión es una de varias vías; revisamos cuál encaja con tu situación.",
      },
      {
        q: "¿Comprar una propiedad me da la residencia?",
        a: "Por sí sola no: la residencia se tramita por separado, aunque la propiedad puede respaldar tu domicilio y tu arraigo.",
      },
      {
        q: "¿Puedo tramitar la residencia a través de mi empresa?",
        a: "Depende de la categoría y de cómo esté constituida la actividad. Lo evaluamos con tus documentos.",
      },
    ],
    related: [
      "residencia-temporal-paraguay",
      "requisitos-residencia-paraguay",
      "cuanto-cuesta-residencia-paraguay",
      "residencia-permanente-paraguay",
    ],
  },
  {
    slug: "residencia-paraguay-jubilados",
    metaTitle: "Residencia en Paraguay para jubilados y pensionados",
    metaDescription:
      "Residencia en Paraguay para jubilados y pensionados: cómo se acredita la pensión, documentos, ventajas de vivir en Paraguay y pasos para radicarte.",
    h1: "Residencia en Paraguay para jubilados y pensionados",
    lead: "Cómo se acredita una pensión o jubilación, qué documentos prepara quien viene del exterior y qué conviene saber antes de mudarse.",
    label: "Jubilados",
    sections: [
      {
        h2: "Por qué Paraguay atrae a jubilados",
        paras: [
          "Costo de vida accesible, clima templado, trámites razonables y una comunidad extranjera cada vez más grande hacen que muchos jubilados consideren radicarse en Asunción y alrededores. La residencia permite hacerlo con todas las garantías legales.",
        ],
      },
      {
        h2: "Cómo se acredita la pensión",
        paras: [
          "Como medios de vida, quien se jubila presenta documentación que acredite su pensión o jubilación: certificados del organismo pagador, que se apostillan igual que el resto de los documentos públicos. El importe y el formato exactos que se aceptan los confirmamos con la normativa vigente para tu caso.",
        ],
        bullets: [
          "Certificado de pensión o jubilación del organismo pagador.",
          "Pasaporte, antecedentes penales y partida de nacimiento apostillados.",
          "Certificado de salud.",
          "Domicilio en Paraguay.",
        ],
      },
      {
        h2: "Antes de mudarte",
        paras: [
          "Pensá en la salud: cobertura médica, seguro y cercanía a centros de atención. Y consultá con un asesor tu situación fiscal y de seguridad social, porque tu pensión puede tener obligaciones en el país que te la paga. Nosotros te ayudamos con la parte migratoria y de instalación.",
          DISCLAIMER,
        ],
      },
    ],
    faq: [
      {
        q: "¿Qué ingreso mínimo piden a un jubilado?",
        a: "Depende de la categoría y de la normativa vigente. Te confirmamos el requisito actual para tu caso en la consulta.",
      },
      {
        q: "¿Puedo cobrar mi pensión viviendo en Paraguay?",
        a: "Depende del país que te la paga y de sus reglas para residentes en el exterior. Conviene consultarlo antes de mudarte.",
      },
      {
        q: "¿Mi pareja puede radicarse conmigo?",
        a: "Sí, en general se incluye al cónyuge con su propia documentación y la partida de matrimonio apostillada.",
      },
    ],
    related: [
      "requisitos-residencia-paraguay",
      "residencia-paraguay-para-espanoles",
      "residencia-temporal-paraguay",
      "cuanto-cuesta-residencia-paraguay",
    ],
  },
  {
    slug: "residencia-paraguay-nomadas-digitales",
    metaTitle: "Residencia en Paraguay para nómadas digitales",
    metaDescription:
      "Residencia en Paraguay para nómadas digitales y trabajadores remotos: cómo acreditar ingresos del exterior, qué categoría elegir y cómo instalarte.",
    h1: "Residencia en Paraguay para nómadas digitales",
    lead: "Cómo acreditar ingresos del exterior, qué trámite elegir y cómo instalarte con documentación al día para trabajar en remoto.",
    label: "Nómadas digitales",
    sections: [
      {
        h2: "Trabajar en remoto desde Paraguay",
        paras: [
          "Internet estable en las ciudades principales, costos moderados y una zona horaria cómoda para América y Europa convierten a Asunción en un destino creciente para trabajadores remotos y nómadas digitales. Tener residencia te da estabilidad legal más allá de las estancias de turista.",
        ],
      },
      {
        h2: "Cómo se acreditan los ingresos del exterior",
        paras: [
          "Para la radicación se documenta tu fuente de ingresos: contrato con tu empresa, facturas de tus clientes, extractos bancarios o declaraciones de impuestos de tu país. Qué comprobantes se aceptan y con qué formato lo definimos según tu situación y la normativa vigente.",
        ],
        bullets: [
          "Contrato laboral o de servicios con empresa del exterior.",
          "Comprobantes de ingresos recurrentes de los últimos meses.",
          "Documentos personales apostillados.",
          "Domicilio en Paraguay.",
        ],
      },
      {
        h2: "Cédula, banco y RUC",
        paras: [
          "Con la residencia se tramita la cédula y podés abrir una cuenta local. Si vas a facturar desde Paraguay, el RUC es el trámite tributario que corresponde. Y si buscás dónde instalarte, en inmobiliaria.com.py hay alquileres y propiedades en Asunción.",
          DISCLAIMER,
        ],
      },
    ],
    faq: [
      {
        q: "¿Existe una visa de nómada digital en Paraguay?",
        a: "Los trabajadores remotos suelen radicarse por la categoría que mejor se ajuste a su situación. Revisamos qué vía te conviene.",
      },
      {
        q: "¿Tengo que pagar impuestos en Paraguay por mis ingresos del exterior?",
        a: "Es una consulta tributaria específica que depende de tu caso. Te recomendamos asesorarte con un contador además del trámite migratorio.",
      },
      {
        q: "¿Cuánto tiempo puedo vivir en Paraguay como turista?",
        a: "El ingreso como turista otorga un período limitado de estadía. Para quedarte más tiempo, lo correcto es radicarte.",
      },
    ],
    related: [
      "residencia-temporal-paraguay",
      "cedula-paraguaya-extranjeros",
      "residencia-paraguay-para-espanoles",
      "como-sacar-residencia-paraguay",
    ],
  },
  {
    slug: "preguntas-frecuentes-residencia-paraguay",
    metaTitle: "Preguntas frecuentes sobre residencia en Paraguay",
    metaDescription:
      "Preguntas frecuentes sobre la residencia en Paraguay: plazos, documentos, familia, trabajo, cédula, nacionalidad y costos. Respuestas claras.",
    h1: "Preguntas frecuentes sobre la residencia en Paraguay",
    lead: "Las dudas que más recibimos de quienes quieren radicarse, con respuestas directas.",
    label: "Preguntas frecuentes",
    sections: [
      {
        h2: "Lo primero que se pregunta",
        paras: [
          "Esta página reúne las consultas más habituales. Si tu caso es particular —nacionalidad especial, familia con menores, situación laboral compleja— escribinos y lo revisamos contigo.",
          DISCLAIMER,
        ],
      },
    ],
    faq: [
      {
        q: "¿Es fácil conseguir la residencia en Paraguay?",
        a: "Es uno de los procesos más accesibles de la región, pero tiene pasos y documentos precisos. Con la carpeta bien armada se simplifica mucho.",
      },
      {
        q: "¿Puedo incluir a mi familia?",
        a: "En general sí: cónyuge e hijos pueden tramitar su radicación vinculada, con la documentación que corresponda a cada uno.",
      },
      {
        q: "¿Qué diferencia hay entre residencia temporal y permanente?",
        a: "La temporal es el permiso inicial por un período limitado; la permanente es la categoría de largo plazo a la que se accede cumpliendo las condiciones.",
      },
      {
        q: "¿Necesito hablar guaraní?",
        a: "No. El trámite y la vida diaria funcionan en español, el idioma que compartís con la administración.",
      },
      {
        q: "¿Puedo comprar una propiedad siendo extranjero?",
        a: "Sí, los extranjeros pueden comprar inmuebles en Paraguay con las precauciones legales habituales. La compra y la residencia son trámites independientes.",
      },
      {
        q: "¿La residencia da acceso a la nacionalidad?",
        a: "La nacionalidad se tramita aparte, con sus propios requisitos de residencia y arraigo.",
      },
      {
        q: "¿Cómo empiezo?",
        a: "Escribinos por el formulario de contacto: te orientamos sobre la categoría y la lista exacta de documentos para tu caso.",
      },
    ],
    related: [
      "residencia-paraguay",
      "requisitos-residencia-paraguay",
      "cuanto-cuesta-residencia-paraguay",
      "como-sacar-residencia-paraguay",
    ],
  },
];

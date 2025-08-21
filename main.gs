function limpiarHojaRespuestas() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const hoja = ss.getSheetByName('Form_Responses'); // AJUSTA el nombre si tu hoja es otra

  if (!hoja) return;

  // Lee encabezados
  const headers = hoja.getRange(1, 1, 1, hoja.getLastColumn()).getValues()[0];

  // Columnas fijas que NO se deben borrar
  const columnasFijas = ['Marca temporal', 'Dirección de correo electrónico', 'Puntuación'];

  // Encuentra índices de columnas de preguntas (las que no son fijas)
  const columnasPreguntas = [];
  headers.forEach((header, idx) => {
    if (!columnasFijas.includes(header)) {
      columnasPreguntas.push(idx + 1); // Columnas en Sheets empiezan en 1
    }
  });

  // Borra columnas de preguntas de derecha a izquierda
  columnasPreguntas.sort((a, b) => b - a).forEach(col => hoja.deleteColumn(col));

  // Borra TODAS las respuestas (opcional, si quieres limpiar los datos)
  if (hoja.getLastRow() > 1) {
    hoja.deleteRows(2, hoja.getLastRow() - 1);
  }
}
 //---------------------------------

function enviarExamenDiario() {
  // Solo lunes a viernes
  const day = new Date().getDay();
  if (day === 0 || day === 6) return;

  const FORM_ID = '16G_4Krs6zb4oyR1Bco0tty_OexDgC4xPgI7I4DEZvDw'; // Formulario FIJO
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetPreguntas = ss.getSheetByName('BancoPreguntas');
  const sheetPracticantes = ss.getSheetByName('ListaPracticantes');
  if (!sheetPreguntas || !sheetPracticantes) throw new Error("Faltan hojas.");

  let dataPreguntas = sheetPreguntas.getDataRange().getValues();
  dataPreguntas.shift(); // Quita encabezados

  // Seleccionar 5 preguntas aleatorias
  const preguntasSeleccionadas = [];
  while (preguntasSeleccionadas.length < 5 && dataPreguntas.length > 0) {
    const randomIndex = Math.floor(Math.random() * dataPreguntas.length);
    const fila = dataPreguntas.splice(randomIndex, 1)[0];
    preguntasSeleccionadas.push(fila);
  }

  // ABRE EL FORMULARIO FIJO (NO crear uno nuevo)
  const form = FormApp.openById(FORM_ID);

  // BORRA TODAS LAS PREGUNTAS ACTUALES
  const items = form.getItems();
  items.forEach(item => form.deleteItem(item));

  // AÑADE LAS PREGUNTAS NUEVAS
  preguntasSeleccionadas.forEach((fila, idx) => {
    const pregunta = String(fila[0] ?? '').trim();
    const opcion1 = String(fila[1] ?? '').trim();
    const opcion2 = String(fila[2] ?? '').trim();
    const opcion3 = String(fila[3] ?? '').trim();
    const opcion4 = String(fila[4] ?? '').trim();

    if (!pregunta || !opcion1 || !opcion2 || !opcion3 || !opcion4) {
      Logger.log(`Fila ${idx + 2}: pregunta incompleta, saltando...`);
      return;
    }
    form.addMultipleChoiceItem()
      .setTitle(pregunta)
      .setChoiceValues([opcion1, opcion2, opcion3, opcion4])
      .setRequired(true);
  });

  form.setCollectEmail(true);
  form.setAllowResponseEdits(false);
  form.setAcceptingResponses(true);

  // --- SELECCIONA SOLO 1 (o 2) PRACTICANTE(S) AL AZAR ---
  let dataPracticantes = sheetPracticantes.getDataRange().getValues();
  dataPracticantes.shift(); // Quita encabezados

  let cantidadPorDia = 1; // Cambia a 2 si quieres enviar a 2 personas por día

  // Mezcla aleatoriamente (Fisher-Yates)
  for (let i = dataPracticantes.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    [dataPracticantes[i], dataPracticantes[j]] = [dataPracticantes[j], dataPracticantes[i]];
  }
  let seleccionados = dataPracticantes.slice(0, cantidadPorDia);

  const linkFormulario = form.getPublishedUrl();

  seleccionados.forEach(practicante => {
    const correo = practicante[0];
    if (correo)
      MailApp.sendEmail({
        to: correo,
        subject: 'Examen Diario',
        htmlBody: 'Hola, aquí tienes tu examen diario:<br><br>' +
                  `<a href="${linkFormulario}">Responder examen</a><br><br>` +
                  '¡Éxito!'
      });
  });

  // (Opcional) Guarda las preguntas activas del día en PreguntasHoy, si lo usas en tu sistema:
  // guardarPreguntasHoy(preguntasSeleccionadas);
}



//--------------------------------------


function corregirYNotificarExamenes() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetPreguntas = ss.getSheetByName('BancoPreguntas');
  const sheetRespuestas = ss.getSheetByName('Form_Responses');

  let dataPreguntas = sheetPreguntas.getDataRange().getValues();
  dataPreguntas.shift();

  let dataRespuestas = sheetRespuestas.getDataRange().getValues();
  let encabezados = dataRespuestas.shift();

  const colEmail = encabezados.indexOf('Dirección de correo electrónico');
  const colPuntuacion = encabezados.indexOf('Puntuación');
  if (colPuntuacion === -1) {
    throw new Error('Falta la columna "Puntuación" en tu hoja de respuestas. Agrégala manualmente antes de usar el script.');
  }

  // --- Encuentra las 5 últimas columnas de preguntas (a la derecha, después de las fijas) ---
  const columnasFijas = ['Marca temporal', 'Dirección de correo electrónico', 'Puntuación'];
  const posicionesFijas = columnasFijas.map(c => encabezados.indexOf(c));
  const primeraPregunta = Math.max(...posicionesFijas) + 1;

  const totalColumnas = encabezados.length;
  const indicesPreguntas = [];
  for (let i = totalColumnas - 5; i < totalColumnas; i++) {
    if (i >= primeraPregunta) indicesPreguntas.push(i);
  }

  // --- Califica cada fila usando SOLO las 5 preguntas activas ---
  let resumen = "<b>Resumen de calificaciones del examen diario:</b><br><ul>";

  for (let i = 0; i < dataRespuestas.length; i++) {
    let fila = dataRespuestas[i];
    let email = fila[colEmail];
    let aciertos = 0;
    let total = 0;
    let erroresDetalle = []; // Aquí guardamos los errores

    indicesPreguntas.forEach(j => {
      let preguntaTexto = encabezados[j];
      let respuestaUsuario = limpiarTexto(fila[j] || '');
      let preguntaBanco = dataPreguntas.find(row => row[0].toString().trim() === preguntaTexto);
      if (!preguntaBanco) return;
      let respuestaCorrecta = limpiarTexto(preguntaBanco[5] || '');
      if (respuestaUsuario === respuestaCorrecta) {
        aciertos++;
      } else {
        // Guardamos info de la pregunta y la respuesta correcta
        erroresDetalle.push({
          pregunta: preguntaTexto,
          tuRespuesta: fila[j],
          respuestaCorrecta: preguntaBanco[5]
        });
      }
      total++;
    });

    let nota = total === 0 ? 0 : Math.round((aciertos / total) * 10);

    // Guarda la nota en la hoja si no existe
    if (!fila[colPuntuacion]) {
      // Armamos el cuerpo del correo individual
      let htmlBody = `¡Gracias por responder el examen!<br>
                   Tu nota es: <b>${nota} / 10</b><br>`;
      // Solo si la nota es 8 o menos, mostramos los errores:
      if (nota <= 8 && erroresDetalle.length > 0) {
        htmlBody += "<br><b>Revisa estas preguntas donde tuviste errores:</b><ul>";
        erroresDetalle.forEach(e => {
          htmlBody += `<li><b>${e.pregunta}</b><br>
                        Tu respuesta: <span style="color:red">${e.tuRespuesta || '(en blanco)'}</span><br>
                        Respuesta correcta: <span style="color:green">${e.respuestaCorrecta}</span></li>`;
        });
        htmlBody += "</ul>";
      }
      htmlBody += "<br>¡Sigue así!";
      sheetRespuestas.getRange(i + 2, colPuntuacion + 1).setValue(nota + " / 10");
      // Notificación individual
      MailApp.sendEmail({
        to: email,
        subject: "Tu calificación del examen diario",
        htmlBody: htmlBody
      });
    } else {
      // Si ya estaba calificado, usamos la nota previa
      nota = fila[colPuntuacion];
    }
    resumen += `<li><b>${email}:</b> ${nota}</li>`;
  }
  resumen += "</ul>";

  // Cambia este correo por el destinatario de RRHH o quien tú quieras:
  const correoResumen = "rrhh1@mycityhome.es";

  MailApp.sendEmail({
    to: correoResumen,
    subject: "Resumen diario de calificaciones - Examen ATIC",
    htmlBody: resumen
  });
}

function limpiarTexto(str) {
  return str.toString().toLowerCase().replace(/\s+/g, ' ').trim();
}

//------------------------------------------------

function alertaPromedioBajo() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetRespuestas = ss.getSheetByName('Form_Responses');
  const sheetPracticantes = ss.getSheetByName('ListaPracticantes'); // Hoja de becarios activos

  let dataRespuestas = sheetRespuestas.getDataRange().getValues();
  let encabezados = dataRespuestas.shift();

  // Consigue los correos de los becarios activos (ignorando encabezado)
  let becarios = sheetPracticantes.getDataRange().getValues();
  becarios.shift();
  let correosActivos = new Set(becarios.map(row => (row[0] || '').toString().trim().toLowerCase()));

  const colEmail = encabezados.indexOf('Dirección de correo electrónico');
  const colPuntuacion = encabezados.indexOf('Puntuación');
  if (colEmail === -1 || colPuntuacion === -1) return;

  // Agrupa notas solo por colaboradores activos
  let notasPorEmail = {};
  for (let i = 0; i < dataRespuestas.length; i++) {
    let fila = dataRespuestas[i];
    let email = (fila[colEmail] || '').toString().trim().toLowerCase();
    if (!email || !correosActivos.has(email)) continue; // SOLO para becarios activos
    let notaRaw = fila[colPuntuacion];
    if (!notaRaw) continue;
    let nota = parseInt(notaRaw.toString().split('/')[0].trim(), 10);
    if (isNaN(nota)) continue;
    if (!notasPorEmail[email]) notasPorEmail[email] = [];
    notasPorEmail[email].push(nota);
  }

  // Define el correo de alerta (RRHH)
  const correoAlerta = "rrhh1@mycityhome.es";

  // Calcula promedio y manda alerta si es necesario SOLO para becarios activos
  for (let email in notasPorEmail) {
    let notas = notasPorEmail[email];
    let promedio = notas.reduce((a, b) => a + b, 0) / notas.length;

    if (promedio < 6) {
      // Al colaborador
      MailApp.sendEmail({
        to: email,
        subject: "Alerta: Promedio bajo en los exámenes",
        htmlBody: `Tu promedio actual en los exámenes diarios es <b>${promedio.toFixed(2)} / 10</b>.<br>
                   Es recomendable reforzar conceptos.`
      });

      // Al responsable/RRHH
      MailApp.sendEmail({
        to: correoAlerta,
        subject: `Alerta: Promedio bajo de ${email}`,
        htmlBody: `El colaborador <b>${email}</b> tiene un promedio de <b>${promedio.toFixed(2)} / 10</b> en los exámenes.<br>
                   Se recomienda seguimiento y formación adicional.`
      });
    }
  }
}

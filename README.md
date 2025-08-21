# 🚀 Examen Diario Automatizado con Google Apps Script  

> Automatización nivel **God Mode**: exámenes diarios, corrección automática, notificaciones por correo y alertas de rendimiento, todo sin mover un dedo.  

---

## 🧑‍💻 ¿Qué es esto?
Un sistema hecho con **Google Apps Script** que:
- 📝 Genera un examen diario con **5 preguntas aleatorias** de un banco en Google Sheets.  
- 📤 Envía el examen automáticamente a **1 o más practicantes** seleccionados al azar.  
- ✅ Corrige respuestas en tiempo real y **califica automáticamente**.  
- 📩 Manda la nota a cada practicante con feedback de errores.  
- 📊 Envía un **resumen diario de notas** al área de RRHH.  
- 🚨 Detecta promedios bajos y manda alertas para seguimiento.  

---

## ⚙️ Tecnologías usadas
- 🟨 **Google Apps Script (JavaScript ES5)**
- 📊 **Google Sheets API**
- 📋 **Google Forms API**
- 📧 **GmailApp** (para envío automático de correos)

---

## 📂 Estructura del Proyecto
```

examen-diario-appscript/
│
├── main.gs       # Código completo de automatización
├── README.md     # Este archivo perrón que estás leyendo 😎

```

---

## 🔑 Funciones principales

| 🚀 Función | 📖 Descripción |
|------------|----------------|
| `limpiarHojaRespuestas()` | 🧹 Limpia la hoja de respuestas manteniendo solo las columnas fijas. |
| `enviarExamenDiario()` | 📤 Genera un examen aleatorio y lo envía a practicantes seleccionados. |
| `corregirYNotificarExamenes()` | ✅ Corrige automáticamente, envía calificación + resumen a RRHH. |
| `alertaPromedioBajo()` | 🚨 Envía alertas si un practicante tiene promedio menor a 6/10. |
| `limpiarTexto(str)` | 🔎 Normaliza texto para corregir con precisión (sin importar mayúsculas/espacios). |

---

## 🚀 Cómo usarlo
1. 🔗 Abre [Google Apps Script](https://script.google.com/).  
2. ➕ Crea un **nuevo proyecto**.  
3. 📋 Copia el contenido de `main.gs` dentro del editor.  
4. ⚙️ Ajusta:
   - `FORM_ID` → ID de tu Google Form.  
   - `correoResumen` / `correoAlerta` → correo de RRHH o administrador.  
5. ⏰ Configura **triggers automáticos** (ej: todos los días a las 09:00 AM).  

---

## 📅 Flujo diario

1. 📤 El sistema envía el examen aleatorio.  
2. 👩‍🎓 El practicante responde el formulario.  
3. ✅ El sistema corrige y calcula la nota.  
4. 📩 El practicante recibe su calificación + feedback de errores.  
5. 📊 RRHH recibe el resumen diario.  
6. 🚨 Si alguien está bajo (<6/10), se dispara una alerta automática.  

---

## 👀 Demo visual
*(Aquí puedes poner capturas de tu Google Form y de los correos automáticos)*  



## ✨ Autor
👩‍💻 Creado por JaquiClau  
⚡ Apasionada por la automatización, bots y soluciones productivas.  


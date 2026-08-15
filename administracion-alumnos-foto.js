/* AulaNFC v3.1 - Selección, vista previa y subida de foto a Google Drive. */
(() => {
  let fotoArchivoSeleccionado = null;
  let parcheInstalado = false;

  function esperarFormulario() {
    const campoUrl = document.getElementById('adminFoto');
    const formulario = document.getElementById('formAdminAlumno');

    if (!campoUrl || !formulario) {
      setTimeout(esperarFormulario, 150);
      return;
    }

    if (!document.getElementById('adminFotoArchivo')) {
      instalarInterfazFoto(campoUrl);
      observarFormulario(formulario, campoUrl);
    }

    instalarParcheGuardado();
  }

  function instalarInterfazFoto(campoUrl) {
    const etiquetaOriginal = campoUrl.closest('label');
    if (!etiquetaOriginal) return;

    etiquetaOriginal.style.display = 'none';

    const contenedor = document.createElement('div');
    contenedor.className = 'admin-alumnos__foto-bloque ancho-completo';
    contenedor.innerHTML = `
      <span class="admin-alumnos__foto-titulo">Fotografía del alumno</span>
      <div class="admin-alumnos__foto-contenido">
        <div class="admin-alumnos__foto-preview" id="adminFotoPreview">
          <span id="adminFotoInicial">👤</span>
          <img id="adminFotoImagen" alt="Vista previa de la fotografía del alumno" hidden>
        </div>
        <div class="admin-alumnos__foto-acciones">
          <label class="admin-alumnos__foto-seleccionar" for="adminFotoArchivo">🖼️ Seleccionar foto</label>
          <input id="adminFotoArchivo" type="file" accept="image/jpeg,image/png,image/webp" hidden>
          <button id="btnQuitarFotoAdmin" type="button" class="admin-alumnos__foto-quitar" hidden>✕ Quitar foto</button>
          <small id="adminFotoAyuda">Selecciona una fotografía JPG, JPEG, PNG o WebP. AulaNFC la optimizará antes de guardarla.</small>
        </div>
      </div>`;

    etiquetaOriginal.insertAdjacentElement('afterend', contenedor);

    document.getElementById('adminFotoArchivo')?.addEventListener('change', manejarArchivoFoto);
    document.getElementById('btnQuitarFotoAdmin')?.addEventListener('click', quitarFotoSeleccionada);
    actualizarPreviewDesdeUrl(campoUrl.value);
  }

  function esFormatoCompatible(archivo) {
    const tipo = String(archivo?.type || '').toLowerCase();
    const nombre = String(archivo?.name || '').toLowerCase();
    return ['image/jpeg','image/png','image/webp'].includes(tipo) || /\.(jpe?g|png|webp)$/.test(nombre);
  }

  function manejarArchivoFoto(evento) {
    const archivo = evento.target.files?.[0];
    if (!archivo) return;

    if (!esFormatoCompatible(archivo)) {
      evento.target.value = '';
      fotoArchivoSeleccionado = null;
      mostrarPreview('');
      mostrarEstadoFoto('❌ Selecciona una imagen JPG, JPEG, PNG o WebP.');
      return;
    }

    if (archivo.size > 8 * 1024 * 1024) {
      evento.target.value = '';
      fotoArchivoSeleccionado = null;
      mostrarPreview('');
      mostrarEstadoFoto('❌ La fotografía supera 8 MB. Selecciona una imagen más pequeña.');
      return;
    }

    fotoArchivoSeleccionado = archivo;
    const lector = new FileReader();

    lector.onload = () => {
      mostrarPreview(String(lector.result || ''));
      mostrarEstadoFoto('✅ Fotografía seleccionada. Se guardará junto con el alumno.');
      document.getElementById('btnQuitarFotoAdmin')?.removeAttribute('hidden');
    };

    lector.onerror = () => {
      fotoArchivoSeleccionado = null;
      mostrarPreview('');
      mostrarEstadoFoto('❌ No fue posible leer esta fotografía.');
    };

    lector.readAsDataURL(archivo);
  }

  function quitarFotoSeleccionada() {
    fotoArchivoSeleccionado = null;
    const input = document.getElementById('adminFotoArchivo');
    const campo = document.getElementById('adminFoto');
    if (input) input.value = '';
    if (campo) campo.value = '';
    mostrarPreview('');
    mostrarEstadoFoto('Fotografía eliminada del formulario.');
    document.getElementById('btnQuitarFotoAdmin')?.setAttribute('hidden','');
  }

  function mostrarPreview(src) {
    const imagen = document.getElementById('adminFotoImagen');
    const inicial = document.getElementById('adminFotoInicial');
    if (!imagen || !inicial) return;

    if (!src) {
      imagen.hidden = true;
      imagen.removeAttribute('src');
      inicial.hidden = false;
      return;
    }

    imagen.onload = () => { imagen.hidden = false; inicial.hidden = true; };
    imagen.onerror = () => { imagen.hidden = true; inicial.hidden = false; };
    imagen.src = src;
  }

  function obtenerIdDrive(valor) {
    const texto = String(valor || '').trim();
    if (!texto) return '';
    for (const patron of [/\/file\/d\/([a-zA-Z0-9_-]+)/,/[?&]id=([a-zA-Z0-9_-]+)/,/\/d\/([a-zA-Z0-9_-]+)/,/^([a-zA-Z0-9_-]{20,})$/]) {
      const m = texto.match(patron);
      if (m?.[1]) return m[1];
    }
    return '';
  }

  function actualizarPreviewDesdeUrl(valor) {
    const texto = String(valor || '').trim();
    if (!texto) {
      mostrarPreview('');
      document.getElementById('btnQuitarFotoAdmin')?.setAttribute('hidden','');
      return;
    }

    const id = obtenerIdDrive(texto);
    mostrarPreview(id ? `https://drive.google.com/thumbnail?id=${encodeURIComponent(id)}&sz=w500` : texto);
    document.getElementById('btnQuitarFotoAdmin')?.removeAttribute('hidden');
  }

  function limpiarEstadoFoto() {
    fotoArchivoSeleccionado = null;
    const input = document.getElementById('adminFotoArchivo');
    if (input) input.value = '';
    actualizarPreviewDesdeUrl(document.getElementById('adminFoto')?.value || '');
  }

  function observarFormulario(formulario, campoUrl) {
    const observador = new MutationObserver(() => {
      if (formulario.classList.contains('oculto')) {
        limpiarEstadoFoto();
        return;
      }
      setTimeout(() => {
        if (!fotoArchivoSeleccionado) actualizarPreviewDesdeUrl(campoUrl.value);
      }, 0);
    });

    observador.observe(formulario,{attributes:true,attributeFilter:['class']});
  }

  async function optimizarFoto(archivo) {
    const dataUrl = await leerComoDataURL(archivo);
    const imagen = await cargarImagen(dataUrl);

    const max = 900;
    let ancho = imagen.naturalWidth || imagen.width;
    let alto = imagen.naturalHeight || imagen.height;

    if (!ancho || !alto) throw new Error('No se pudieron obtener las dimensiones de la fotografía.');

    const escala = Math.min(1, max / Math.max(ancho, alto));
    ancho = Math.max(1, Math.round(ancho * escala));
    alto = Math.max(1, Math.round(alto * escala));

    const canvas = document.createElement('canvas');
    canvas.width = ancho;
    canvas.height = alto;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(imagen,0,0,ancho,alto);

    return canvas.toDataURL('image/jpeg',0.82);
  }

  function leerComoDataURL(archivo) {
    return new Promise((resolve,reject) => {
      const lector = new FileReader();
      lector.onload = () => resolve(String(lector.result || ''));
      lector.onerror = () => reject(new Error('No fue posible leer la fotografía.'));
      lector.readAsDataURL(archivo);
    });
  }

  function cargarImagen(src) {
    return new Promise((resolve,reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('El navegador no pudo procesar esta fotografía.'));
      img.src = src;
    });
  }

  function obtenerEndpoint() {
    try {
      if (typeof URL_APPS_SCRIPT !== 'undefined' && URL_APPS_SCRIPT) return URL_APPS_SCRIPT;
    } catch (_) {}
    throw new Error('No se encontró la URL del Web App de AulaNFC.');
  }

  async function subirFotoDrive(idAlumno,nombreAlumno) {
    mostrarEstadoFoto('⏳ Optimizando y subiendo fotografía...');
    const base64 = await optimizarFoto(fotoArchivoSeleccionado);

    const cuerpo = new URLSearchParams({
      accion: 'guardarfotoalumno',
      idAlumno: String(idAlumno || ''),
      nombreAlumno: String(nombreAlumno || 'Alumno'),
      nombreArchivo: 'foto.jpg',
      tipoMime: 'image/jpeg',
      base64
    });

    const respuestaHttp = await fetch(obtenerEndpoint(),{
      method:'POST',
      body:cuerpo,
      redirect:'follow'
    });

    const texto = await respuestaHttp.text();
    let respuesta;
    try { respuesta = JSON.parse(texto); }
    catch (_) { throw new Error('Apps Script no devolvió una respuesta válida al guardar la fotografía.'); }

    if (!respuesta || respuesta.ok === false || respuesta.exito === false || !respuesta.foto) {
      throw new Error(respuesta?.mensaje || 'No fue posible guardar la fotografía en Drive.');
    }

    return String(respuesta.foto).trim();
  }

  function nombreFormulario(p) {
    return [p.nombre,p.apellidoPaterno,p.apellidoMaterno].filter(Boolean).join(' ').replace(/\s+/g,' ').trim();
  }

  function instalarParcheGuardado() {
    if (parcheInstalado) return;
    if (typeof window.solicitarJSONP !== 'function') {
      setTimeout(instalarParcheGuardado,150);
      return;
    }

    const original = window.solicitarJSONP;

    window.solicitarJSONP = async function(accion,parametros={}) {
      const clave = String(accion || '').trim().toLowerCase();

      if (!fotoArchivoSeleccionado || (clave !== 'crearalumno' && clave !== 'actualizaralumno')) {
        return original(accion,parametros);
      }

      const p = {...parametros};
      const nombre = nombreFormulario(p);

      if (clave === 'actualizaralumno') {
        const id = String(p.idAlumno || '').trim();
        if (!id) throw new Error('No se encontró el ID del alumno para guardar su fotografía.');
        const idFoto = await subirFotoDrive(id,nombre);
        p.foto = idFoto;
        document.getElementById('adminFoto').value = idFoto;
        const r = await original(accion,p);
        if (r && r.ok !== false && r.exito !== false) mostrarEstadoFoto('✅ Alumno y fotografía guardados correctamente.');
        return r;
      }

      // Alumno nuevo: primero obtenemos su ID, luego guardamos la foto y finalmente actualizamos la columna FOTO.
      const creado = await original('crearalumno',{...p,foto:''});
      if (!creado || creado.ok === false || creado.exito === false) return creado;

      const id = String(creado.idAlumno || creado.id || '').trim();
      if (!id) throw new Error('El alumno fue creado, pero no se recibió su ID para guardar la fotografía.');

      const idFoto = await subirFotoDrive(id,nombre);
      document.getElementById('adminIdAlumno').value = id;
      document.getElementById('adminFoto').value = idFoto;

      const actualizado = await original('actualizaralumno',{...p,idAlumno:id,foto:idFoto});
      if (!actualizado || actualizado.ok === false || actualizado.exito === false) return actualizado;

      return {
        ...actualizado,
        idAlumno:id,
        mensaje:'Alumno y fotografía guardados correctamente.'
      };
    };

    parcheInstalado = true;
  }

  function mostrarEstadoFoto(mensaje) {
    const estado = document.getElementById('estadoAdminAlumnos');
    if (estado) estado.textContent = mensaje;
  }

  function agregarEstilos() {
    if (document.getElementById('estilosAdminFotoAlumno')) return;
    const estilo = document.createElement('style');
    estilo.id = 'estilosAdminFotoAlumno';
    estilo.textContent = `
      .admin-alumnos__foto-bloque{display:block;width:100%}
      .admin-alumnos__foto-titulo{display:block;margin-bottom:8px;font-weight:700}
      .admin-alumnos__foto-contenido{display:flex;gap:16px;align-items:center;padding:14px;border:1px solid #d7e3f0;border-radius:14px;background:#f8fbff}
      .admin-alumnos__foto-preview{width:96px;height:96px;flex:0 0 96px;display:grid;place-items:center;overflow:hidden;border-radius:50%;background:#eaf4ff;font-size:36px}
      .admin-alumnos__foto-preview img{width:100%;height:100%;object-fit:cover}
      .admin-alumnos__foto-acciones{min-width:0;display:flex;flex-wrap:wrap;gap:8px;align-items:center}
      .admin-alumnos__foto-seleccionar,.admin-alumnos__foto-quitar{min-height:42px;display:inline-flex;align-items:center;justify-content:center;padding:0 14px;border-radius:10px;cursor:pointer;font-weight:700}
      .admin-alumnos__foto-seleccionar{background:#1976d2;color:#fff}
      .admin-alumnos__foto-quitar{border:1px solid #d7e3f0;background:#fff;color:#b42318}
      #adminFotoAyuda{width:100%;color:#64748b;line-height:1.4}
      @media(max-width:600px){.admin-alumnos__foto-contenido{align-items:flex-start}.admin-alumnos__foto-preview{width:82px;height:82px;flex-basis:82px}.admin-alumnos__foto-seleccionar,.admin-alumnos__foto-quitar{width:100%}}
    `;
    document.head.appendChild(estilo);
  }

  agregarEstilos();
  esperarFormulario();
})();
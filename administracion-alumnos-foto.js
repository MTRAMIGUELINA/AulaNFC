/* AulaNFC v3.3 - Selección, edición y subida privada de fotos de alumnos. */
(() => {
  let fotoArchivoSeleccionado = null;
  let fotoOriginal = '';
  let quitarFotoSolicitada = false;
  let recuperacionFotografica = null;

  function limpiarRecuperacionFotografica() {
    recuperacionFotografica = null;
    fotoArchivoSeleccionado = null;
    quitarFotoSolicitada = false;
    const input = document.getElementById('adminFotoArchivo');
    if (input) input.value = '';
  }

  function prepararFotografiaAlumno(idAlumno) {
    const id = String(idAlumno || '').trim();
    if (recuperacionFotografica && recuperacionFotografica.idAlumno !== id) {
      limpiarRecuperacionFotografica();
    }
  }

  window.AulaNFCAdministracionAlumnos = {
    ...(window.AulaNFCAdministracionAlumnos || {}),
    limpiarRecuperacionFotografica,
    prepararFotografiaAlumno,
    sincronizarFormularioFotografia: prepararFotoFormulario,
    guardarAlumnoConFotografia
  };

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
          <small id="adminFotoAyuda">Si no seleccionas otra foto, se conservará la actual. Puedes reemplazarla o quitarla.</small>
        </div>
      </div>`;

    etiquetaOriginal.insertAdjacentElement('afterend', contenedor);

    document.getElementById('adminFotoArchivo')?.addEventListener('change', manejarArchivoFoto);
    document.getElementById('btnQuitarFotoAdmin')?.addEventListener('click', quitarFotoSeleccionada);
    prepararFotoFormulario();
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
      mostrarEstadoFoto('❌ Selecciona una imagen JPG, JPEG, PNG o WebP.');
      restaurarFotoActual();
      return;
    }

    if (archivo.size > 8 * 1024 * 1024) {
      evento.target.value = '';
      fotoArchivoSeleccionado = null;
      mostrarEstadoFoto('❌ La fotografía supera 8 MB. Selecciona una imagen más pequeña.');
      restaurarFotoActual();
      return;
    }

    fotoArchivoSeleccionado = archivo;
    quitarFotoSolicitada = false;

    const lector = new FileReader();
    lector.onload = () => {
      mostrarPreview(String(lector.result || ''));
      mostrarEstadoFoto(fotoOriginal
        ? '✅ Nueva fotografía seleccionada. Reemplazará la foto actual al guardar.'
        : '✅ Fotografía seleccionada. Se guardará junto con el alumno.');
      document.getElementById('btnQuitarFotoAdmin')?.removeAttribute('hidden');
    };
    lector.onerror = () => {
      fotoArchivoSeleccionado = null;
      mostrarEstadoFoto('❌ No fue posible leer esta fotografía.');
      restaurarFotoActual();
    };
    lector.readAsDataURL(archivo);
  }

  function quitarFotoSeleccionada() {
    fotoArchivoSeleccionado = null;
    quitarFotoSolicitada = true;

    const input = document.getElementById('adminFotoArchivo');
    const campo = document.getElementById('adminFoto');
    if (input) input.value = '';
    if (campo) campo.value = '';

    mostrarPreview('');
    mostrarEstadoFoto(fotoOriginal
      ? '🗑️ La fotografía actual se quitará cuando guardes los cambios.'
      : 'Fotografía eliminada del formulario.');
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

    imagen.onload = () => {
      imagen.hidden = false;
      inicial.hidden = true;
    };
    imagen.onerror = () => {
      imagen.hidden = true;
      inicial.hidden = false;
    };
    imagen.src = src;
  }

  async function cargarFotoActualPrivada() {
    const idAlumno = String(document.getElementById('adminIdAlumno')?.value || '').trim();
    if (!idAlumno || !fotoOriginal || typeof window.solicitarJSONP !== 'function') {
      actualizarPreviewDesdeUrl(fotoOriginal);
      return;
    }

    try {
      const respuesta = await window.solicitarJSONP('obtenerfotoalumno', { idAlumno });
      if (
        respuesta &&
        respuesta.ok !== false &&
        respuesta.exito !== false &&
        respuesta.tieneFoto === true &&
        respuesta.base64
      ) {
        const tipoMime = String(respuesta.tipoMime || 'image/jpeg').trim();
        mostrarPreview(`data:${tipoMime};base64,${String(respuesta.base64).trim()}`);
        document.getElementById('btnQuitarFotoAdmin')?.removeAttribute('hidden');
        return;
      }
    } catch (error) {
      console.warn('No fue posible cargar la vista previa privada de la foto:', error);
    }

    actualizarPreviewDesdeUrl(fotoOriginal);
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

  function prepararFotoFormulario() {
    fotoArchivoSeleccionado = null;
    quitarFotoSolicitada = false;

    const input = document.getElementById('adminFotoArchivo');
    if (input) input.value = '';

    fotoOriginal = String(document.getElementById('adminFoto')?.value || '').trim();
    if (fotoOriginal) cargarFotoActualPrivada();
    else actualizarPreviewDesdeUrl('');
  }

  function restaurarFotoActual() {
    quitarFotoSolicitada = false;
    const campo = document.getElementById('adminFoto');
    if (campo) campo.value = fotoOriginal;
    if (fotoOriginal) cargarFotoActualPrivada();
    else actualizarPreviewDesdeUrl('');
  }

  function observarFormulario(formulario) {
    const observador = new MutationObserver(() => {
      if (formulario.classList.contains('oculto')) {
        limpiarRecuperacionFotografica();
        return;
      }
      setTimeout(prepararFotoFormulario, 30);
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

  async function guardarAlumnoConFotografia(accion,parametros={},transportar) {
      if (typeof transportar !== 'function') {
        throw new Error('No se encontró el transporte JSONP de AulaNFC.');
      }
      const clave = String(accion || '').trim().toLowerCase();

      if (clave !== 'crearalumno' && clave !== 'actualizaralumno') {
        return transportar(accion,parametros);
      }

      const p = {...parametros};
      const nombre = nombreFormulario(p);

      // EDITAR SIN TOCAR FOTO: conservar exactamente la referencia existente.
      if (clave === 'actualizaralumno' && !fotoArchivoSeleccionado && !quitarFotoSolicitada) {
        p.foto = fotoOriginal || String(p.foto || '').trim();
        return transportar(accion,p);
      }

      // EDITAR Y QUITAR FOTO: limpiar la columna FOTO.
      if (clave === 'actualizaralumno' && quitarFotoSolicitada && !fotoArchivoSeleccionado) {
        p.foto = '';
        const r = await transportar(accion,p);
        if (r && r.ok !== false && r.exito !== false) {
          fotoOriginal = '';
          quitarFotoSolicitada = false;
          mostrarEstadoFoto('✅ Fotografía retirada del alumno correctamente.');
        }
        return r;
      }

      // EDITAR Y REEMPLAZAR FOTO: subir nueva y guardar su ID.
      if (clave === 'actualizaralumno' && fotoArchivoSeleccionado) {
        const id = String(p.idAlumno || '').trim();
        if (!id) throw new Error('No se encontró el ID del alumno para guardar su fotografía.');
        const esRecuperacion = recuperacionFotografica?.idAlumno === id;
        try {
          const idFoto = esRecuperacion && recuperacionFotografica.idFoto
            ? recuperacionFotografica.idFoto
            : await subirFotoDrive(id,nombre);
          if (esRecuperacion) recuperacionFotografica.idFoto = idFoto;
          p.foto = idFoto;
          document.getElementById('adminFoto').value = idFoto;
          const r = await transportar(accion,p);
          if (r && r.ok !== false && r.exito !== false) {
            fotoOriginal = idFoto;
            limpiarRecuperacionFotografica();
            mostrarEstadoFoto('✅ Alumno y nueva fotografía guardados correctamente.');
          } else if (esRecuperacion) {
            throw new Error(r?.mensaje || 'No fue posible asociar la fotografía al alumno.');
          }
          return r;
        } catch (error) {
          if (esRecuperacion) {
            throw new Error(`El alumno sí fue creado con ID ${id}, pero la fotografía no pudo completarse. ${error?.message || 'Intenta guardar nuevamente para reanudar la fotografía.'}`);
          }
          throw error;
        }
      }

      // ALUMNO NUEVO SIN FOTO.
      if (clave === 'crearalumno' && !fotoArchivoSeleccionado) {
        p.foto = '';
        return transportar(accion,p);
      }

      // ALUMNO NUEVO CON FOTO: crear, obtener ID, subir foto y actualizar.
      const creado = await transportar('crearalumno',{...p,foto:''});
      if (!creado || creado.ok === false || creado.exito === false) return creado;

      const id = String(creado.idAlumno || creado.id || '').trim();
      if (!id) throw new Error('El alumno fue creado, pero no se recibió su ID para guardar la fotografía.');

      const administracion = window.AulaNFCAdministracionAlumnos;
      if (!administracion?.conservarAlumnoCreado?.(id,p)) {
        throw new Error(`El alumno sí fue creado con ID ${id}, pero no fue posible conservarlo en modo edición para completar su fotografía.`);
      }
      recuperacionFotografica = { idAlumno:id, idFoto:'' };

      let idFoto;
      let actualizado;
      try {
        idFoto = await subirFotoDrive(id,nombre);
        recuperacionFotografica.idFoto = idFoto;
        document.getElementById('adminFoto').value = idFoto;

        actualizado = await transportar('actualizaralumno',{...p,idAlumno:id,foto:idFoto});
        if (!actualizado || actualizado.ok === false || actualizado.exito === false) {
          throw new Error(actualizado?.mensaje || 'No fue posible asociar la fotografía al alumno.');
        }
      } catch (error) {
        throw new Error(`El alumno sí fue creado con ID ${id}, pero la fotografía no pudo completarse. ${error?.message || 'Intenta guardar nuevamente para reanudar la fotografía.'}`);
      }

      fotoOriginal = idFoto;
      limpiarRecuperacionFotografica();

      return {
        ...actualizado,
        idAlumno:id,
        mensaje:'Alumno y fotografía guardados correctamente.'
      };
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

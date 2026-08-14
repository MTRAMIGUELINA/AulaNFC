/* AulaNFC v3.1 - Captura/selección y vista previa de foto en Administración de alumnos. */
(() => {
  let fotoArchivoSeleccionado = null;
  let fotoObjectUrl = '';

  function esperarFormulario() {
    const campoUrl = document.getElementById('adminFoto');
    const formulario = document.getElementById('formAdminAlumno');

    if (!campoUrl || !formulario) {
      setTimeout(esperarFormulario, 150);
      return;
    }

    if (document.getElementById('adminFotoArchivo')) return;

    instalarInterfazFoto(campoUrl);
    observarFormulario(formulario, campoUrl);
  }

  function instalarInterfazFoto(campoUrl) {
    const etiquetaOriginal = campoUrl.closest('label');
    if (!etiquetaOriginal) return;

    // Conservamos el campo URL para compatibilidad con alumnos existentes,
    // pero deja de ser el control principal de la interfaz.
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
          <label class="admin-alumnos__foto-seleccionar" for="adminFotoArchivo">
            📷 Tomar o elegir foto
          </label>

          <input
            id="adminFotoArchivo"
            type="file"
            accept="image/*"
            capture="environment"
            hidden
          >

          <button id="btnQuitarFotoAdmin" type="button" class="admin-alumnos__foto-quitar" hidden>
            ✕ Quitar foto
          </button>

          <small id="adminFotoAyuda">
            En celular puedes tomar una foto con la cámara o elegir una imagen existente.
          </small>
        </div>
      </div>
    `;

    etiquetaOriginal.insertAdjacentElement('afterend', contenedor);

    const inputArchivo = document.getElementById('adminFotoArchivo');
    const botonQuitar = document.getElementById('btnQuitarFotoAdmin');

    inputArchivo.addEventListener('change', manejarArchivoFoto);
    botonQuitar.addEventListener('click', quitarFotoSeleccionada);

    // Si se abre un alumno que ya tiene URL, la mostramos.
    actualizarPreviewDesdeUrl(campoUrl.value);
  }

  function manejarArchivoFoto(evento) {
    const archivo = evento.target.files && evento.target.files[0];
    if (!archivo) return;

    if (!archivo.type || !archivo.type.startsWith('image/')) {
      mostrarEstadoFoto('❌ Selecciona un archivo de imagen válido.');
      evento.target.value = '';
      return;
    }

    const maxBytes = 8 * 1024 * 1024;
    if (archivo.size > maxBytes) {
      mostrarEstadoFoto('❌ La fotografía es demasiado grande. Usa una imagen menor de 8 MB.');
      evento.target.value = '';
      return;
    }

    fotoArchivoSeleccionado = archivo;

    if (fotoObjectUrl) {
      URL.revokeObjectURL(fotoObjectUrl);
    }

    fotoObjectUrl = URL.createObjectURL(archivo);
    mostrarPreview(fotoObjectUrl);
    mostrarEstadoFoto('✅ Fotografía seleccionada. Se guardará cuando conectemos la subida a Drive.');

    document.getElementById('btnQuitarFotoAdmin')?.removeAttribute('hidden');

    window.AulaNFCFotoAlumno = {
      archivo: fotoArchivoSeleccionado,
      obtenerArchivo: () => fotoArchivoSeleccionado,
      limpiar: limpiarEstadoFoto
    };
  }

  function quitarFotoSeleccionada() {
    const inputArchivo = document.getElementById('adminFotoArchivo');
    const campoUrl = document.getElementById('adminFoto');

    fotoArchivoSeleccionado = null;

    if (fotoObjectUrl) {
      URL.revokeObjectURL(fotoObjectUrl);
      fotoObjectUrl = '';
    }

    if (inputArchivo) inputArchivo.value = '';
    if (campoUrl) campoUrl.value = '';

    mostrarPreview('');
    mostrarEstadoFoto('Fotografía eliminada del formulario.');
    document.getElementById('btnQuitarFotoAdmin')?.setAttribute('hidden', '');
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

  function obtenerIdDrive(valor) {
    const texto = String(valor || '').trim();
    if (!texto) return '';

    const patrones = [
      /\/file\/d\/([a-zA-Z0-9_-]+)/,
      /[?&]id=([a-zA-Z0-9_-]+)/,
      /\/d\/([a-zA-Z0-9_-]+)/,
      /^([a-zA-Z0-9_-]{20,})$/
    ];

    for (const patron of patrones) {
      const coincidencia = texto.match(patron);
      if (coincidencia && coincidencia[1]) return coincidencia[1];
    }

    return '';
  }

  function actualizarPreviewDesdeUrl(valor) {
    const texto = String(valor || '').trim();
    if (!texto) {
      mostrarPreview('');
      return;
    }

    const idDrive = obtenerIdDrive(texto);
    const src = idDrive
      ? `https://drive.google.com/thumbnail?id=${encodeURIComponent(idDrive)}&sz=w500`
      : texto;

    mostrarPreview(src);
    document.getElementById('btnQuitarFotoAdmin')?.removeAttribute('hidden');
  }

  function limpiarEstadoFoto() {
    fotoArchivoSeleccionado = null;

    if (fotoObjectUrl) {
      URL.revokeObjectURL(fotoObjectUrl);
      fotoObjectUrl = '';
    }

    const inputArchivo = document.getElementById('adminFotoArchivo');
    if (inputArchivo) inputArchivo.value = '';

    const campoUrl = document.getElementById('adminFoto');
    actualizarPreviewDesdeUrl(campoUrl?.value || '');

    window.AulaNFCFotoAlumno = {
      archivo: null,
      obtenerArchivo: () => null,
      limpiar: limpiarEstadoFoto
    };
  }

  function observarFormulario(formulario, campoUrl) {
    const observador = new MutationObserver(() => {
      if (formulario.classList.contains('oculto')) {
        limpiarEstadoFoto();
        return;
      }

      // Esperamos un instante porque editarAlumno() rellena adminFoto
      // justo antes de mostrar el formulario.
      setTimeout(() => {
        if (!fotoArchivoSeleccionado) {
          actualizarPreviewDesdeUrl(campoUrl.value);
        }
      }, 0);
    });

    observador.observe(formulario, {
      attributes: true,
      attributeFilter: ['class']
    });
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
      .admin-alumnos__foto-bloque {
        display: block;
        width: 100%;
      }

      .admin-alumnos__foto-titulo {
        display: block;
        margin-bottom: 8px;
        font-weight: 700;
      }

      .admin-alumnos__foto-contenido {
        display: flex;
        gap: 16px;
        align-items: center;
        padding: 14px;
        border: 1px solid #d7e3f0;
        border-radius: 14px;
        background: #f8fbff;
      }

      .admin-alumnos__foto-preview {
        width: 96px;
        height: 96px;
        flex: 0 0 96px;
        display: grid;
        place-items: center;
        overflow: hidden;
        border-radius: 50%;
        background: #eaf4ff;
        font-size: 36px;
      }

      .admin-alumnos__foto-preview img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .admin-alumnos__foto-acciones {
        min-width: 0;
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        align-items: center;
      }

      .admin-alumnos__foto-seleccionar,
      .admin-alumnos__foto-quitar {
        min-height: 42px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0 14px;
        border-radius: 10px;
        cursor: pointer;
        font-weight: 700;
      }

      .admin-alumnos__foto-seleccionar {
        background: #1976d2;
        color: #fff;
      }

      .admin-alumnos__foto-quitar {
        border: 1px solid #d7e3f0;
        background: #fff;
        color: #b42318;
      }

      #adminFotoAyuda {
        width: 100%;
        color: #64748b;
        line-height: 1.4;
      }

      @media (max-width: 600px) {
        .admin-alumnos__foto-contenido {
          align-items: flex-start;
        }

        .admin-alumnos__foto-preview {
          width: 82px;
          height: 82px;
          flex-basis: 82px;
        }

        .admin-alumnos__foto-seleccionar,
        .admin-alumnos__foto-quitar {
          width: 100%;
        }
      }
    `;
    document.head.appendChild(estilo);
  }

  agregarEstilos();
  esperarFormulario();
})();
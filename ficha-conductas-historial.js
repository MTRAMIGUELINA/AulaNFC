/* Historial pedagógico de conductas en la ficha del alumno.
 * Consulta los registros existentes; no modifica datos ni requiere nuevas hojas.
 */
(() => {
  const $ = id => document.getElementById(id);
  const esc = v => String(v ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  let ultimoId = '', version = 0;
  function crear() {
    const contenido = $('contenidoFichaAlumno');
    if (!contenido) return false;
    if ($('fichaHistorialConductas')) return true;
    const seccion = document.createElement('section');
    seccion.id = 'fichaHistorialConductas';
    seccion.className = 'ficha-alumno__resumen';
    seccion.innerHTML = '<h3>📋 Seguimiento de conducta</h3><p id="fichaConductasEstado" aria-live="polite">Selecciona un alumno para consultar sus registros.</p><div id="fichaConductasFrecuentes"></div><div id="fichaConductasLista"></div>';
    const acciones = contenido.querySelector('.ficha-alumno__acciones');
    if (acciones) contenido.insertBefore(seccion, acciones);
    else contenido.appendChild(seccion);
    return true;
  }
  function mostrarRegistros(registros) {
    const conductas = registros.filter(r => String(r.modulo || '').toLowerCase().includes('conducta'));
    const frecuencias = new Map();
    conductas.forEach(r => {
      const texto = String(r.registro || r.detalle || '').trim();
      texto.split(/\s*\|\s*/).map(v => v.trim()).filter(Boolean).forEach(v => {
        const clave = v.toLocaleLowerCase('es');
        const previo = frecuencias.get(clave);
        frecuencias.set(clave, {texto:v, cantidad:(previo?.cantidad || 0) + 1});
      });
    });
    const frecuentes = [...frecuencias.values()].filter(v => v.cantidad > 1).sort((a,b) => b.cantidad-a.cantidad);
    $('fichaConductasEstado').textContent = conductas.length + ' registros de conducta encontrados.';
    $('fichaConductasFrecuentes').innerHTML = frecuentes.length
      ? '<h4>Conductas recurrentes</h4><ul>' + frecuentes.map(v => '<li>' + esc(v.texto) + ' <strong>(' + v.cantidad + ' registros)</strong></li>').join('') + '</ul>'
      : '<p>No se identifican conductas repetidas en los registros consultados.</p>';
    $('fichaConductasLista').innerHTML = conductas.length
      ? '<h4>Historial de observaciones</h4>' + conductas.map(r => {
          const fecha = [r.fecha,r.hora].filter(Boolean).join(' · ');
          const items = String(r.registro || r.detalle || '').split(/\s*\|\s*/).map(x=>x.trim()).filter(Boolean);
          return '<article style="border-top:1px solid #ddd;padding:10px 0"><strong>' + esc(fecha || 'Sin fecha') +
            '</strong><ul>' + items.map(x=>'<li>'+esc(x)+'</li>').join('') + '</ul></article>';
        }).join('')
      : '<p>Este alumno todavía no tiene conductas registradas.</p>';
  }
  async function cargar(id) {
    const actual = ++version;
    if (!id || id === '—') {
      $('fichaConductasEstado').textContent = 'Selecciona un alumno.';
      $('fichaConductasFrecuentes').replaceChildren();
      $('fichaConductasLista').replaceChildren();
      return;
    }
    $('fichaConductasEstado').textContent = 'Consultando conductas...';
    $('fichaConductasFrecuentes').replaceChildren();
    $('fichaConductasLista').replaceChildren();
    try {
      const respuesta = await solicitarJSONP('obtenerhistorialgeneral',{idAlumno:id});
      if (actual !== version) return;
      if (!respuesta || (respuesta.ok !== true && respuesta.exito !== true)) throw new Error(respuesta?.mensaje || 'No se pudo consultar el historial.');
      mostrarRegistros(Array.isArray(respuesta.registros) ? respuesta.registros : (Array.isArray(respuesta.historial) ? respuesta.historial : []));
    } catch (error) {
      if (actual === version) $('fichaConductasEstado').textContent = 'No fue posible cargar las conductas: ' + (error.message || 'Error desconocido');
    }
  }
  function iniciar() {
    if (!crear()) return false;
    const idNodo = $('idFichaAlumno');
    if (!idNodo) return false;
    const observar = () => {
      const id = String(idNodo.textContent || '').trim();
      if (id === ultimoId) return;
      ultimoId = id;
      cargar(id);
    };
    new MutationObserver(observar).observe(idNodo,{childList:true,characterData:true,subtree:true});
    observar();
    return true;
  }
  const timer = setInterval(() => { if (iniciar()) clearInterval(timer); },200);
  setTimeout(()=>clearInterval(timer),15000);
})();

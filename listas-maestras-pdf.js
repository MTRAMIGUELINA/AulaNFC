/* AulaNFC - Exportar Listas Maestras a PDF mediante vista imprimible. */
(() => {
  let procesando = false;
  const CAMPOS = [
    ['LENGUAJES', 'Lenguajes'],
    ['SABERES Y PENSAMIENTO CIENTÍFICO', 'Saberes y Pensamiento Científico'],
    ['ÉTICA, NATURALEZA Y SOCIEDADES', 'Ética, Naturaleza y Sociedades'],
    ['DE LO HUMANO Y LO COMUNITARIO', 'De lo Humano y lo Comunitario']
  ];

  const esc = (valor) => String(valor ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');

  function esperarBase() {
    const nav = document.getElementById('menuLateral')?.querySelector('.menu-lateral__navegacion');
    if (!nav || typeof window.solicitarJSONP !== 'function') return setTimeout(esperarBase, 120);
    if (document.getElementById('menuExportarListasPDF')) return;
    const boton = document.createElement('button');
    boton.id = 'menuExportarListasPDF';
    boton.type = 'button';
    boton.className = 'menu-lateral__opcion';
    boton.innerHTML = '<span class="menu-lateral__icono" aria-hidden="true">📄</span><span>Exportar listas a PDF</span>';
    nav.appendChild(boton);
    boton.addEventListener('click', abrirSelector);
  }

  function cerrarMenu() {
    document.getElementById('menuLateral')?.classList.remove('abierto');
    document.getElementById('fondoMenuLateral')?.classList.remove('visible');
    document.body.classList.remove('menu-abierto');
    document.getElementById('btnMenuLateral')?.setAttribute('aria-expanded', 'false');
    document.getElementById('menuLateral')?.setAttribute('aria-hidden', 'true');
  }

  function abrirSelector() {
    cerrarMenu();
    document.getElementById('modalListasPDF')?.remove();
    const ahora = new Date();
    const modal = document.createElement('div');
    modal.id = 'modalListasPDF';
    modal.innerHTML = `<div class="lpdf-fondo"><section class="lpdf-panel" role="dialog" aria-modal="true" aria-labelledby="lpdfTitulo">
      <button class="lpdf-cerrar" type="button" aria-label="Cerrar">×</button>
      <h2 id="lpdfTitulo">📄 Exportar listas a PDF</h2>
      <label>Lista</label><select id="lpdfTipo"><option value="asistencia">Asistencia</option><option value="tareas">Tareas</option><option value="participacion">Participación</option></select>
      <div id="lpdfAsistencia"><label>Mes</label><select id="lpdfMes">${Array.from({length:12},(_,i)=>`<option value="${i+1}" ${i===ahora.getMonth()?'selected':''}>${['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'][i]}</option>`).join('')}</select><label>Año</label><input id="lpdfAnio" type="number" min="2020" max="2100" value="${ahora.getFullYear()}"></div>
      <div id="lpdfParticipacion" hidden><label>Campo formativo</label><select id="lpdfCampo">${CAMPOS.map(([v,t])=>`<option value="${esc(v)}">${esc(t)}</option>`).join('')}</select></div>
      <p class="lpdf-ayuda">La lista se actualizará con los registros actuales antes de preparar el documento.</p>
      <button id="lpdfGenerar" class="lpdf-generar" type="button">Preparar PDF</button><div id="lpdfEstado" class="lpdf-estado"></div>
    </section></div><style>
      .lpdf-fondo{position:fixed;inset:0;z-index:10000;background:#0007;display:grid;place-items:center;padding:18px}.lpdf-panel{width:min(440px,100%);background:#fff;border-radius:18px;padding:22px;box-shadow:0 18px 60px #0005;font-family:Arial,sans-serif}.lpdf-panel h2{margin:0 32px 18px 0}.lpdf-panel label{display:block;font-weight:700;margin:12px 0 5px}.lpdf-panel select,.lpdf-panel input{width:100%;padding:11px;border:1px solid #bcc7d1;border-radius:10px;font-size:16px}.lpdf-cerrar{float:right;border:0;background:transparent;font-size:28px;cursor:pointer}.lpdf-generar{width:100%;margin-top:15px;padding:12px;border:0;border-radius:11px;background:#1f4e78;color:#fff;font-weight:800;font-size:16px;cursor:pointer}.lpdf-generar:disabled{opacity:.55}.lpdf-ayuda{font-size:12px;color:#607d8b}.lpdf-estado{margin-top:10px;font-size:13px;font-weight:700}
    </style>`;
    document.body.appendChild(modal);
    const tipo = modal.querySelector('#lpdfTipo');
    const actualizarCampos = () => {
      modal.querySelector('#lpdfAsistencia').hidden = tipo.value !== 'asistencia';
      modal.querySelector('#lpdfParticipacion').hidden = tipo.value !== 'participacion';
    };
    tipo.addEventListener('change', actualizarCampos);
    modal.querySelector('.lpdf-cerrar').addEventListener('click', () => modal.remove());
    modal.querySelector('.lpdf-fondo').addEventListener('click', (e) => { if (e.target === e.currentTarget) modal.remove(); });
    modal.querySelector('#lpdfGenerar').addEventListener('click', generar);
    actualizarCampos();
  }

  async function obtenerCiclo() {
    const local = String(window.AULANFC_CONFIGURACION?.CICLO_ESCOLAR || '').trim();
    if (local) return local;
    const r = await window.solicitarJSONP('obtenerconfiguracion');
    if (!r || (r.ok !== true && r.exito !== true)) throw new Error(r?.mensaje || 'No fue posible obtener la configuración.');
    const ciclo = String(r.configuracion?.CICLO_ESCOLAR || '').trim();
    if (!ciclo) throw new Error('Configura primero el ciclo escolar.');
    window.AULANFC_CONFIGURACION = r.configuracion || {};
    return ciclo;
  }

  async function generar() {
    if (procesando) return;
    const modal = document.getElementById('modalListasPDF');
    if (!modal) return;
    const boton = modal.querySelector('#lpdfGenerar');
    const estado = modal.querySelector('#lpdfEstado');
    const tipo = modal.querySelector('#lpdfTipo').value;
    const ventana = window.open('', '_blank');
    if (!ventana) { estado.textContent = '❌ El navegador bloqueó la ventana del PDF.'; return; }
    ventana.document.write('<!doctype html><html><body style="font-family:Arial;padding:30px">Preparando lista...</body></html>'); ventana.document.close();
    procesando = true; boton.disabled = true; estado.textContent = '⏳ Preparando lista...';
    try {
      const cicloEscolar = await obtenerCiclo();
      const params = { tipo, cicloEscolar };
      if (tipo === 'asistencia') { params.mes = modal.querySelector('#lpdfMes').value; params.anio = modal.querySelector('#lpdfAnio').value; }
      if (tipo === 'participacion') params.campoFormativo = modal.querySelector('#lpdfCampo').value;
      const r = await window.solicitarJSONP('obtenerlistamaestrapdf', params);
      if (!r || (r.ok !== true && r.exito !== true)) throw new Error(r?.mensaje || 'No fue posible preparar la lista.');
      ventana.document.open(); ventana.document.write(construirHTML(r)); ventana.document.close();
      estado.textContent = '✅ Lista preparada. Usa “Imprimir / Guardar como PDF”.';
    } catch (error) {
      ventana.document.open(); ventana.document.write(`<html><body style="font-family:Arial;padding:30px"><h2>No fue posible preparar la lista</h2><p>${esc(error?.message || 'Error desconocido')}</p></body></html>`); ventana.document.close();
      estado.textContent = `❌ ${error?.message || 'No fue posible preparar la lista.'}`;
    } finally { procesando = false; boton.disabled = false; }
  }

  function construirHTML(r) {
    const matriz = Array.isArray(r.matriz) ? r.matriz : [];
    const cfg = r.configuracion || {};
    const filasInfo = matriz.slice(0, 5).map(f => `<div>${esc(f[0] || '')}</div>`).join('');
    const encabezados = matriz[5] || [];
    const cuerpo = matriz.slice(6);
    const tabla = `<table><thead><tr>${encabezados.map(x=>`<th>${esc(x).replace(/\n/g,'<br>')}</th>`).join('')}</tr></thead><tbody>${cuerpo.map(f=>`<tr>${encabezados.map((_,i)=>`<td>${esc(f[i] || '').replace(/\n/g,'<br>')}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
    return `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>${esc(matriz[0]?.[0] || 'Lista maestra')}</title><style>@page{size:letter landscape;margin:5mm}*{box-sizing:border-box}body{margin:0;font-family:Arial,sans-serif;color:#1f2933}.acciones{position:sticky;top:0;background:#263238;padding:10px;text-align:center}.acciones button{padding:10px 18px;border:0;border-radius:8px;font-weight:800;cursor:pointer}.hoja{padding:4mm}.escuela{text-align:center;margin-bottom:4px}.escuela h1{margin:0;font-size:16px}.escuela p{margin:2px 0;font-size:9px}.info{margin:4px 0 6px;font-size:9px;font-weight:700;line-height:1.15}.info div{margin:1px 0}table{width:100%;border-collapse:collapse;table-layout:fixed;font-size:9px}th,td{border:1px solid #667;padding:4.5px 4px;vertical-align:middle}th{background:#1f4e78;color:#fff;text-align:center;white-space:normal}th:first-child,td:first-child{width:5%;text-align:center}th:nth-child(2),td:nth-child(2){width:32%;text-align:left}th:nth-child(n+3),td:nth-child(n+3){text-align:center}tbody tr:nth-child(even){background:#f3f6f8}@media print{.acciones{display:none}.hoja{padding:0}th{background:#1f4e78!important;color:#fff!important;-webkit-print-color-adjust:exact;print-color-adjust:exact}tbody tr:nth-child(even){background:#f3f6f8!important;-webkit-print-color-adjust:exact;print-color-adjust:exact}}</style></head><body><div class="acciones"><button onclick="window.print()">🖨️ Imprimir / Guardar como PDF</button></div><main class="hoja"><header class="escuela"><h1>${esc(cfg.ESCUELA || 'AulaNFC')}</h1><p>${esc([cfg.CCT, cfg.TURNO, cfg.DOCENTE].filter(Boolean).join(' · '))}</p></header><section class="info">${filasInfo}</section>${tabla}</main></body></html>`;
  }

  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', esperarBase) : esperarBase();
})();

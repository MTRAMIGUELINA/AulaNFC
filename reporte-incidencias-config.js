/* AulaNFC v3.1 - Configuración dinámica para PDF de incidencias. */
(() => {
  const esc=(v)=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
  const fechaVisible=(valor)=>{if(!valor)return '';const [a,m,d]=String(valor).split('-');return a&&m&&d?`${d}/${m}/${a}`:String(valor)};

  async function obtenerConfig(){
    try{
      const r=await solicitarJSONP('obtenerconfiguracion');
      if(!r||(r.ok===false||r.exito===false))return {};
      return r.configuracion||{};
    }catch(_){return {};}
  }

  async function obtenerAlumno(id){
    try{
      const r=await solicitarJSONP('obtenerAlumnos');
      const lista=Array.isArray(r?.alumnos)?r.alumnos:[];
      return lista.find(a=>String(a.id)===String(id))||null;
    }catch(_){return null;}
  }

  function nombreCompleto(a){return String(a?.nombreCompleto||[a?.nombre,a?.apellidoPaterno,a?.apellidoMaterno].filter(Boolean).join(' ')||'Alumno').replace(/\s+/g,' ').trim();}

  function incidenciaFinal(){
    const tipo=String(document.getElementById('incidenciaTipo')?.value||'').trim();
    if(tipo.toLowerCase()!=='otra')return tipo;
    return String(document.getElementById('incidenciaOtraTexto')?.value||'').trim();
  }

  function construir(datos,cfg){
    const escuela=cfg.ESCUELA||'Escuela';
    const docente=cfg.DOCENTE||'Docente';
    const partesEscuela=[];
    if(cfg.CCT)partesEscuela.push(`C.C.T. ${cfg.CCT}`);
    if(cfg.ZONA)partesEscuela.push(`Zona Escolar ${cfg.ZONA}`);
    if(cfg.SECTOR)partesEscuela.push(`Sector ${cfg.SECTOR}`);
    if(cfg.TURNO)partesEscuela.push(`Turno ${cfg.TURNO}`);
    const ubicacion=[cfg.LOCALIDAD,cfg.ESTADO].filter(Boolean).join(', ');
    if(ubicacion)partesEscuela.push(ubicacion);
    if(cfg.CICLO_ESCOLAR)partesEscuela.push(`Ciclo escolar ${cfg.CICLO_ESCOLAR}`);
    partesEscuela.push('AulaNFC');

    return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(datos.folio)} - Reporte de incidencia</title><style>
@page{size:letter portrait;margin:10mm}*{box-sizing:border-box}body{margin:0;background:#eef5fb;color:#243447;font-family:"Trebuchet MS",Arial,sans-serif}.acciones{position:sticky;top:0;z-index:5;display:flex;justify-content:center;gap:10px;padding:10px;background:#243447}.acciones button{border:0;border-radius:12px;padding:11px 18px;font-weight:800;cursor:pointer}.hoja{width:216mm;min-height:279mm;margin:14px auto;padding:10mm;background:#fff;box-shadow:0 8px 30px #0002}.enc{position:relative;text-align:center;padding:14px 18px;border-radius:22px;background:linear-gradient(135deg,#e8f7ff,#fff1d6 55%,#f2e9ff);border:3px solid #76c9f4}.enc:before{content:"✏️";position:absolute;left:18px;top:16px;font-size:28px;transform:rotate(-12deg)}.enc:after{content:"📚";position:absolute;right:18px;top:16px;font-size:28px}.escuela{font-size:14px;font-weight:900;color:#1565c0;letter-spacing:.4px}.enc h1{margin:5px 0 3px;font-size:26px;color:#ef5350}.datosEscuela{font-size:10px;font-weight:800;color:#546e7a}.folio{display:flex;justify-content:space-between;gap:12px;margin-top:12px;padding:10px 13px;border-radius:14px;background:#fff8d9;border:2px solid #ffd45c;font-size:12px}.alumno{margin-top:12px;padding:12px 14px;border:2px solid #90caf9;border-radius:18px;background:#f4faff}.alumno h2{margin:0 0 7px;color:#1565c0;font-size:19px}.datos{display:flex;flex-wrap:wrap;gap:9px 18px;font-size:11px}.tipo{margin-top:12px;padding:12px 14px;border:2px solid #ffb74d;border-radius:18px;background:#fff4e5}.tipo strong{display:block;margin-top:4px;font-size:17px;color:#e65100}.bloque{margin-top:12px;padding:13px 15px;border-radius:18px;border:2px solid}.descripcion{background:#eef7ff;border-color:#90caf9}.accionesTomadas{background:#edf9f1;border-color:#8fd6a3}.acuerdos{background:#f5ecff;border-color:#c7a3f3}.bloque h3{margin:0 0 8px;font-size:14px}.texto{min-height:112px;white-space:pre-wrap;line-height:1.55;font-size:12px;padding:9px 10px;background:#fff;border-radius:12px;border:1px solid #dbe5ee}.firmas{display:grid;grid-template-columns:1fr 1fr;gap:48px;margin-top:52px;padding:0 20px}.firma{padding-top:7px;border-top:1.6px solid #546e7a;text-align:center;font-size:10px;font-weight:800}.firma .nombre{display:block;margin-bottom:2px;font-size:11px}.pie{text-align:center;margin-top:24px;font-size:9px;color:#78909c}.nota{margin-top:10px;font-size:9px;color:#78909c;text-align:center}@media print{body{background:#fff}.acciones{display:none!important}.hoja{width:auto;min-height:auto;margin:0;padding:0;box-shadow:none}.enc,.folio,.alumno,.tipo,.bloque{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
</style></head><body><div class="acciones"><button onclick="window.print()">🖨️ Imprimir / Guardar como PDF</button><button onclick="window.close()">✕ Cerrar</button></div><main class="hoja"><header class="enc"><div class="escuela">${esc(escuela)}</div><h1>Reporte de Incidencia</h1><div class="datosEscuela">${esc(partesEscuela.join(' · '))}</div></header><section class="folio"><span><b>Folio:</b> ${esc(datos.folio)}</span><span><b>Fecha:</b> ${esc(fechaVisible(datos.fecha))}</span></section><section class="alumno"><h2>${esc(datos.nombre)}</h2><div class="datos"><span><b>ID:</b> ${esc(datos.id)}</span><span><b>Grado:</b> ${esc(datos.grado)}°</span><span><b>Grupo:</b> ${esc(datos.grupo)}</span></div></section><section class="tipo"><span>📌 Incidencia reportada</span><strong>${esc(datos.incidencia)}</strong></section><section class="bloque descripcion"><h3>📝 Descripción del incidente</h3><div class="texto">${esc(datos.descripcion)}</div></section><section class="bloque accionesTomadas"><h3>⚙️ Acciones tomadas</h3><div class="texto">${esc(datos.accionesTomadas)}</div></section><section class="bloque acuerdos"><h3>🤝 Acuerdos y compromisos</h3><div class="texto">${esc(datos.acuerdos)}</div></section><section class="firmas"><div class="firma"><span class="nombre">${esc(docente)}</span>Firma del docente</div><div class="firma">Firma del padre, madre o tutor</div></section><div class="nota">El presente documento registra los hechos y acuerdos asentados en AulaNFC.</div><footer class="pie">Reporte generado con AulaNFC · Seguimiento escolar</footer></main></body></html>`;
  }

  function instalar(){
    const boton=document.getElementById('btnPDFIncidencia');
    if(!boton||boton.dataset.configPdf==='true')return false;
    const clon=boton.cloneNode(true);
    boton.replaceWith(clon);
    clon.dataset.configPdf='true';
    clon.addEventListener('click',async()=>{
      const estado=document.getElementById('estadoReporteIncidencias');
      const folio=String(window.folioIncidenciaActual||'').trim();
      if(!folio){if(estado)estado.textContent='⚠️ Primero guarda el reporte para obtener un folio.';return;}
      const tipo=String(document.getElementById('incidenciaTipo')?.value||'').trim();
      const incidencia=incidenciaFinal();
      if(tipo.toLowerCase()==='otra'&&!incidencia){if(estado)estado.textContent='⚠️ Especifica cuál fue la incidencia reportada.';return;}
      const ventana=window.open('','_blank');
      if(!ventana){if(estado)estado.textContent='❌ El navegador bloqueó la ventana del PDF.';return;}
      const id=document.getElementById('incidenciaAlumno')?.value||'';
      const alumno=await obtenerAlumno(id);
      if(!alumno){ventana.close();if(estado)estado.textContent='❌ No fue posible obtener los datos del alumno.';return;}
      const cfg=await obtenerConfig();
      const datos={folio,fecha:document.getElementById('incidenciaFecha')?.value||'',id:String(alumno.id||''),nombre:nombreCompleto(alumno),grado:String(alumno.grado||''),grupo:String(alumno.grupo||''),incidencia,descripcion:document.getElementById('incidenciaDescripcion')?.value.trim()||'',accionesTomadas:document.getElementById('incidenciaAccionesTomadas')?.value.trim()||'',acuerdos:document.getElementById('incidenciaAcuerdos')?.value.trim()||''};
      ventana.document.open();ventana.document.write(construir(datos,cfg));ventana.document.close();
      if(estado)estado.textContent=`✅ PDF listo · Folio ${folio}`;
    });
    return true;
  }

  if(instalar())return;
  const obs=new MutationObserver(()=>{if(instalar())obs.disconnect();});
  obs.observe(document.documentElement,{childList:true,subtree:true});
})();
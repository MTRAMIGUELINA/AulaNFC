/* AulaNFC v3 - Configuración de escuela, docente y grupo. */
(() => {
  let cargando=false;
  let guardando=false;

  const ids={
    ESCUELA:'configEscuela',CCT:'configCct',ZONA:'configZona',SECTOR:'configSector',TURNO:'configTurno',LOCALIDAD:'configLocalidad',ESTADO:'configEstado',DOCENTE:'configDocente',GRADO:'configGrado',GRUPO:'configGrupo',CICLO_ESCOLAR:'configCicloEscolar'
  };

  function esperarBase(){
    const menu=document.getElementById('menuLateral');
    const nav=menu?.querySelector('.menu-lateral__navegacion');
    const contenedor=document.querySelector('.contenedor');
    if(!menu||!nav||!contenedor||typeof solicitarJSONP!=='function'){setTimeout(esperarBase,120);return;}
    if(document.getElementById('menuConfiguracion'))return;
    crearBoton(nav);crearVista(contenedor);conectarEventos();
  }

  function crearBoton(nav){
    const b=document.createElement('button');
    b.id='menuConfiguracion';b.type='button';b.className='menu-lateral__opcion';
    b.innerHTML='<span class="menu-lateral__icono" aria-hidden="true">⚙️</span><span>Configuración</span>';
    nav.appendChild(b);
  }

  function crearVista(contenedor){
    const v=document.createElement('section');
    v.id='vistaConfiguracion';v.className='config-aulanfc oculto';
    v.innerHTML=`
      <header class="config-aulanfc__cabecera">
        <div><h2>⚙️ Configuración</h2><p>Datos de la escuela, docente, grupo y ciclo escolar.</p></div>
        <button id="btnCerrarConfiguracion" class="config-aulanfc__cerrar" type="button">✕</button>
      </header>
      <section class="config-aulanfc__bloque">
        <h3>🏫 Datos de la escuela</h3>
        <div class="config-aulanfc__grid">
          <label class="ancho-completo"><span>Nombre de la escuela</span><input id="configEscuela" type="text"></label>
          <label><span>C.C.T.</span><input id="configCct" type="text"></label>
          <label><span>Zona escolar</span><input id="configZona" type="text"></label>
          <label><span>Sector</span><input id="configSector" type="text"></label>
          <label><span>Turno</span><input id="configTurno" type="text"></label>
          <label><span>Localidad / Municipio</span><input id="configLocalidad" type="text"></label>
          <label><span>Estado</span><input id="configEstado" type="text"></label>
        </div>
      </section>
      <section class="config-aulanfc__bloque">
        <h3>👩‍🏫 Datos del docente y grupo</h3>
        <div class="config-aulanfc__grid">
          <label class="ancho-completo"><span>Nombre del docente</span><input id="configDocente" type="text"></label>
          <label><span>Grado</span><input id="configGrado" type="text" inputmode="numeric"></label>
          <label><span>Grupo</span><input id="configGrupo" type="text"></label>
          <label class="ancho-completo"><span>Ciclo escolar</span><input id="configCicloEscolar" type="text" placeholder="2026-2027"></label>
        </div>
      </section>
      <div class="config-aulanfc__acciones"><button id="btnGuardarConfiguracion" type="button">💾 Guardar configuración</button></div>
      <p id="estadoConfiguracion" class="config-aulanfc__estado">Abre esta sección para cargar la configuración.</p>`;
    const escaner=document.getElementById('vistaEscaner');
    if(escaner)contenedor.insertBefore(v,escaner);else contenedor.appendChild(v);
  }

  function cerrarMenu(){
    document.getElementById('menuLateral')?.classList.remove('abierto');
    document.getElementById('fondoMenuLateral')?.classList.remove('visible');
    document.body.classList.remove('menu-abierto');
    document.getElementById('btnMenuLateral')?.setAttribute('aria-expanded','false');
    document.getElementById('menuLateral')?.setAttribute('aria-hidden','true');
  }

  function ocultarOtras(){
    ['vistaEscaner','vistaResumenEstadistico','vistaResultadosExamen','vistaAdministracionAlumnos'].forEach(id=>document.getElementById(id)?.classList.add('oculto'));
    const h=document.getElementById('pantallaHistorial'),d=document.getElementById('btnAbrirHistorial');
    if(h&&!h.classList.contains('oculto')&&d)d.click();
  }

  function mostrarVista(){
    ocultarOtras();cerrarMenu();
    document.getElementById('vistaConfiguracion')?.classList.remove('oculto');
    document.getElementById('menuLateral')?.querySelectorAll('.menu-lateral__opcion').forEach(b=>b.classList.toggle('activa',b.id==='menuConfiguracion'));
    cargarConfiguracion();
  }

  function ocultarVista(){document.getElementById('vistaConfiguracion')?.classList.add('oculto');}

  function ponerValores(c){
    Object.entries(ids).forEach(([clave,id])=>{const x=document.getElementById(id);if(x)x.value=String(c?.[clave]||'');});
  }

  function parametros(){
    return {
      escuela:document.getElementById('configEscuela').value.trim(),
      cct:document.getElementById('configCct').value.trim(),
      zona:document.getElementById('configZona').value.trim(),
      sector:document.getElementById('configSector').value.trim(),
      turno:document.getElementById('configTurno').value.trim(),
      localidad:document.getElementById('configLocalidad').value.trim(),
      estado:document.getElementById('configEstado').value.trim(),
      docente:document.getElementById('configDocente').value.trim(),
      grado:document.getElementById('configGrado').value.trim(),
      grupo:document.getElementById('configGrupo').value.trim(),
      cicloEscolar:document.getElementById('configCicloEscolar').value.trim()
    };
  }

  async function cargarConfiguracion(){
    if(cargando)return;cargando=true;
    const e=document.getElementById('estadoConfiguracion');e.textContent='⏳ Cargando configuración...';
    try{
      const r=await solicitarJSONP('obtenerconfiguracion');
      if(!r||(r.ok===false||r.exito===false))throw new Error(r?.mensaje||'No fue posible obtener la configuración.');
      ponerValores(r.configuracion||{});
      e.textContent='✅ Configuración cargada correctamente.';
    }catch(err){e.textContent=`❌ ${err?.message||'No fue posible cargar la configuración.'}`;}
    finally{cargando=false;}
  }

  async function guardarConfiguracion(){
    if(guardando)return;guardando=true;
    const b=document.getElementById('btnGuardarConfiguracion'),e=document.getElementById('estadoConfiguracion');
    b.disabled=true;e.textContent='⏳ Guardando configuración...';
    try{
      const r=await solicitarJSONP('guardarconfiguracion',parametros());
      if(!r||(r.ok===false||r.exito===false))throw new Error(r?.mensaje||'No fue posible guardar la configuración.');
      if(r.configuracion)ponerValores(r.configuracion);
      window.AULANFC_CONFIGURACION=r.configuracion||{};
      e.textContent=`✅ ${r.mensaje||'Configuración guardada correctamente.'}`;
    }catch(err){e.textContent=`❌ ${err?.message||'No fue posible guardar la configuración.'}`;}
    finally{guardando=false;b.disabled=false;}
  }

  function conectarEventos(){
    document.getElementById('menuConfiguracion').addEventListener('click',mostrarVista);
    document.getElementById('btnGuardarConfiguracion').addEventListener('click',guardarConfiguracion);
    document.getElementById('btnCerrarConfiguracion').addEventListener('click',()=>{ocultarVista();document.getElementById('vistaEscaner')?.classList.remove('oculto');});
    ['menuInicio','menuHistorial','menuResumenEstadistico','menuResultadosExamen','menuAdministracionAlumnos'].forEach(id=>document.getElementById(id)?.addEventListener('click',ocultarVista));
  }

  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',esperarBase):esperarBase();
})();
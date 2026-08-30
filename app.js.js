/* ============ Mi Finca Digital ============
   Todo se guarda en localStorage de este navegador.
   Estructura de datos:
   {
     cacao:   { ventas:[], manoObra:[], insumos:[] },
     leche:   { produccion:[], ventasEspeciales:[], alimento:[], partos:[] },
     pescado: { pozos:[ {id,nombre,creado,ultimoCierre,alevinos:[],purina:[],pescas:[],cosechas:[]} ] }
   }
============================================= */

const STORAGE_KEY = 'miFincaDigital';
const MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];

/* ---------- Datos ---------- */
function defaultData(){
  return {
    cacao:   { ventas:[], manoObra:[], insumos:[] },
    leche:   { produccion:[], ventasEspeciales:[], alimento:[], partos:[] },
    pescado: { pozos:[] }
  };
}
function loadData(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(!raw) return defaultData();
    const parsed = JSON.parse(raw);
    return { ...defaultData(), ...parsed };
  }catch(e){
    console.error('Error leyendo datos', e);
    return defaultData();
  }
}
function saveData(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}
let data = loadData();

/* ---------- Utilidades ---------- */
function uid(){ return Date.now().toString(36) + Math.random().toString(36).slice(2,7); }
function money(n){
  const v = Math.round(Number(n)||0);
  return (v<0?'-$':'$') + Math.abs(v).toLocaleString('es-CO');
}
function fmtDate(str){
  if(!str) return '';
  const [y,m,d] = str.split('-');
  return `${d}/${m}/${y}`;
}
function toast(msg){
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(()=>t.classList.remove('show'), 2200);
}
function quincenaInfo(fechaStr){
  const d = new Date(fechaStr+'T00:00:00');
  const anio = d.getFullYear();
  const mesIdx = d.getMonth();
  const dia = d.getDate();
  const ultimoDia = new Date(anio, mesIdx+1, 0).getDate();
  const q = dia<=15 ? 1 : 2;
  const rango = q===1 ? '1-15' : `16-${ultimoDia}`;
  return {
    anio, mes:mesIdx+1, mesNombre:MESES[mesIdx], quincena:q,
    key:`${anio}-${String(mesIdx+1).padStart(2,'0')}-Q${q}`,
    label:`${MESES[mesIdx]} ${rango}`
  };
}
function groupByYearMonth(items, dateField){
  const out = {};
  items.forEach(it=>{
    const d = new Date(it[dateField]+'T00:00:00');
    const anio = d.getFullYear(), mes = d.getMonth();
    out[anio] = out[anio] || {};
    out[anio][mes] = out[anio][mes] || [];
    out[anio][mes].push(it);
  });
  return out;
}
function sortedKeysDesc(obj){ return Object.keys(obj).sort((a,b)=>b-a); }
function emptyRow(cols, texto='Sin registros todavía'){
  return `<tr class="empty-row"><td colspan="${cols}">${texto}</td></tr>`;
}
function confirmarBorrado(msg){ return confirm(msg); }

/* ---------- Navegación por pestañas ---------- */
document.querySelectorAll('.tab').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('.tab').forEach(b=>b.classList.remove('active'));
    document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab).classList.add('active');
  });
});

/* ==================================================
   CACAO
================================================== */
document.getElementById('formCacaoVenta').addEventListener('submit', e=>{
  e.preventDefault();
  const kilos = parseFloat(document.getElementById('cvKilos').value);
  const precio = parseFloat(document.getElementById('cvPrecio').value);
  data.cacao.ventas.push({
    id:uid(), fecha:document.getElementById('cvFecha').value,
    kilos, precio, total:kilos*precio
  });
  saveData(); e.target.reset(); renderAll(); toast('Venta de cacao guardada');
});
document.getElementById('formCacaoManoObra').addEventListener('submit', e=>{
  e.preventDefault();
  data.cacao.manoObra.push({
    id:uid(), fecha:document.getElementById('cmFecha').value,
    descripcion:document.getElementById('cmDesc').value,
    valor:parseFloat(document.getElementById('cmValor').value)
  });
  saveData(); e.target.reset(); renderAll(); toast('Pago de mano de obra guardado');
});
document.getElementById('formCacaoInsumo').addEventListener('submit', e=>{
  e.preventDefault();
  data.cacao.insumos.push({
    id:uid(), fecha:document.getElementById('ciFecha').value,
    tipo:document.getElementById('ciTipo').value,
    costo:parseFloat(document.getElementById('ciCosto').value)
  });
  saveData(); e.target.reset(); renderAll(); toast('Insumo guardado');
});

function cacaoTotales(){
  const kilos = data.cacao.ventas.reduce((s,v)=>s+v.kilos,0);
  const ingresos = data.cacao.ventas.reduce((s,v)=>s+v.total,0);
  const manoObra = data.cacao.manoObra.reduce((s,v)=>s+v.valor,0);
  const insumos = data.cacao.insumos.reduce((s,v)=>s+v.costo,0);
  const ganancia = ingresos - manoObra - insumos;
  return {kilos, ingresos, manoObra, insumos, ganancia};
}
function renderCacao(){
  const t = cacaoTotales();
  document.getElementById('cacaoTotales').innerHTML = `
    <div class="total-card" style="--accent:var(--cacao)"><div class="label">Kilos vendidos</div><div class="value">${t.kilos.toLocaleString('es-CO')} kg</div></div>
    <div class="total-card" style="--accent:var(--gold)"><div class="label">Ingresos</div><div class="value">${money(t.ingresos)}</div></div>
    <div class="total-card" style="--accent:var(--ink-soft)"><div class="label">Mano de obra</div><div class="value">${money(t.manoObra)}</div></div>
    <div class="total-card" style="--accent:var(--danger)"><div class="label">Insumos</div><div class="value">${money(t.insumos)}</div></div>
    <div class="total-card" style="--accent:${t.ganancia>=0?'var(--rule-strong)':'var(--danger)'}"><div class="label">Ganancia neta</div><div class="value ${t.ganancia>=0?'pos':'neg'}">${money(t.ganancia)}</div></div>
  `;

  const grupos = groupByYearMonth(data.cacao.ventas, 'fecha');
  const anios = sortedKeysDesc(grupos);
  let html = anios.length ? '' : '<p class="hint">Aún no hay ventas registradas.</p>';
  anios.forEach(anio=>{
    const totalAnio = Object.values(grupos[anio]).flat().reduce((s,v)=>s+v.total,0);
    html += `<div class="grupo-anio"><div class="grupo-anio-head">${anio}<span class="anio-total">${money(totalAnio)}</span></div>`;
    Object.keys(grupos[anio]).sort((a,b)=>b-a).forEach(mes=>{
      const ventasMes = grupos[anio][mes].sort((a,b)=>b.fecha.localeCompare(a.fecha));
      const totalMes = ventasMes.reduce((s,v)=>s+v.total,0);
      html += `<div class="grupo-mes"><div class="grupo-mes-head">${MESES[mes]} — ${money(totalMes)}</div>
        <table class="ledger-table"><thead><tr><th>Fecha</th><th class="num">Kilos</th><th class="num">Precio/kg</th><th class="num">Total</th><th></th></tr></thead><tbody>`;
      ventasMes.forEach(v=>{
        html += `<tr><td>${fmtDate(v.fecha)}</td><td class="num">${v.kilos}</td><td class="num">${money(v.precio)}</td><td class="num">${money(v.total)}</td>
          <td><button class="row-del" data-del="cacaoVenta" data-id="${v.id}">borrar</button></td></tr>`;
      });
      html += `</tbody></table></div>`;
    });
    html += `</div>`;
  });
  document.getElementById('cacaoHistorial').innerHTML = html;

  document.getElementById('cacaoManoObraTabla').innerHTML =
    data.cacao.manoObra.length
    ? [...data.cacao.manoObra].sort((a,b)=>b.fecha.localeCompare(a.fecha)).map(m=>`
      <tr><td>${fmtDate(m.fecha)}</td><td>${m.descripcion}</td><td class="num">${money(m.valor)}</td>
      <td><button class="row-del" data-del="cacaoManoObra" data-id="${m.id}">borrar</button></td></tr>`).join('')
    : emptyRow(4);

  document.getElementById('cacaoInsumosTabla').innerHTML =
    data.cacao.insumos.length
    ? [...data.cacao.insumos].sort((a,b)=>b.fecha.localeCompare(a.fecha)).map(i=>`
      <tr><td>${fmtDate(i.fecha)}</td><td>${i.tipo}</td><td class="num">${money(i.costo)}</td>
      <td><button class="row-del" data-del="cacaoInsumo" data-id="${i.id}">borrar</button></td></tr>`).join('')
    : emptyRow(4);
}

/* ==================================================
   GANADO / LECHE
================================================== */
document.getElementById('formLeche').addEventListener('submit', e=>{
  e.preventDefault();
  data.leche.produccion.push({ id:uid(), fecha:document.getElementById('lFecha').value, litros:parseFloat(document.getElementById('lLitros').value) });
  saveData(); e.target.reset(); renderAll(); toast('Producción guardada');
});
document.getElementById('formLecheVentaEspecial').addEventListener('submit', e=>{
  e.preventDefault();
  const litros = parseFloat(document.getElementById('veLitros').value);
  const precio = parseFloat(document.getElementById('vePrecio').value);
  data.leche.ventasEspeciales.push({ id:uid(), fecha:document.getElementById('veFecha').value, comprador:document.getElementById('veComprador').value, litros, precio, total:litros*precio });
  saveData(); e.target.reset(); renderAll(); toast('Venta especial guardada');
});
document.getElementById('formAlimento').addEventListener('submit', e=>{
  e.preventDefault();
  data.leche.alimento.push({ id:uid(), fecha:document.getElementById('aFecha').value, producto:document.getElementById('aProducto').value, costo:parseFloat(document.getElementById('aCosto').value) });
  saveData(); e.target.reset(); renderAll(); toast('Gasto de alimento guardado');
});
document.getElementById('formParto').addEventListener('submit', e=>{
  e.preventDefault();
  data.leche.partos.push({ id:uid(), fecha:document.getElementById('pFecha').value, vaca:document.getElementById('pVaca').value, cria:document.getElementById('pCria').value });
  saveData(); e.target.reset(); renderAll(); toast('Parto guardado');
});

function lecheTotales(){
  const litros = data.leche.produccion.reduce((s,v)=>s+v.litros,0);
  const ingresosEspeciales = data.leche.ventasEspeciales.reduce((s,v)=>s+v.total,0);
  const gastoAlimento = data.leche.alimento.reduce((s,v)=>s+v.costo,0);
  const ganancia = ingresosEspeciales - gastoAlimento;
  return {litros, ingresosEspeciales, gastoAlimento, ganancia};
}
function renderLeche(){
  const t = lecheTotales();
  document.getElementById('lecheTotales').innerHTML = `
    <div class="total-card" style="--accent:var(--leche)"><div class="label">Litros producidos</div><div class="value">${t.litros.toLocaleString('es-CO')} L</div></div>
    <div class="total-card" style="--accent:var(--gold)"><div class="label">Ventas especiales</div><div class="value">${money(t.ingresosEspeciales)}</div></div>
    <div class="total-card" style="--accent:var(--danger)"><div class="label">Gasto en alimento</div><div class="value">${money(t.gastoAlimento)}</div></div>
    <div class="total-card" style="--accent:${t.ganancia>=0?'var(--rule-strong)':'var(--danger)'}"><div class="label">Ganancia (ventas especiales)</div><div class="value ${t.ganancia>=0?'pos':'neg'}">${money(t.ganancia)}</div></div>
  `;

  const grupos = {};
  data.leche.produccion.forEach(p=>{
    const q = quincenaInfo(p.fecha);
    grupos[q.anio] = grupos[q.anio] || {};
    grupos[q.anio][q.key] = grupos[q.anio][q.key] || {label:q.label, items:[]};
    grupos[q.anio][q.key].items.push(p);
  });
  const anios = sortedKeysDesc(grupos);
  let html = anios.length ? '' : '<p class="hint">Aún no hay producción registrada.</p>';
  anios.forEach(anio=>{
    const totalAnio = Object.values(grupos[anio]).flatMap(g=>g.items).reduce((s,p)=>s+p.litros,0);
    html += `<div class="grupo-anio"><div class="grupo-anio-head">${anio}<span class="anio-total">${totalAnio.toLocaleString('es-CO')} L</span></div>`;
    Object.keys(grupos[anio]).sort((a,b)=>b.localeCompare(a)).forEach(key=>{
      const g = grupos[anio][key];
      const totalQ = g.items.reduce((s,p)=>s+p.litros,0);
      const items = [...g.items].sort((a,b)=>b.fecha.localeCompare(a.fecha));
      html += `<div class="grupo-mes"><div class="grupo-mes-head">${g.label} — ${totalQ.toLocaleString('es-CO')} L</div>
        <table class="ledger-table"><thead><tr><th>Fecha</th><th class="num">Litros</th><th></th></tr></thead><tbody>`;
      items.forEach(p=>{
        html += `<tr><td>${fmtDate(p.fecha)}</td><td class="num">${p.litros}</td>
          <td><button class="row-del" data-del="lecheProduccion" data-id="${p.id}">borrar</button></td></tr>`;
      });
      html += `</tbody></table></div>`;
    });
    html += `</div>`;
  });
  document.getElementById('lecheHistorial').innerHTML = html;

  document.getElementById('alimentoTabla').innerHTML =
    data.leche.alimento.length
    ? [...data.leche.alimento].sort((a,b)=>b.fecha.localeCompare(a.fecha)).map(a=>`
      <tr><td>${fmtDate(a.fecha)}</td><td>${a.producto}</td><td class="num">${money(a.costo)}</td>
      <td><button class="row-del" data-del="lecheAlimento" data-id="${a.id}">borrar</button></td></tr>`).join('')
    : emptyRow(4);

  document.getElementById('partosTabla').innerHTML =
    data.leche.partos.length
    ? [...data.leche.partos].sort((a,b)=>b.fecha.localeCompare(a.fecha)).map(p=>`
      <tr><td>${fmtDate(p.fecha)}</td><td>${p.vaca}</td><td>${p.cria}</td>
      <td><button class="row-del" data-del="lecheParto" data-id="${p.id}">borrar</button></td></tr>`).join('')
    : emptyRow(4);
}

/* ==================================================
   PESCADO
================================================== */
document.getElementById('formPozo').addEventListener('submit', e=>{
  e.preventDefault();
  const nombre = document.getElementById('pzNombre').value.trim();
  if(!nombre) return;
  data.pescado.pozos.push({ id:uid(), nombre, creado:new Date().toISOString().slice(0,10), ultimoCierre:null, alevinos:[], purina:[], pescas:[], cosechas:[] });
  saveData(); e.target.reset(); renderAll(); toast('Pozo agregado');
});

function pozoTotales(pozo){
  const especies = ['cachama','mojarra','coporo'];
  const totales = {};
  especies.forEach(esp=>{
    totales[esp] = {
      kilos: pozo.pescas.reduce((s,p)=>s+(p[esp+'Kilos']||0),0),
      valor: pozo.pescas.reduce((s,p)=>s+(p[esp+'Kilos']||0)*(p[esp+'Precio']||0),0)
    };
  });
  const manoObra = pozo.pescas.reduce((s,p)=>s+(p.personas||0)*(p.pagoPersona||0),0);
  const costoAlevinos = pozo.alevinos.reduce((s,a)=>s+a.costo,0);
  const costoPurina = pozo.purina.reduce((s,p)=>s+p.costoTotal,0);
  const ingresos = especies.reduce((s,e)=>s+totales[e].valor,0);
  const gastos = manoObra+costoAlevinos+costoPurina;
  return {totales, manoObra, costoAlevinos, costoPurina, ingresos, gastos, ganancia:ingresos-gastos};
}

function renderPozosLista(){
  document.getElementById('pozosLista').innerHTML = data.pescado.pozos.map(p=>
    `<span class="pozo-chip">${p.nombre}<button data-del="pozo" data-id="${p.id}" title="Eliminar pozo">✕</button></span>`
  ).join('') || '<p class="hint">Todavía no has agregado pozos.</p>';
}

function renderPozoCard(pozo){
  const t = pozoTotales(pozo);
  const especies = [
    {key:'cachama', nombre:'Cachama'},
    {key:'mojarra', nombre:'Mojarra'},
    {key:'coporo', nombre:'Coporo'}
  ];
  const especiesHtml = especies.map(e=>`
    <div class="especie-box">
      <div class="esp-nombre">${e.nombre}</div>
      <div class="esp-kilos">${t.totales[e.key].kilos.toLocaleString('es-CO')} kg</div>
      <div class="esp-valor">${money(t.totales[e.key].valor)}</div>
    </div>`).join('');

  const pescasRows = pozo.pescas.length
    ? [...pozo.pescas].sort((a,b)=>b.fecha.localeCompare(a.fecha)).map(p=>`
      <tr>
        <td>${fmtDate(p.fecha)}</td>
        <td class="num">${p.cachamaKilos||0} / ${money(p.cachamaPrecio||0)}</td>
        <td class="num">${p.mojarraKilos||0} / ${money(p.mojarraPrecio||0)}</td>
        <td class="num">${p.coporoKilos||0} / ${money(p.coporoPrecio||0)}</td>
        <td class="num">${money((p.personas||0)*(p.pagoPersona||0))}</td>
        <td><button class="row-del" data-del="pesca" data-pozo="${pozo.id}" data-id="${p.id}">borrar</button></td>
      </tr>`).join('')
    : emptyRow(6);

  const alevinosRows = pozo.alevinos.length
    ? [...pozo.alevinos].sort((a,b)=>b.fecha.localeCompare(a.fecha)).map(a=>`
      <tr><td>${fmtDate(a.fecha)}</td><td class="num">${a.cantidad}</td><td class="num">${money(a.costo)}</td>
      <td><button class="row-del" data-del="alevino" data-pozo="${pozo.id}" data-id="${a.id}">borrar</button></td></tr>`).join('')
    : emptyRow(4);

  const purinaRows = pozo.purina.length
    ? [...pozo.purina].sort((a,b)=>b.fecha.localeCompare(a.fecha)).map(p=>`
      <tr><td>${fmtDate(p.fecha)}</td><td class="num">${p.bultos}</td><td class="num">${money(p.precioBulto)}</td><td class="num">${money(p.costoTotal)}</td>
      <td><button class="row-del" data-del="purina" data-pozo="${pozo.id}" data-id="${p.id}">borrar</button></td></tr>`).join('')
    : emptyRow(5);

  const cosechasRows = pozo.cosechas.length
    ? [...pozo.cosechas].sort((a,b)=>b.fechaCierre.localeCompare(a.fechaCierre)).map(c=>`
      <tr><td>${fmtDate(c.desde)} → ${fmtDate(c.fechaCierre)}</td>
      <td class="num">${c.cachamaKilos} kg</td><td class="num">${c.mojarraKilos} kg</td><td class="num">${c.coporoKilos} kg</td>
      <td class="num">${money(c.valorTotal)}</td></tr>`).join('')
    : emptyRow(5, 'Aún no has cerrado ninguna cosecha');

  return `
  <div class="ledger-card pozo-card" data-pozo-card="${pozo.id}">
    <div class="pozo-card-head">
      <h3>${pozo.nombre}</h3>
      <span class="hint" style="margin:0;">Ganancia del pozo: <strong>${money(t.ganancia)}</strong></span>
    </div>
    <div class="especies-grid">${especiesHtml}</div>

    <div class="ledger-two-col">
      <div>
        <h3 style="font-size:.95rem;">Registrar pesca</h3>
        <form class="ledger-form form-pesca" data-pozo="${pozo.id}">
          <label>Fecha <input type="date" name="fecha" required></label>
          <label>Cachama — kilos <input type="number" step="0.01" min="0" name="cachamaKilos"></label>
          <label>Cachama — precio/kg ($) <input type="number" step="1" min="0" name="cachamaPrecio"></label>
          <label>Mojarra — kilos <input type="number" step="0.01" min="0" name="mojarraKilos"></label>
          <label>Mojarra — precio/kg ($) <input type="number" step="1" min="0" name="mojarraPrecio"></label>
          <label>Coporo — kilos <input type="number" step="0.01" min="0" name="coporoKilos"></label>
          <label>Coporo — precio/kg ($) <input type="number" step="1" min="0" name="coporoPrecio"></label>
          <label>Personas ayudando <input type="number" step="1" min="0" name="personas" value="0"></label>
          <label>Pago por persona ($) <input type="number" step="1" min="0" name="pagoPersona" value="0"></label>
          <button type="submit" class="btn btn-pescado">Guardar pesca</button>
        </form>
      </div>
      <div>
        <h3 style="font-size:.95rem;">Cosechas</h3>
        <p class="hint">Cierra una cosecha para sumar todas las pescas desde el último cierre.</p>
        <button class="btn btn-pescado-outline" data-cerrar-cosecha="${pozo.id}">Cerrar cosecha</button>
        <table class="ledger-table" style="margin-top:14px;"><thead><tr><th>Periodo</th><th class="num">Cachama</th><th class="num">Mojarra</th><th class="num">Coporo</th><th class="num">Valor</th></tr></thead>
        <tbody>${cosechasRows}</tbody></table>
      </div>
    </div>

    <h3 style="font-size:.95rem;">Historial de pescas</h3>
    <table class="ledger-table"><thead><tr><th>Fecha</th><th class="num">Cachama kg/$</th><th class="num">Mojarra kg/$</th><th class="num">Coporo kg/$</th><th class="num">Mano de obra</th><th></th></tr></thead>
    <tbody>${pescasRows}</tbody></table>

    <div class="ledger-two-col" style="margin-top:16px;">
      <div>
        <h3 style="font-size:.95rem;">Alevinos comprados</h3>
        <form class="ledger-form form-alevino" data-pozo="${pozo.id}">
          <label>Fecha <input type="date" name="fecha" required></label>
          <label>Cantidad <input type="number" step="1" min="0" name="cantidad" required></label>
          <label>Costo ($) <input type="number" step="1" min="0" name="costo" required></label>
          <button type="submit" class="btn btn-pescado-outline">Guardar</button>
        </form>
        <table class="ledger-table" style="margin-top:10px;"><thead><tr><th>Fecha</th><th class="num">Cantidad</th><th class="num">Costo</th><th></th></tr></thead><tbody>${alevinosRows}</tbody></table>
      </div>
      <div>
        <h3 style="font-size:.95rem;">Purina comprada</h3>
        <form class="ledger-form form-purina" data-pozo="${pozo.id}">
          <label>Fecha <input type="date" name="fecha" required></label>
          <label>Bultos <input type="number" step="1" min="0" name="bultos" required></label>
          <label>Precio por bulto ($) <input type="number" step="1" min="0" name="precioBulto" required></label>
          <button type="submit" class="btn btn-pescado-outline">Guardar</button>
        </form>
        <table class="ledger-table" style="margin-top:10px;"><thead><tr><th>Fecha</th><th class="num">Bultos</th><th class="num">Precio/bulto</th><th class="num">Total</th><th></th></tr></thead><tbody>${purinaRows}</tbody></table>
      </div>
    </div>
  </div>`;
}

function renderPescado(){
  renderPozosLista();
  document.getElementById('pozosContenedor').innerHTML = data.pescado.pozos.map(renderPozoCard).join('');

  let kilos=0, ingresos=0, manoObra=0, insumos=0;
  data.pescado.pozos.forEach(p=>{
    const t = pozoTotales(p);
    kilos += Object.values(t.totales).reduce((s,e)=>s+e.kilos,0);
    ingresos += t.ingresos; manoObra += t.manoObra; insumos += t.costoAlevinos+t.costoPurina;
  });
  const ganancia = ingresos-manoObra-insumos;
  document.getElementById('pescadoTotales').innerHTML = `
    <div class="total-card" style="--accent:var(--pescado)"><div class="label">Kilos vendidos (total)</div><div class="value">${kilos.toLocaleString('es-CO')} kg</div></div>
    <div class="total-card" style="--accent:var(--gold)"><div class="label">Ingresos</div><div class="value">${money(ingresos)}</div></div>
    <div class="total-card" style="--accent:var(--ink-soft)"><div class="label">Mano de obra</div><div class="value">${money(manoObra)}</div></div>
    <div class="total-card" style="--accent:var(--danger)"><div class="label">Insumos (alevinos + purina)</div><div class="value">${money(insumos)}</div></div>
    <div class="total-card" style="--accent:${ganancia>=0?'var(--rule-strong)':'var(--danger)'}"><div class="label">Ganancia neta</div><div class="value ${ganancia>=0?'pos':'neg'}">${money(ganancia)}</div></div>
  `;

  // formularios dinámicos de cada pozo
  document.querySelectorAll('.form-pesca').forEach(f=>f.addEventListener('submit', e=>{
    e.preventDefault();
    const pozo = data.pescado.pozos.find(p=>p.id===f.dataset.pozo);
    const fd = new FormData(f);
    pozo.pescas.push({
      id:uid(), fecha:fd.get('fecha'),
      cachamaKilos:parseFloat(fd.get('cachamaKilos'))||0, cachamaPrecio:parseFloat(fd.get('cachamaPrecio'))||0,
      mojarraKilos:parseFloat(fd.get('mojarraKilos'))||0, mojarraPrecio:parseFloat(fd.get('mojarraPrecio'))||0,
      coporoKilos:parseFloat(fd.get('coporoKilos'))||0, coporoPrecio:parseFloat(fd.get('coporoPrecio'))||0,
      personas:parseFloat(fd.get('personas'))||0, pagoPersona:parseFloat(fd.get('pagoPersona'))||0
    });
    saveData(); renderAll(); toast('Pesca guardada');
  }));
  document.querySelectorAll('.form-alevino').forEach(f=>f.addEventListener('submit', e=>{
    e.preventDefault();
    const pozo = data.pescado.pozos.find(p=>p.id===f.dataset.pozo);
    const fd = new FormData(f);
    pozo.alevinos.push({ id:uid(), fecha:fd.get('fecha'), cantidad:parseFloat(fd.get('cantidad')), costo:parseFloat(fd.get('costo')) });
    saveData(); renderAll(); toast('Compra de alevinos guardada');
  }));
  document.querySelectorAll('.form-purina').forEach(f=>f.addEventListener('submit', e=>{
    e.preventDefault();
    const pozo = data.pescado.pozos.find(p=>p.id===f.dataset.pozo);
    const fd = new FormData(f);
    const bultos = parseFloat(fd.get('bultos')), precioBulto = parseFloat(fd.get('precioBulto'));
    pozo.purina.push({ id:uid(), fecha:fd.get('fecha'), bultos, precioBulto, costoTotal:bultos*precioBulto });
    saveData(); renderAll(); toast('Compra de purina guardada');
  }));
  document.querySelectorAll('[data-cerrar-cosecha]').forEach(btn=>btn.addEventListener('click', ()=>{
    const pozo = data.pescado.pozos.find(p=>p.id===btn.dataset.cerrarCosecha);
    const desde = pozo.ultimoCierre || pozo.creado;
    const hoy = new Date().toISOString().slice(0,10);
    const pescasPeriodo = pozo.pescas.filter(p=>p.fecha>=desde && p.fecha<=hoy);
    if(!pescasPeriodo.length){ toast('No hay pescas nuevas para cerrar cosecha'); return; }
    const sum = (campo)=>pescasPeriodo.reduce((s,p)=>s+(p[campo]||0),0);
    const cachamaKilos=sum('cachamaKilos'), mojarraKilos=sum('mojarraKilos'), coporoKilos=sum('coporoKilos');
    const valorTotal = pescasPeriodo.reduce((s,p)=>s+(p.cachamaKilos||0)*(p.cachamaPrecio||0)+(p.mojarraKilos||0)*(p.mojarraPrecio||0)+(p.coporoKilos||0)*(p.coporoPrecio||0),0);
    pozo.cosechas.push({ id:uid(), desde, fechaCierre:hoy, cachamaKilos, mojarraKilos, coporoKilos, valorTotal });
    pozo.ultimoCierre = hoy;
    saveData(); renderAll(); toast('Cosecha cerrada');
  }));
}

/* ==================================================
   BORRAR (delegación de eventos)
================================================== */
document.addEventListener('click', e=>{
  const btn = e.target.closest('[data-del]');
  if(!btn) return;
  const tipo = btn.dataset.del, id = btn.dataset.id;
  if(!confirmarBorrado('¿Borrar este registro? No se puede deshacer.')) return;

  const removeById = (arr)=>{ const i=arr.findIndex(x=>x.id===id); if(i>-1) arr.splice(i,1); };
  if(tipo==='cacaoVenta') removeById(data.cacao.ventas);
  else if(tipo==='cacaoManoObra') removeById(data.cacao.manoObra);
  else if(tipo==='cacaoInsumo') removeById(data.cacao.insumos);
  else if(tipo==='lecheProduccion') removeById(data.leche.produccion);
  else if(tipo==='lecheAlimento') removeById(data.leche.alimento);
  else if(tipo==='lecheParto') removeById(data.leche.partos);
  else if(tipo==='pozo'){ removeById(data.pescado.pozos); }
  else if(['pesca','alevino','purina'].includes(tipo)){
    const pozo = data.pescado.pozos.find(p=>p.id===btn.dataset.pozo);
    if(pozo){
      if(tipo==='pesca') removeById(pozo.pescas);
      if(tipo==='alevino') removeById(pozo.alevinos);
      if(tipo==='purina') removeById(pozo.purina);
    }
  }
  saveData(); renderAll(); toast('Registro borrado');
});

/* ==================================================
   RESUMEN GENERAL
================================================== */
function renderResumen(){
  const c = cacaoTotales();
  const l = lecheTotales();
  let pIngresos=0, pManoObra=0, pInsumos=0;
  data.pescado.pozos.forEach(p=>{
    const t = pozoTotales(p);
    pIngresos += t.ingresos; pManoObra += t.manoObra; pInsumos += t.costoAlevinos+t.costoPurina;
  });
  const pGanancia = pIngresos-pManoObra-pInsumos;

  const ingresosTotales = c.ingresos + l.ingresosEspeciales + pIngresos;
  const gastosTotales = c.manoObra+c.insumos + l.gastoAlimento + pManoObra+pInsumos;
  const gananciaTotal = ingresosTotales - gastosTotales;

  document.getElementById('resumenTotales').innerHTML = `
    <div class="total-card" style="--accent:var(--gold)"><div class="label">Ingresos totales</div><div class="value">${money(ingresosTotales)}</div></div>
    <div class="total-card" style="--accent:var(--danger)"><div class="label">Gastos totales</div><div class="value">${money(gastosTotales)}</div></div>
    <div class="total-card" style="--accent:${gananciaTotal>=0?'var(--rule-strong)':'var(--danger)'}"><div class="label">Ganancia neta</div><div class="value ${gananciaTotal>=0?'pos':'neg'}">${money(gananciaTotal)}</div></div>
    <div class="total-card" style="--accent:var(--leche)"><div class="label">Litros de leche producidos</div><div class="value">${l.litros.toLocaleString('es-CO')} L</div></div>
  `;

  const frentes = [
    {nombre:'Cacao', valor:c.ganancia, color:'var(--cacao)'},
    {nombre:'Ganado y leche', valor:l.ganancia, color:'var(--leche)'},
    {nombre:'Pescado', valor:pGanancia, color:'var(--pescado)'}
  ];
  const max = Math.max(1, ...frentes.map(f=>Math.abs(f.valor)));
  document.getElementById('resumenPorFrente').innerHTML = frentes.map(f=>`
    <div class="bar-row">
      <span class="bar-label">${f.nombre}</span>
      <div class="bar-track"><div class="bar-fill" style="width:${Math.min(100,Math.abs(f.valor)/max*100)}%;background:${f.color}"></div></div>
      <span class="bar-value ${f.valor>=0?'pos':'neg'}">${money(f.valor)}</span>
    </div>`).join('');

  // movimientos recientes coch(v=>mov.push({fecha:v.fecha, frente:'Cacao', tipo:'Venta', valor:v.total}));
  data.cacao.manoObra.forEach(v=>mov.push({fecha:v.fecha, frente:'Cacao', tipo:'Mano de obra', valor:-v.valor}));
  data.cacao.insumbinados
  const mov = [];
  data.cacao.ventas.forEamos.forEach(v=>mov.push({fecha:v.fecha, frente:'Cacao', tipo:'Insumo', valor:-v.costo}));
  data.leche.ventasEspeciales.forEach(v=>mov.push({fecha:v.fecha, frente:'Leche', tipo:'Venta especial', valor:v.total}));
  data.leche.alimento.forEach(v=>mov.push({fecha:v.fecha, frente:'Leche', tipo:'Alimento', valor:-v.costo}));
  data.pescado.pozos.forEach(p=>{
    p.pescas.forEach(pe=>{
      const valor=(pe.cachamaKilos||0)*(pe.cachamaPrecio||0)+(pe.mojarraKilos||0)*(pe.mojarraPrecio||0)+(pe.coporoKilos||0)*(pe.coporoPrecio||0);
      if(valor) mov.push({fecha:pe.fecha, frente:p.nombre, tipo:'Pesca', valor});
      const mo=(pe.personas||0)*(pe.pagoPersona||0);
      if(mo) mov.push({fecha:pe.fecha, frente:p.nombre, tipo:'Mano de obra', valor:-mo});
    });
    p.purina.forEach(pu=>mov.push({fecha:pu.fecha, frente:p.nombre, tipo:'Purina', valor:-pu.costoTotal}));
    p.alevinos.forEach(a=>mov.push({fecha:a.fecha, frente:p.nombre, tipo:'Alevinos', valor:-a.costo}));
  });
  mov.sort((a,b)=>b.fecha.localeCompare(a.fecha));
  document.getElementById('resumenRecientes').innerHTML = mov.length
    ? mov.slice(0,10).map(m=>`<tr><td>${fmtDate(m.fecha)}</td><td>${m.frente}</td><td>${m.tipo}</td><td class="num ${m.valor>=0?'pos':'neg'}">${money(m.valor)}</td></tr>`).join('')
    : emptyRow(4,'Aún no hay movimientos registrados');
}

/* ==================================================
   DATOS: exportar / importar / borrar todo
================================================== */
document.getElementById('btnExportar').addEventListener('click', ()=>{
  const blob = new Blob([JSON.stringify(data,null,2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const hoy = new Date().toISOString().slice(0,10);
  a.href = url; a.download = `mi-finca-digital-respaldo-${hoy}.json`;
  a.click();
  URL.revokeObjectURL(url);
  toast('Respaldo descargado');
});
document.getElementById('inputImportar').addEventListener('change', e=>{
  const file = e.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = ()=>{
    try{
      const parsed = JSON.parse(reader.result);
      if(!confirmarBorrado('Esto reemplaza todos los datos actuales por los del archivo. ¿Continuar?')) return;
      data = { ...defaultData(), ...parsed };
      saveData(); renderAll(); toast('Datos restaurados');
    }catch(err){ alert('El archivo no es un respaldo válido.'); }
  };
  reader.readAsText(file);
  e.target.value = '';
});
document.getElementById('btnBorrarTodo').addEventListener('click', ()=>{
  if(!confirmarBorrado('Esto borra TODOS los datos de la finca en este navegador. ¿Seguro?')) return;
  if(!confirmarBorrado('Última confirmación: no hay forma de deshacer esto. ¿Borrar todo?')) return;
  data = defaultData();
  saveData(); renderAll(); toast('Todos los datos fueron borrados');
});

/* ---------- Render general ---------- */
function renderAll(){
  renderCacao();
  renderLeche();
  renderPescado();
  renderResumen();
}
renderAll();

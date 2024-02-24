// Al cargar la página, recupera los datos de LocalStorage
window.onload = () => {
  const diario = localStorage.getItem("diario");
  const renovacion = localStorage.getItem("renovacion");

  const diarioElem = document.querySelector("#diario");
  const renovacionElem = document.querySelector("#renovacion");

  diarioElem.value = diario;
  renovacionElem.value = renovacion;
  renovacionElem.min = new Date().toISOString().split("T")[0];

  recargarTabla();
}

function diasHasta(fecha) {
  return Math.ceil((new Date(fecha) - new Date()) / (1000 * 60 * 60 * 24));
}

function exito(elem) {
  elem.classList.remove("error");
  elem.classList.add("exito");
  setTimeout(() => {
    elem.classList.remove("exito");
  }, 300);
}

function error(elem) {
  elem.classList.remove("exito");
  elem.classList.add("error");
  setTimeout(() => {
    elem.classList.remove("error");
  }, 300);
}

/**
 * Recalcula el campo Mensual de TODOS los items
 */
function actualizarConfig() {
  const diario = document.querySelector("#diario");
  const renovacion = document.querySelector("#renovacion");
  const boton = document.querySelector("#aplicar");

  if (!diario.reportValidity()) {
    error(boton);
    return;
  }

  localStorage.setItem("diario", diario.value);
  localStorage.setItem("renovacion", renovacion.value);

  // Poner botón en verde claro

  // Recalcula el campo mensual de todos los items
  const items = JSON.parse(localStorage.getItem("items") || "[]");
  items.forEach((item) => {
    if (item.hastaRenovacion) {
      if (!renovacion.value) {
        error(boton);
        alert("Hay items que requieren una fecha de renovación");
        return;
      }
      item.dias = diasHasta(renovacion.value);
    }
    item.mensual = precioPorMes(item.precio, item.mbs, item.dias, diario.value);
  })
  localStorage.setItem("items", JSON.stringify(items));
  exito(boton);
  recargarTabla();
}

/**
 * Guarda los datos de un item en LocalStorage
 */
function guardarPack() {
  const boton = document.querySelector("#guardar");
  const id = document.querySelector("#id").value || nuevoId();
  const nombre = document.querySelector("#nombre").value || `Opción ${id}`;
  const mbsElem = document.querySelector("#mbs");
  const precioElem = document.querySelector("#precio");
  const diasElem = document.querySelector("#dias");
  let hastaRenovacion = false;

  if (!mbsElem.reportValidity() || !precioElem.reportValidity() || !diasElem.reportValidity()) {
    error(boton);
    return;
  }

  if (diasElem.value == 0) {
    // Hasta fin del periodo del plan
    const renovacion = localStorage.getItem("renovacion");
    if (!renovacion) {
      error(boton);
      alert("Se indicó 0 días pero no una fecha de renovación.");
      return;
    }
    // Dias (enteros) hasta renovación
    diasElem.value = diasHasta(renovacion);
    hastaRenovacion = true;
  }
  const diario = localStorage.getItem("diario");
  if (!diario) {
    error(boton);
    alert("No se indico un uso diario.");
    return;
  }


  const mensual = precioPorMes(precioElem.value, mbsElem.value, diasElem.value, diario);

  const item = {
    id: id,
    nombre: nombre,
    mbs: mbsElem.value,
    precio: precioElem.value,
    dias: diasElem.value,
    hastaRenovacion: hastaRenovacion,
    mensual: mensual
  };

  // Vaciar inputs
  document.querySelector("#id").value = "";
  document.querySelector("#nombre").value = "";
  mbsElem.value = "";
  precioElem.value = "";
  diasElem.value = "";

  // Añadir a la lista de items en LocalStorage
  const lista = JSON.parse(localStorage.getItem("items") || "[]");

  // Si el item ya existe, actualizar
  const index = lista.findIndex((i) => i.id == item.id);
  if (index != -1) {
    lista[index] = item;
  } else {
    lista.push(item);
    localStorage.setItem("ultimoId", id);
  }
  localStorage.setItem("items", JSON.stringify(lista));
  exito(boton);
  recargarTabla();
}

function recargarTabla() {
  const items = JSON.parse(localStorage.getItem("items") || "[]");
  items.sort((a, b) => a.mensual - b.mensual);
  const tbody = document.querySelector("tbody");
  tbody.innerHTML = "";
  items.forEach(item => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td style="display: none">${item.id}</td>
    <td>${item.nombre}</td>
    <td>${item.mbs}</td>
    <td>$ ${item.precio}</td>
    <td>${item.dias}</td>
    <td>$ ${item.mensual}</td>
    <td>
      <i class="fa fa-pencil" title="Editar" onclick="editar(${item.id})"></i>
      <i class="fa fa-trash" title="Eliminar" onclick="eliminar(${item.id})"></i>
    </td>`;
    tbody.appendChild(tr);
  });
  if (items.length == 0) {
    const tr = document.createElement("tr");
    tr.innerHTML = "<td colspan='7' style='text-align: center'>No hay opciones cargadas</td>";
    tbody.appendChild(tr);
  }
}

function editar(id) {
  const items = JSON.parse(localStorage.getItem("items") || "[]");
  const item = items.find(item => item.id == id);
  document.querySelector("#id").value = item.id;
  document.querySelector("#nombre").value = item.nombre;
  document.querySelector("#mbs").value = item.mbs;
  document.querySelector("#precio").value = item.precio;
  document.querySelector("#dias").value = item.dias;
}

function eliminar(id) {
  const items = JSON.parse(localStorage.getItem("items") || "[]");
  const index = items.findIndex(item => item.id == id);
  items.splice(index, 1);
  localStorage.setItem("items", JSON.stringify(items));
  recargarTabla();
}

function nuevoId() {
  const id = localStorage.getItem("ultimoId") || 0;
  return parseInt(id) + 1
}

/**
 * Precio de usar por 30 días el plan con el uso diario indicado.
 * @param {number} precio Precio del plan.
 * @param {number} mb Megas del plan.
 * @param {number} dias Duración del plan en días.
 * @param {number} usoDiarioAprox Uso diario aproximado de megas.
 */
function precioPorMes(precio, mb, dias, usoDiarioAprox) {
  let diasSinLimite = mb / usoDiarioAprox;
  if (diasSinLimite >= dias) {
    // Se vence antes de usar todos los megas. Se compra cada 'dias'.
    return (30 / dias) * precio;
  }
  // Se usan todos los megas antes de vencerse. Se compra cada 'diasSinLimite'.
  return Math.ceil(30 / diasSinLimite) * precio;
}
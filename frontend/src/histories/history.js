import { request, getSession, applyPermissions, logOut } from '../utils/main.js';
import { createToast, updateToast } from '../utils/toast.js';

/* =========================
   AUTH
========================= */
const { token, user } = getSession();

if (!token || !user) logOut();

applyPermissions(user);

const listEl = document.getElementById("historyList");
const emptyEl = document.getElementById("emptyState");

const selectEstacionamento = document.getElementById("estacionamentoSelect");

const filtroEl = document.getElementById("filtroPeriodo");
const btnFiltrar = document.getElementById("btnFiltrar");
const btnExportar = document.getElementById("btnExportarPDF");

let historico = [];
let estacionamentoAtual = null;

/* =========================
   INIT UI POR ROLE
========================= */
function initUI() {
  if (user.role === "admin") {
    carregarEstacionamentos();
  } else {
    estacionamentoAtual = user.estacionamentoId;
    loadHistorico();
  }
}

/* =========================
   CARREGAR ESTACIONAMENTOS
========================= */
async function carregarEstacionamentos() {
  const toast = createToast("Carregando estacionamentos...", "info");
  
  try {
    // ⚠AJUSTA AQUI se tua rota for diferente
    const res = await request("/parking");
    
    if (!res.success) throw new Error("Erro ao carregar estacionamentos");
    
    selectEstacionamento.innerHTML = "";
    
    res.estacionamentos.forEach(e => {
      const opt = document.createElement("option");
      opt.value = e._id;
      opt.textContent = e.nome;
      selectEstacionamento.appendChild(opt);
    });
    
    estacionamentoAtual = res.estacionamentos[0]?._id || null;
    selectEstacionamento.value = estacionamentoAtual;
    
    await loadHistorico();
    
    updateToast(toast, "Carregado com sucesso", "sucesso");
    
  } catch (err) {
    updateToast(toast, err.message, "erro");
  }
}

/* =========================
   CARREGAR HISTÓRICO
========================= */
async function loadHistorico() {
  const toast = createToast("Carregando histórico...", "info");
  
  try {
    let url = "/session/historico";
    
    const periodo = filtroEl?.value;
    
    const params = [];
    
    if (periodo && periodo !== "todos") {
      params.push(`periodo=${periodo}`);
    }
    
    if (estacionamentoAtual) {
      params.push(`estacionamentoId=${estacionamentoAtual}`);
    }
    
    if (params.length) url += "?" + params.join("&");
    
    const res = await request(url);
    
    if (!res.success) throw new Error("Erro ao carregar histórico");
    
    historico = res.dados || [];
    
    renderHistorico(historico);
    updateResumo(historico);
    
    emptyEl.style.display = historico.length ? "none" : "flex";
    
    updateToast(toast, "Histórico carregado", "sucesso");
    
  } catch (err) {
    updateToast(toast, err.message, "erro");
  }
}

/* =========================
   EVENTOS
========================= */
selectEstacionamento?.addEventListener("change", (e) => {
  estacionamentoAtual = e.target.value;
  loadHistorico();
});

btnFiltrar?.addEventListener("click", loadHistorico);

if (btnExportar) {
  btnExportar.addEventListener("click", async () => {
    try {
      const periodo = filtroEl?.value;
      
      const params = [];
      
      if (periodo && periodo !== "todos") {
        params.push(`periodo=${periodo}`);
      }
      
      if (estacionamentoAtual) {
        params.push(`estacionamentoId=${estacionamentoAtual}`);
      }
      
      let url = "/session/historico/pdf";
      
      if (params.length > 0) {
        url += "?" + params.join("&");
      }
      
      const res = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (!res.ok) throw new Error("Erro ao gerar PDF");
      
      const blob = await res.blob();
      
      const fileURL = window.URL.createObjectURL(blob);
      
      const a = document.createElement("a");
      a.href = fileURL;
      a.download = "historico.pdf";
      document.body.appendChild(a);
      a.click();
      
      a.remove();
      window.URL.revokeObjectURL(fileURL);
      
    } catch (err) {
      console.error(err);
      alert("Erro ao baixar PDF");
    }
  });
}

/* =========================
   RENDER
========================= */
function renderHistorico(data) {
  listEl.innerHTML = "";
  
  data.forEach(item => {
    const card = document.createElement("div");
    card.className = "history-card";
    
    card.innerHTML = `
      <div class="info-top">
        <span class="placa">${item.placa || "-"}</span>
        <span class="status ${item.status || ""}">${item.status}</span>
      </div>

      <span class="estacionamento">
        ${item.estacionamentoId?.nome || "-"}
      </span>

      <div class="time-block">
        <div>
          <small>Entrada</small>
          <p>${formatDate(item.horaEntrada)}</p>
        </div>

        <div>
          <small>Saída</small>
          <p>${formatDate(item.horaSaida)}</p>
        </div>
      </div>

      <div class="finance-block">
        <span class="valor">${item.valorCobrado || 0} MT</span>
        <small>${item.operadorId?.nome || "-"}</small>
      </div>
    `;
    
    listEl.appendChild(card);
  });
}

/* =========================
   RESUMO
========================= */
function updateResumo(data) {
  const total = data.reduce((acc, i) => acc + (i.valorCobrado || 0), 0);
  
  document.getElementById("totalFaturado").textContent = `${total} MT`;
  document.getElementById("totalRegistos").textContent = data.length;
}

/* =========================
   FORMAT
========================= */
function formatDate(date) {
  if (!date) return "-";
  
  return new Date(date).toLocaleString("pt-MZ", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

/* INIT */
initUI();
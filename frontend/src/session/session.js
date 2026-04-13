import { request, getSession, applyPermissions, logOut } from '../utils/main.js';
import { createToast, updateToast, confirmarToast } from '../utils/toast.js';

/* =========================
   AUTH
========================= */
const { token, user } = getSession();

if (!token || !user) {
  logOut();
}

applyPermissions(user);

/* =========================
   GLOBAL
========================= */
let estacionamentoAtual = null;

const toast = createToast("Carregando dados...", "info");

/* =========================
   CARREGAR ESTACIONAMENTOS
========================= */
async function getParkigs() {
  try {
    const data = await request("/parking");
    const park = data.estacionamentos || [];
    
    const select = document.getElementById("estacionamentoSelect");
    select.innerHTML = "";
    
    park.forEach(p => {
      const opt = document.createElement("option");
      opt.value = p._id;
      opt.textContent = p.nome;
      select.appendChild(opt);
    });
    
    if (park.length > 0) {
      estacionamentoAtual = park[0]._id;
      select.value = estacionamentoAtual;
      
      loadStats(estacionamentoAtual);
      loadAtivos(estacionamentoAtual);
    }
    
  } catch (err) {
    updateToast(toast, err.message, "erro");
  }
}

/* =========================
   CHANGE SELECT
========================= */
document.getElementById("estacionamentoSelect")
  ?.addEventListener("change", (e) => {
    estacionamentoAtual = e.target.value;
    loadStats(estacionamentoAtual);
    loadAtivos(estacionamentoAtual);
  });

/* =========================
   STATS
========================= */
async function loadStats(estacionamentoId = null) {
  try {
    const url = estacionamentoId ?
      `/session/vagas-disponiveis?estacionamentoId=${estacionamentoId}` :
      `/session/vagas-disponiveis`;
    
    const data = await request(url);
    
    document.getElementById("active").textContent = data.carrosAtivos;
    document.getElementById("entry").textContent = data.entradas;
    document.getElementById("available").textContent = data.vagasDisponiveis;
    
  } catch (err) {
    updateToast(toast, err.message, "erro");
  }
}

/* =========================
   RENDER SESSÕES
========================= */
function renderSessions(data) {
  const container = document.getElementById("listSessions");
  container.innerHTML = "";
  
  if (!data.length) {
    container.innerHTML = `
      <div class="empty">
        <i class="bi bi-inbox"></i>
        <p>Nenhuma movimentação ativa</p>
      </div>
    `;
    return;
  }
  
  data.forEach(sessao => {
    container.innerHTML += `
      <div class="card-item">

        <div class="card-header">
          <strong class="placa">${sessao.placa}</strong>
          <span class="status ${sessao.status}">
            ${sessao.status}
          </span>
        </div>

        <div class="card-body">
          <div>
            <small>Entrada</small>
            <p>${new Date(sessao.horaEntrada).toLocaleString()}</p>
          </div>

          <div>
            <small>Valor</small>
            <p>${sessao.valorCobrado ?? 0} MT</p>
          </div>
        </div>

        <div class="card-footer">
          <small>
            ${sessao.estacionamentoId?.nome || "Não definido"}
          </small>
        </div>

        <button class="exit-btn" data-id="${sessao._id}">
          Confirmar saída
        </button>

      </div>
    `;
  });
}

/* =========================
   SESSÕES ATIVAS
========================= */
async function loadAtivos(estacionamentoId = null) {
  try {
    const url = estacionamentoId ?
      `/session/ativos?estacionamentoId=${estacionamentoId}` :
      `/session/ativos`;
    
    const res = await request(url);
    renderSessions(res.data || []);
    
  } catch (err) {
    updateToast(toast, err.message, "erro");
  }
}

/* =========================
   ENTRADA
========================= */
document.getElementById("btnAction").onclick = async () => {
  const placa = document.getElementById("placa").value.trim();
  
  if (!placa) {
    updateToast(toast, "Digite a placa", "info");
    return;
  }
  
  if (user.role === "admin" && !estacionamentoAtual) {
    updateToast(toast, "Escolha o estacionamento", "info");
    return;
  }
  
  try {
    await request(`/session/entrada`, "POST", {
      placa,
      estacionamentoId: estacionamentoAtual
    });
    
    document.getElementById("placa").value = "";
    
    loadStats(estacionamentoAtual);
    loadAtivos(estacionamentoAtual);
    
    updateToast(toast, "Entrada registrada", "sucesso");
    
  } catch (err) {
    updateToast(toast, err.message, "erro");
  }
};

/* =========================
   SAÍDA
========================= */
document.getElementById("listSessions").onclick = async (e) => {
  if (!e.target.classList.contains("exit-btn")) return;
  
  const sessaoId = e.target.dataset.id;
  
  const card = e.target.closest(".card-item");
  const placa = card.querySelector("strong")?.textContent || "";
  
  const confirmou = await confirmarToast(
    `Deseja finalizar a sessão da placa ${placa}?`
  );
  
  if (!confirmou) return;
  
  try {
    await request(`/session/saida`, "POST", { sessaoId });
    
    loadStats(estacionamentoAtual);
    loadAtivos(estacionamentoAtual);
    
    updateToast(toast, "Saída registrada", "sucesso");
    
  } catch (err) {
    updateToast(toast, err.message, "erro");
  }
};

/* =========================
   PESQUISA
========================= */
const searchInput = document.getElementById("searchPlaca");

if (searchInput) {
  let timeout;
  
  searchInput.addEventListener("input", (e) => {
    clearTimeout(timeout);
    
    const termo = e.target.value.trim();
    
    timeout = setTimeout(() => {
      if (!termo) {
        loadAtivos(estacionamentoAtual);
        return;
      }
      
      pesquisarPlaca(termo);
    }, 300);
  });
}

async function pesquisarPlaca(termo) {
  try {
    const url = estacionamentoAtual ?
      `/session/ativos?placa=${termo}&estacionamentoId=${estacionamentoAtual}` :
      `/session/ativos?placa=${termo}`;
    
    const res = await request(url);
    renderSessions(res.data || []);
    
  } catch (err) {
    console.error(err);
  }
}

/* =========================
   INIT
========================= */
getParkigs();
loadStats();
loadAtivos();
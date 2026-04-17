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

/* =========================
   CARREGAR ESTACIONAMENTOS
========================= */
async function getParkings() {
  const toast = createToast("Carregando dados...", "info");

  try {
    // OPERADOR
    if (user.role === "operador") {
      estacionamentoAtual = user.estacionamentoId;

      await loadStats(estacionamentoAtual);
      await loadAtivos(estacionamentoAtual);

      updateToast(toast, "Dados carregados", "sucesso");
      return;
    }

    // ADMIN
    const data = await request("/parking");

    if (!data.success) {
      throw new Error("Erro ao carregar estacionamentos");
    }

    const park = data.estacionamentos || [];

    const select = document.getElementById("estacionamentoSelect");

    if (!select) return;

    select.innerHTML = "";

    if (park.length === 0) {
      createToast("Nenhum estacionamento encontrado", "info");
      return;
    }

    park.forEach(p => {
      const opt = document.createElement("option");
      opt.value = p._id;
      opt.textContent = p.nome;
      select.appendChild(opt);
    });

    estacionamentoAtual = park[0]._id;
    select.value = estacionamentoAtual;

    await loadStats(estacionamentoAtual);
    await loadAtivos(estacionamentoAtual);

    updateToast(toast, "Estacionamentos carregados", "sucesso");

  } catch (err) {
    updateToast(toast, err.message, "erro");
  }
}

/* =========================
   CHANGE SELECT
========================= */
const selectEl = document.getElementById("estacionamentoSelect");

if (selectEl) {
  selectEl.addEventListener("change", async (e) => {
    estacionamentoAtual = e.target.value;
    await loadStats(estacionamentoAtual);
    await loadAtivos(estacionamentoAtual);
  });
}

/* =========================
   STATS
========================= */
async function loadStats(estacionamentoId = null) {
  try {
    const url = estacionamentoId
      ? `/session/vagas-disponiveis?estacionamentoId=${estacionamentoId}`
      : `/session/vagas-disponiveis`;

    const data = await request(url);

    if (!data.success) {
      throw new Error("Erro ao carregar dados");
    }

    const stats = data.dados || data;

    const elActive = document.getElementById("active");
    const elEntry = document.getElementById("entry");
    const elAvailable = document.getElementById("available");

    if (elActive) elActive.textContent = stats.carrosAtivos;
    if (elEntry) elEntry.textContent = stats.entradas;
    if (elAvailable) elAvailable.textContent = stats.vagasDisponiveis;

  } catch (err) {
    createToast(err.message, "erro");
  }
}

/* =========================
   RENDER SESSÕES
========================= */
function renderSessions(data) {
  const container = document.getElementById("listSessions");
  if (!container) return;
  
  container.innerHTML = "";
  
  if (!data.length) {
    container.innerHTML = `
      <div class="empty">
        <p>Nenhuma movimentação ativa</p>
      </div>
    `;
    return;
  }
  
  const fragment = document.createDocumentFragment();
  
  data.forEach(sessao => {
    const div = document.createElement("div");
    div.className = "card-item";
    
    div.innerHTML = `
      <div class="card-header">
        <strong class="placa">${formatarPlacaVisual(sessao.placa)}</strong>
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
          <small>Valor a pagar</small>
          <p>${sessao.valorCobrado ?? 0} MT</p>
        </div>
      </div>

      <div class="card-footer">
        <small>${sessao.estacionamentoId?.nome || "Não definido"}</small>
      </div>

      <button class="exit-btn" data-id="${sessao._id}">
        Confirmar saída
      </button>
    `;
    
    fragment.appendChild(div);
  });
  
  container.appendChild(fragment);
}
/* =========================
   SESSÕES ATIVAS
========================= */
async function loadAtivos(estacionamentoId = null) {
  try {
    const url = estacionamentoId
      ? `/session/ativos?estacionamentoId=${estacionamentoId}`
      : `/session/ativos`;

    const res = await request(url);

    if (!res.success) {
      throw new Error("Erro ao carregar sessões");
    }

    renderSessions(res.data || []);

  } catch (err) {
    createToast(err.message, "erro");
  }
}

/* =========================
   ENTRADA
========================= */
const btnEntrada = document.getElementById("btnAction");

if (btnEntrada) {
  btnEntrada.onclick = async () => {
    const placaInput = document.getElementById("placa");

    if (!placaInput) return;

    const placa = placaInput.value
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "");

    if (!placa) {
      createToast("Digite a placa", "info");
      return;
    }

    if (user.role === "admin" && !estacionamentoAtual) {
      createToast("Escolha o estacionamento", "info");
      return;
    }

    const toast = createToast("Registrando entrada...", "info");

    try {
      btnEntrada.disabled = true;
      btnEntrada.innerText = "Processando...";

      const res = await request(`/session/entrada`, "POST", {
        placa,
        estacionamentoId: estacionamentoAtual
      });

      if (!res.success) {
        throw new Error("Erro ao registrar entrada. Verifique a placa");
      }

      placaInput.value = "";

      await loadStats(estacionamentoAtual);
      await loadAtivos(estacionamentoAtual);

      updateToast(toast, "Entrada registrada", "sucesso");

    } catch (err) {
      updateToast(toast, err.message, "erro");
    } finally {
      btnEntrada.disabled = false;
      btnEntrada.innerText = "Registrar Entrada";
    }
  };
}

/* =========================
   SAÍDA
========================= */
const listEl = document.getElementById("listSessions");

if (listEl) {
  listEl.onclick = async (e) => {
    if (!e.target.classList.contains("exit-btn")) return;

    const sessaoId = e.target.dataset.id;

    const confirmou = await confirmarToast("Confirmar saída?");

    if (!confirmou) return;

    const toast = createToast("Processando saída...", "info");

    try {
      const res = await request(`/session/saida`, "POST", { sessaoId });

      if (!res.success) {
        throw new Error("Erro ao finalizar sessão");
      }

      await loadStats(estacionamentoAtual);
      await loadAtivos(estacionamentoAtual);

      updateToast(toast, "Saída registrada", "sucesso");

    } catch (err) {
      updateToast(toast, err.message, "erro");
    }
  };
}

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
      if (termo.length < 3) return;
      pesquisarPlaca(termo);
    }, 300);
  });
}

async function pesquisarPlaca(termo) {
  try {
    const url = estacionamentoAtual
      ? `/session/ativos?placa=${termo}&estacionamentoId=${estacionamentoAtual}`
      : `/session/ativos?placa=${termo}`;

    const res = await request(url);

    if (!res.success) {
      throw new Error("Erro ao pesquisar");
    }

    renderSessions(res.data || []);

  } catch (err) {
    createToast(err.message, "erro");
  }
}

/* =========================
   FORMATAR PLACA
========================= */
function formatarPlacaVisual(placa) {
  if (!placa) return "";

  const limpa = placa.toUpperCase().replace(/[^A-Z0-9]/g, "");

  if (limpa.length < 8) return placa;

  return `${limpa.slice(0, 3)}-${limpa.slice(3, 6)}-${limpa.slice(6, 8)}`;
}

/* =========================
   INIT
========================= */
getParkings();
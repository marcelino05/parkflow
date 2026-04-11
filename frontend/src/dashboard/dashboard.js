import { request, getSession, logOut } from "../utils/main.js";
import { createToast, updateToast } from '../utils/toast.js';

/* =========================
   AUTH PROTECTION
========================= */
const { user, token } = getSession();

if (!user?.role || !token) {
  logOut();
}

if (user.role !== "admin") {
  window.location.href = "../session/sessao.html";
}

/* =========================
   LOADING
========================= */
const toast = createToast("Carregando dados...");

function mostrarLoading() {
  ["receita", "ativos", "entradas", "vagas"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerText = "...";
  });
}

/* =========================
   CHARTS
========================= */
const chartReceita = new Chart(document.getElementById("chart1"), {
  type: "line",
  data: {
    labels: [],
    datasets: [{
      label: "Receita",
      data: [],
      tension: 0.4
    }]
  }
});

const chartEntradas = new Chart(document.getElementById("chart2"), {
  type: "bar",
  data: {
    labels: [],
    datasets: [{
      label: "Entradas",
      data: []
    }]
  }
});

/* =========================
   DASHBOARD CARDS
========================= */
async function carregarDashboard() {
  mostrarLoading();

  try {
    const res = await request("/session/dashboard");

    if (!res.success) throw new Error(res.message);

    const data = res.dados; // ✅ CORRETO

    document.getElementById("receita").innerText = `${data.receitaHoje} MZN`;
    document.getElementById("ativos").innerText = data.carrosAtivos;
    document.getElementById("entradas").innerText = data.entradasHoje;
    document.getElementById("vagas").innerText = data.vagasDisponiveis;

    updateToast(toast, "Dashboard carregado", "sucesso");

  } catch (err) {
    console.error("Erro dashboard:", err.message);
    updateToast(toast, err.message, "erro");
  }
}

/* =========================
   GRÁFICOS
========================= */
async function carregarGraficos() {
  try {
    /* ===== RECEITA ===== */
    const receita = await request("/session/receita?periodo=7dias");

    if (receita.success && receita.dados) {

      chartReceita.data.labels = receita.dados.map(d =>
        `${d._id.dia}/${d._id.mes}`
      );

      chartReceita.data.datasets[0].data =
        receita.dados.map(d => d.total);

      chartReceita.update();
    }

    /* ===== ENTRADAS POR HORA ===== */
    const entradas = await request("/session/entradas-por-hora"); // ✅ corrigido rota

    if (entradas.success && entradas.dados) {

      const mapaHoras = new Array(24).fill(0);

      entradas.dados.forEach(d => {
        mapaHoras[d._id.hora] = d.total;
      });

      chartEntradas.data.labels = Array.from(
        { length: 24 },
        (_, i) => `${i}h`
      );

      chartEntradas.data.datasets[0].data = mapaHoras;

      chartEntradas.update();
    }

  } catch (err) {
    console.error("Erro gráficos:", err.message);
  }
}

/* =========================
   COMPANY NAME
========================= */
async function getCompanyName() {
  try {
    const res = await request("/company");

    if (!res.success) return;

    document.getElementById("companyName").textContent =
      res.data?.empresa?.nome || "Empresa";

  } catch (err) {
    console.error("Erro empresa:", err.message);
  }
}

/* =========================
   INIT
========================= */
carregarDashboard();
carregarGraficos();
getCompanyName();

/* =========================
   AUTO REFRESH
========================= */
setInterval(() => {
  carregarDashboard();
  carregarGraficos();
}, 10000);
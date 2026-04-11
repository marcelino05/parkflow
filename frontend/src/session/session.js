  import { request, getSession, applyPermissions, logOut } from '../utils/main.js';
  import { createToast, updateToast, confirmarToast } from '../utils/toast.js';
  
  const { token, user } = getSession()
  
  if(!token || !user){ logOut() }
  
  applyPermissions(user)
  
  const toast = createToast("Carregando dados...", "info");
  
  async function loadStats() {
    try {
      const data = await request(`/session/vagas-disponiveis`);
      document.getElementById("active").textContent = data.carrosAtivos;
      document.getElementById("entry").textContent = data.entradas;
      document.getElementById("available").textContent = data.vagasDisponiveis;
      
      updateToast(toast, "Dados carregados", "sucesso");
      
    } catch (err) {
      updateToast(toast, err.message, "erro");
    }
  }
  
  // =========================
  // ATIVOS
  // =========================
  async function loadAtivos() {
    try {
      const res = await request(`/session/ativos`);
      const data = res.data || [];
      const container = document.getElementById("listSessions");
      
      container.innerHTML = "";
      
      if (!data.length) {
        container.innerHTML = `
          <div class="empty">
            <i class="bi bi-inbox"></i>
            <p>Nenhuma movimentação ativa</p>
          </div>
        `;
        updateToast(toast, "Sem sessões ativas", "info");
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
            </div></hr>
  
            <div class="card-footer">
            <h3 class="placa">Estacionamento</h3>
              <small>
               Nome: ${sessao.estacionamentoId?.nome || "Não definido"}
              </small>
              <span> | Local: </span>
               <small>
                ${sessao.estacionamentoId?.endereco || "Não definido"}
              </small>
            </div>
  
            <button class="exit-btn" data-id="${sessao._id}">
              confirmar saida
            </button>
  
          </div>
        `;
      });
      
      updateToast(toast, "Sessões carregadas", "sucesso");
      
    } catch (err) {
      updateToast(toast, err.message, "erro");
    }
  }
  
  // =========================
  // ENTRADA
  // =========================
  document.getElementById("btnAction").onclick = async () => {
    const placa = document.getElementById("placa").value.trim();
    
    if (!placa) {
      updateToast(toast, "Digite a placa", "info");
      return;
    }
    
    let estacionamentoId = null;
    
    if (user.role === "admin") {
      estacionamentoId = document.getElementById("estacionamentoSelect")?.value;
      
      if (!estacionamentoId) {
        updateToast(toast, "Escolha o estacionamento", "info");
        return;
      }
    }
    
    try {
      await request(`/session/entrada`, "POST", {
        placa,
        estacionamentoId
      });
      
      document.getElementById("placa").value = "";
      
      updateToast(toast, "Entrada registrada", "sucesso");
      
      loadStats();
      loadAtivos();
      
    } catch (err) {
      updateToast(toast, err.message);
    }
  };
  
  // =========================
  // SAÍDA
  // =========================
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
      await request(`/session/saida`, "POST", {
        sessaoId
      });
      updateToast(toast, "Saída registrada", "sucesso");
      
      loadStats();
      loadAtivos();
      
    } catch (err) {
      updateToast(toast, err.message, "erro");
    }
  };
  
  // INICIALIZAR
  applyPermissions();
  loadStats();
  loadAtivos();
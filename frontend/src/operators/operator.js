import { request, getSession, applyPermissions, logOut } from "../utils/main.js";
import { createToast, updateToast, confirmarToast } from "../utils/toast.js";

/* =========================
   AUTH
========================= */
const { token, user } = getSession();

if (!token || !user) {
  logOut();
}

applyPermissions(user);

/* =========================
   ELEMENTOS
========================= */
const form = document.getElementById("formOperador");
const tabela = document.getElementById("tabelaOperadores");

const modal = document.getElementById("modalOperador");
const closeModalBtn = document.getElementById("closeModal");

/* =========================
   MODAL
========================= */
function abrirModal() {
  modal.style.display = "flex";
}

function fecharModal() {
  modal.style.display = "none";
  document.getElementById("formEditOperador").reset();
}

closeModalBtn.addEventListener("click", fecharModal);

/* =========================
   LISTAR OPERADORES
========================= */
async function getOperator() {
  const toast = createToast("Carregando operadores...", "info");
  
  try {
    const res = await request("/user/operador");
    
    if (!res || !res.success) {
      updateToast(toast, res?.message || "Erro ao carregar", "erro");
      return;
    }
    
    renderOperadores(res.data || []);
    updateToast(toast, "Operadores carregados", "sucesso");
    
  } catch {
    updateToast(toast, "Erro no servidor", "erro");
  }
}

/* =========================
   RENDER
========================= */
function renderOperadores(operadores = []) {
  tabela.innerHTML = "";
  
  operadores.forEach(op => {
    tabela.innerHTML += `
      <tr>
        <td>${op.nome}</td>
        <td>${op.telefone}</td>
        <td>${op.email}</td>
        <td>${op.estacionamentoId?.nome || "N/A"}</td>
        <td>
          <button class="btn-edit" data-op='${encodeURIComponent(JSON.stringify(op))}'>
            Editar
          </button>
          <button class="btn-delete" data-id="${op._id}">
            Excluir
          </button>
        </td>
      </tr>
    `;
  });
}

/* =========================
   EVENTS
========================= */
tabela.addEventListener("click", (e) => {
  const btnEdit = e.target.closest(".btn-edit");
  const btnDelete = e.target.closest(".btn-delete");
  
  if (btnEdit) {
    const op = JSON.parse(decodeURIComponent(btnEdit.dataset.op));
    abrirModalEditar(op);
  }
  
  if (btnDelete) {
    deletarOperador(btnDelete.dataset.id);
  }
});

/* =========================
   EDITAR MODAL
========================= */
function abrirModalEditar(op) {
  document.getElementById("editId").value = op._id;
  document.getElementById("editNome").value = op.nome;
  document.getElementById("editTelefone").value = op.telefone;
  document.getElementById("editEmail").value = op.email;
  document.getElementById("editSenha").value = "";
  
  abrirModal();
  
  document.getElementById("editEstacionamentoId").value =
    op.estacionamentoId?._id || "";
}

/* =========================
   ATUALIZAR OPERADOR
========================= */
document.getElementById("formEditOperador").addEventListener("submit", async (e) => {
  e.preventDefault();
  
  const id = document.getElementById("editId").value;
  
  const data = {
    nome: document.getElementById("editNome").value.trim(),
    telefone: document.getElementById("editTelefone").value.trim(),
    email: document.getElementById("editEmail").value.trim(),
    senha: document.getElementById("editSenha").value || undefined,
    estacionamentoId: document.getElementById("editEstacionamentoId").value
  };
  
  const toast = createToast("Atualizando operador...", "info");
  
  if (!data.estacionamentoId) {
    updateToast(toast, "Seleciona um estacionamento", "erro");
    return;
  }
  
  try {
    const res = await request(`/user/operador/${id}`, "PUT", data);
    
    if (!res || !res.success) {
      if (res?.erros?.length) {
        updateToast(toast, res.erros.join(" | "), "erro");
      } else {
        updateToast(toast, res?.message || "Erro ao atualizar", "erro");
      }
      return;
    }
    
    updateToast(toast, "Operador atualizado", "sucesso");
    
    fecharModal();
    getOperator();
    
  } catch {
    updateToast(toast, "Erro no servidor", "erro");
  }
});

/* =========================
   DELETAR OPERADOR
========================= */
let isDeleting = false;

async function deletarOperador(id) {
  if (isDeleting) return;
  isDeleting = true;
  
  const confirmar = await confirmarToast(
    "Eliminar operador?",
    "Esta ação não pode ser desfeita."
  );
  
  if (!confirmar) {
    isDeleting = false;
    return;
  }
  
  const toast = createToast("Deletando operador...", "info");
  
  try {
    const res = await request(`/user/operador/${id}`, "DELETE");
    
    if (!res || !res.success) {
      updateToast(toast, res?.message || "Erro ao deletar", "erro");
      isDeleting = false;
      return;
    }
    
    updateToast(toast, "Operador deletado", "sucesso");
    getOperator();
    
  } catch {
    updateToast(toast, "Erro no servidor", "erro");
  }
  
  isDeleting = false;
}

/* =========================
   CARREGAR ESTACIONAMENTOS
========================= */
async function carregarEstacionamentos() {
  try {
    const res = await request("/parking");
    
    if (!res || !res.success) return;
    
    const lista = res.data || res.estacionamentos || [];
    
    const selectCreate = document.getElementById("estacionamentoId");
    const selectEdit = document.getElementById("editEstacionamentoId");
    
    selectCreate.innerHTML = '<option value="">Selecionar Estacionamento</option>';
    selectEdit.innerHTML = '<option value="">Selecionar Estacionamento</option>';
    
    lista.forEach(est => {
      const option1 = document.createElement("option");
      option1.value = est._id;
      option1.textContent = est.nome;
      
      const option2 = option1.cloneNode(true);
      
      selectCreate.appendChild(option1);
      selectEdit.appendChild(option2);
    });
    
  } catch {
    createToast("Erro ao carregar estacionamentos", "erro");
  }
}

/* =========================
   CRIAR OPERADOR
========================= */
/* =========================
   CRIAR OPERADOR
========================= */
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  
  const data = {
    nome: document.getElementById("nome").value.trim(),
    telefone: document.getElementById("telefone").value.trim(),
    email: document.getElementById("email").value.trim(),
    senha: document.getElementById("senha").value,
    estacionamentoId: document.getElementById("estacionamentoId").value
  };
  
  const toast = createToast("Criando operador...", "info");
  
  try {
    const res = await request("/user/operador", "POST", data);
    
    // ERRO DO BACKEND (IMPORTANTE)
    if (!res || !res.success) {
      
      // 👇 AQUI ESTÁ A CORREÇÃO REAL
      if (res?.erros && Array.isArray(res.erros)) {
        updateToast(toast, res.erros.join(" | "), "erro");
      } else {
        updateToast(toast, res?.message || "Erro ao criar operador", "erro");
      }
      
      return;
    }
    
    updateToast(toast, "Operador criado com sucesso", "sucesso");
    
    form.reset();
    getOperator();
    
  } catch {
    updateToast(toast, "Erro de conexão com servidor", "erro");
  }
});
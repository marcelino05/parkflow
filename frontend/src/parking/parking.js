import { request, getSession, applyPermissions, logOut } from "../utils/main.js";
import { createToast, updateToast, confirmarToast } from "../utils/toast.js";

/* =========================
   AUTH
========================= */
const session = getSession();

if (!session?.token || !session?.user) {
  logOut();
}

const { user } = session;

/* =========================
   PERMISSIONS
========================= */
applyPermissions(user);

/* =========================
   ELEMENTOS
========================= */
const cardList = document.getElementById("card-list");
const template = document.getElementById("template-card");

const modal = document.getElementById("modal");
const btnNovo = document.getElementById("btnNovo");
const btnSalvar = document.getElementById("salvar");
const btnCancelar = document.getElementById("cancelar");

const nome = document.getElementById("nome");
const endereco = document.getElementById("endereco");
const vagas = document.getElementById("vagas");
const preco = document.getElementById("preco");
const modalTitle = document.getElementById("modalTitle");

/* =========================
   ESTADO
========================= */
let editId = null;

/* =========================
   MODAL
========================= */
function abrirModal(titulo = "Novo Parque") {
  modal.style.display = "flex";
  modalTitle.textContent = titulo;
  btnSalvar.textContent = editId ? "Atualizar" : "Salvar";
}

function fecharModal() {
  modal.style.display = "none";
}

/* =========================
   LIMPAR
========================= */
function limpar() {
  nome.value = "";
  endereco.value = "";
  vagas.value = "";
  preco.value = "";
}

/* =========================
   LISTAR
========================= */
async function listar() {
  try {
    const res = await request("/parking");
    
    if (!res.success) {
      throw new Error(res?.message);
    }
    
    const lista = res?.estacionamentos || [];

    cardList.innerHTML = "";
    
    lista.forEach(item => {
      const card = template.cloneNode(true);
      card.style.display = "block";
      
      card.querySelector(".parking-name").textContent = item.nome;
      card.querySelector(".parking-location span").textContent = item.endereco;
      
      card.querySelector(".parking-created span").textContent =
        item.criadoEm ?
        new Date(item.criadoEm).toLocaleDateString("pt-MZ") :
        "—";
      
      card.querySelector(".parking-status").textContent =
        item.ativo || "ativo";
      
      card.querySelector(".parking-vagas").textContent = item.totalVaga || 0;
      card.querySelector(".parking-disponivel").textContent = item.vagasDisponiveis || 0;
      card.querySelector(".parking-preco").textContent = item.precoPorHora || 0;
      card.querySelector(".parking-receita").textContent = item.receita || 0;
      
      /* EDITAR */
      card.querySelector(".parking-edit-btn").onclick = () => {
        editId = item._id;
        
        nome.value = item.nome;
        endereco.value = item.endereco;
        vagas.value = item.totalVaga;
        preco.value = item.precoPorHora;
        
        abrirModal("Editar Parque");
      };
      
      cardList.appendChild(card);
    });
    
  } catch (err) {
    console.error(err.message);
    createToast(err.message, "erro");
  }
}

/* =========================
   CRIAR
========================= */
async function criar() {
  const toastId = createToast("A criar parque...", "info");
  
  try {
    const res = await request("/parking", "POST", {
      nome: nome.value,
      endereco: endereco.value,
      totalVaga: Number(vagas.value),
      precoPorHora: Number(preco.value)
    });
    
    if (!res.success) {
      throw new Error(res.message);
    }
    
    updateToast(toastId, "Criado com sucesso", "sucesso");
    
    fecharModal();
    limpar();
    listar();
    
  } catch (err) {
    updateToast(toastId, err.message, "erro");
  }
}

/* =========================
   EDITAR
========================= */
async function editar() {
  try {
    if (!editId) throw new Error("ID inválido para edição");
    
    const confirmou = await confirmarToast("Deseja atualizar este parque?");
    if (!confirmou) return;
    
    const toastId = createToast("A atualizar...", "info");
    
    const res = await request(`/parking/${editId}`, "PUT", {
      nome: nome.value,
      endereco: endereco.value,
      totalVaga: Number(vagas.value),
      precoPorHora: Number(preco.value)
    });
    
    if (!res.success) {
      throw new Error(res.message);
    }
    
    updateToast(toastId, "Atualizado com sucesso", "sucesso");
    
    fecharModal();
    limpar();
    editId = null;
    
    listar();
    
  } catch (err) {
    createToast(err.message, "erro");
  }
}

/* =========================
   EVENTOS
========================= */
btnNovo.onclick = () => {
  editId = null;
  limpar();
  abrirModal("Novo Parque");
};

btnCancelar.onclick = () => {
  fecharModal();
};

btnSalvar.onclick = () => {
  if (!validarCampos()) return;
  
  if (editId) {
    editar();
  } else {
    criar();
  }
};

/* =========================
   VALIDAÇÃO
========================= */
function validarCampos() {
  const nomeVal = nome.value.trim();
  const enderecoVal = endereco.value.trim();
  const vagasVal = Number(vagas.value);
  const precoVal = Number(preco.value);
  
  if (!nomeVal) {
    createToast("Nome é obrigatório", "erro");
    return false;
  }
  
  if (nomeVal.length < 3) {
    createToast("Nome deve ter pelo menos 3 caracteres", "erro");
    return false;
  }
  
  if (!enderecoVal) {
    createToast("Endereço é obrigatório", "erro");
    return false;
  }
  
  if (!vagas.value || isNaN(vagasVal) || vagasVal <= 0) {
    createToast("Vagas deve ser maior que 0", "erro");
    return false;
  }
  
  if (!preco.value || isNaN(precoVal) || precoVal <= 0) {
    createToast("Preço deve ser maior que 0", "erro");
    return false;
  }
  
  return true;
}

/* =========================
   INIT
========================= */
listar();
import { createToast, updateToast } from "../utils/toast.js";

/* =========================
   TOKEN
========================= */
const token = localStorage.getItem("token");

if (!token) {
  window.location.href = "../auth/auth.html";
}

/* =========================
   API
========================= */
const API = "http://localhost:5000/api/parking";

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
    const res = await fetch(API, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || "Erro ao criar buscar  estacionamento");
    }
    const lista = data.estacionamentos || [];
    
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
      card.querySelector(".parking-disponivel").textContent =
        item.vagasDisponiveis || 0
      card.querySelector(".parking-preco").textContent = item.precoPorHora || 0;
      card.querySelector(".parking-receita").textContent = item.receita || 0;
      
      /* EDITAR */
      card.querySelector(".parking-edit-btn").onclick = () => {
        editId = item.id;
        
        nome.value = item.nome;
        endereco.value = item.endereco;
        vagas.value = item.vagas;
        preco.value = item.preco;
        
        abrirModal("Editar Parque");
      };
      
      cardList.appendChild(card);
    });
    
  } catch (err) {
    console.error(err.message);
  }
}

/* =========================
   CRIAR
========================= */
async function criar() {
  const toastId = createToast("A criar parque...", "info");
  
  try {
    const res = await fetch(API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        nome: nome.value,
        endereco: endereco.value,
        totalVaga: Number(vagas.value),
        precoPorHora: Number(preco.value)
      })
    });
    
    const data = await res.json();
    
    /* 🔴 VERIFICA ERRO DO BACKEND */
    if (!res.ok) {
      throw new Error(data.message || "Erro ao criar Estaciomento");
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
  const toastId = createToast("A atualizar...", "info");
  
  try {
    await fetch(`${API}/${editId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        nome: nome.value,
        endereco: endereco.value,
        vagas: Number(vagas.value),
        preco: Number(preco.value)
      })
    });
    
    if (!res.ok) {
      throw new Error(data.message || "Erro ao  atualizar estacionamento");
    }
    
    updateToast(toastId, "Atualizado com sucesso", "sucesso");
    
    fecharModal();
    editId = null;
    limpar();
    listar();
    
  } catch (err) {
    updateToast(toastId, err.message || "Erro ao atualizar", "erro");
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
  if (editId) {
    editar();
  } else {
    criar();
  }
};

/* =========================
   INICIAR
========================= */
listar();
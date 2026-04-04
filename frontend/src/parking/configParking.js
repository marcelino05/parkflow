const modal = document.getElementById("modal");
const btnNovo = document.getElementById("btnNovo");
const btnSalvar = document.getElementById("salvar");
const btnCancelar = document.getElementById("cancelar");

/* ABRIR MODAL */
btnNovo.onclick = () => {
  modal.style.display = "flex";
};

/* FECHAR MODAL */
btnCancelar.onclick = () => {
  modal.style.display = "none";
};

/* SALVAR */
btnSalvar.onclick = () => {
  if (editId) {
    editar(); // função PUT
  } else {
    criar(); // função POST
  }
};
// =========================
// TOAST ÚNICO (GLOBAL)
// =========================
let toastInstance = null;
let removeTimeout = null;

// =========================
// CONTAINER
// =========================
let toastContainer = null;

const getContainer = () => {
  if (!toastContainer) {
    toastContainer = document.createElement("div");
    toastContainer.className = "toast-container";
    document.body.appendChild(toastContainer);
  }
  return toastContainer;
};

// =========================
// CRIAR TOAST (SÓ 1)
// =========================
export const createToast = (msg = "", tipo = "info") => {
  const container = getContainer();
  
  // se já existe, só atualiza
  if (toastInstance) {
    updateToast(toastInstance, msg, tipo);
    return toastInstance;
  }
  
  const div = document.createElement("div");
  div.className = "toast " + tipo;
  div.textContent = msg;
  
  container.appendChild(div);
  
  toastInstance = div;
  
  return div;
};

// =========================
// ATUALIZAR TOAST (COM AUTO CLOSE)
// =========================
export const updateToast = (toast, msg, tipo = "info", tempo = 2500) => {
  const target = toast || toastInstance;
  
  if (!target) return;
  
  // limpa timer anterior (evita bug de múltiplos closes)
  if (removeTimeout) {
    clearTimeout(removeTimeout);
  }
  
  target.textContent = msg;
  target.className = "toast " + tipo;
  
  // se tempo for 0, não remove
  if (tempo === 0) return;
  
  removeTimeout = setTimeout(() => {
    if (!toastInstance) return;
    
    toastInstance.classList.add("saindo");
    
    setTimeout(() => {
      toastInstance.remove();
      toastInstance = null;
    }, 300);
  }, tempo);
};

// =========================
// REMOVER MANUAL (SE PRECISAR)
// =========================
export const removeToast = (tempo = 2000) => {
  if (!toastInstance) return;
  
  setTimeout(() => {
    toastInstance.classList.add("saindo");
    
    setTimeout(() => {
      toastInstance.remove();
      toastInstance = null;
    }, 300);
  }, tempo);
};

// =========================
// RESET TOTAL (OPCIONAL)
// =========================
export const clearToast = () => {
  if (removeTimeout) clearTimeout(removeTimeout);
  
  if (toastInstance) {
    toastInstance.remove();
    toastInstance = null;
  }
};
export function confirmarToast(mensagem) {
  return new Promise((resolve) => {
    const toast = createToast(mensagem, "info");
    
    const container = document.createElement("div");
    container.classList.add("toast-actions");
    
    const btnConfirmar = document.createElement("button");
    btnConfirmar.textContent = "Confirmar";
    btnConfirmar.classList.add("btn-confirm");
    
    const btnCancelar = document.createElement("button");
    btnCancelar.textContent = "Cancelar";
    btnCancelar.classList.add("btn-cancel");
    
    container.appendChild(btnConfirmar);
    container.appendChild(btnCancelar);
    
    toast.appendChild(container);
    
    // NÃO auto-remove aqui, controle manual
    updateToast(toast, mensagem, "info", 0);
    
    btnConfirmar.onclick = () => {
      updateToast(toast, "Confirmado", "sucesso");
      setTimeout(() => {
        toast.remove();
      }, 300);
      resolve(true);
    };
    
    btnCancelar.onclick = () => {
      updateToast(toast, "Cancelado", "erro");
      setTimeout(() => {
        toast.remove();
      }, 300);
      resolve(false);
    };
  });
}
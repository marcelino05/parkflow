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
    
    const toast = document.createElement("div");
    toast.classList.add("toast", "confirm");
    
    const texto = document.createElement("p");
    texto.textContent = mensagem;
    
    const actions = document.createElement("div");
    actions.classList.add("toast-actions");
    
    const btnConfirmar = document.createElement("button");
    btnConfirmar.classList.add("btn-confirm");
    btnConfirmar.textContent = "Confirmar";
    
    const btnCancelar = document.createElement("button");
    btnCancelar.classList.add("btn-cancel");
    btnCancelar.textContent = "Cancelar";
    
    actions.appendChild(btnConfirmar);
    actions.appendChild(btnCancelar);
    
    toast.appendChild(texto);
    toast.appendChild(actions);
    
    // IMPORTANTE: NÃO usa container de toast normal
    document.body.appendChild(toast);
    
    btnConfirmar.onclick = () => {
      toast.remove();
      resolve(true);
    };
    
    btnCancelar.onclick = () => {
      toast.remove();
      resolve(false);
    };
  });
}
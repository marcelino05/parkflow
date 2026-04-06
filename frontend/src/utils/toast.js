// TOAST 

let toastContainer = null;

const getContainer = () => {
  if (!toastContainer) {
    toastContainer = document.createElement("div");
    toastContainer.className = "toast-container";
    document.body.appendChild(toastContainer);
  }
  return toastContainer;
};

// CRIAR TOAST
export const createToast = (msg, tipo = "info") => {
  const container = getContainer();
  
  // cria sempre novo toast (evita bugs de duplicação)
  const div = document.createElement("div");
  div.className = "toast " + tipo;
  div.textContent = msg;
  
  container.appendChild(div);
  
  // remove automático (exceto confirmação que controla isso)
  removeToast(div);
  
  return div;
};

// ATUALIZAR TOAST 
export const updateToast = (toast, msg, tipo = "info") => {
  if (!toast) return;
  
  toast.textContent = msg;
  toast.className = "toast " + tipo;
};

// REMOVER TOAST
export const removeToast = (toast, tempo = 5000) => {
  if (!toast) return;
  
  setTimeout(() => {
    toast.classList.add("saindo");
    
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, tempo);
};

const removerAgora = (toast) => {
  if (!toast) return;
  
  toast.classList.add("saindo");
  
  setTimeout(() => {
    toast.remove();
  }, 300);
};

export function confirmarToast(mensagem) {
  return new Promise((resolve) => {
    const toast = createToast(mensagem, "info");
    
    if (!toast) {
      resolve(false);
      return;
    }
    
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
    
    // CONFIRMAR → some imediatamente
    btnConfirmar.onclick = () => {
      removerAgora(toast);
      resolve(true);
    };
    
    // CANCELAR → some imediatamente
    btnCancelar.onclick = () => {
      removerAgora(toast);
      resolve(false);
    };
  });
}
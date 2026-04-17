  // TOAST ÚNICO (GLOBAL)
  let toastInstance = null;
  let removeTimeout = null;
  
  // CONTAINER
  let toastContainer = null;
  
  const getContainer = () => {
    if (!toastContainer) {
      toastContainer = document.createElement("div");
      toastContainer.className = "toast-container";
      document.body.appendChild(toastContainer);
      
    }
    
    return toastContainer;
    
  };
  
  
  
  // CRIAR TOAST (SÓ 1)
  export const createToast = (msg = "", tipo = "info", tempo = 2500) => {
    const container = getContainer();
    
    // se já existe, só atualiza
    if (toastInstance) {
      updateToast(toastInstance, msg, tipo, tempo);
      return toastInstance;
      
    }
    
    const div = document.createElement("div");
    div.className = "toast " + tipo;
    div.textContent = msg;
    
    container.appendChild(div);
    toastInstance = div;
    
    updateToast(div, msg, tipo, tempo)
    
    return div;
    
  };
  
  
  
  // ATUALIZAR TOAST (COM AUTO CLOSE)
  export const updateToast = (toast, msg, tipo = "info", tempo = 2500) => {
    const target = toast || toastInstance;
    
    if (!target) return;
    
    // limpa timer anterior (evita bug de múltiplos closes)
    if (removeTimeout) {
      clearTimeout(removeTimeout);
      removeTimeout = null;
      
    }
    
    target.textContent = msg;
    target.className = "toast " + tipo;
    
    // se tempo for 0, não remove
    if (tempo === 0) {
      removeTimeout = null;
      return;
      
    }
    
    removeTimeout = setTimeout(() => {
      if (!toastInstance) return;
      
      toastInstance.classList.add("saindo");
      
      setTimeout(() => {
        toastInstance.remove();
        toastInstance = null;
        
      }, 300);
    }, tempo);
  };
  
  
  
  // REMOVER MANUAL (SE PRECISAR)
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
  
  
  
  // RESET TOTAL (OPCIONAL)
  export const clearToast = () => {
    if (removeTimeout) {
      clearTimeout(removeTimeout);
      removeTimeout = null
      
    }
    
    if (toastInstance) {
      toastInstance.remove();
      toastInstance = null;
      
    }
  };
  
  
  
  //Toast de confirmaçào
  let confirmInstance = null
  
  export function confirmarToast(mensagem) {
    if (confirmInstance) {
      return Promise.resolve(false);
      
    }
    
    return new Promise((resolve) => {
      
      const overlay = document.createElement("div")
      overlay.className = "toast-overlay"
      
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
      overlay.appendChild(toast);
      
      document.body.appendChild(overlay);
      
      const fechar = (valor) => {
        overlay.remove();
        confirmInstance = null;
        resolve(valor)
        
      }
      
      btnConfirmar.onclick = () => {
        fechar(true);
        
      };
      
      btnCancelar.onclick = () => {
        fechar(false);
        
      };
      
      overlay.onclick = (e) => {
        if (e.target === overlay) {
          fechar(false)
          
        }
      }
    })
  }
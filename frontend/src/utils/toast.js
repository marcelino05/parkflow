
  // TOAST 
  
  let toastContainer = null
  
  const getContainer = () => {
    if (!toastContainer) {
      toastContainer = document.createElement("div")
      toastContainer.className = "toast-container"
      document.body.appendChild(toastContainer)
    }
    
    return toastContainer
  }
  
  // CRIAR TOAST
  export const createToast = (msg, tipo = "info") => {
    const container = getContainer()
    
    // Tenta encontrar um toast ativo do mesmo tipo
    let div = container.querySelector(`.toast.${tipo}`)
    
    if (div) {
      div.textContent = msg
    } else {
      div = document.createElement("div")
      div.className = "toast " + tipo
      div.textContent = msg
      container.appendChild(div)
      
      removeToast(div)
    }
    
    return div
  }
  
  // ATUALIZAR TOAST 
  export const updateToast = (toast, msg, tipo = "info") => {
    if (!toast) return
    toast.textContent = msg
    toast.className = "toast " + tipo
  }
  // REMOVER TOAST
  export const removeToast = (toast) => {
    if (!toast) return
    setTimeout(() => {
      toast.remove()
    }, 5000)
  }
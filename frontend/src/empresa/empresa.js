import { createToast, updateToast, removeToast } from "../utils/toast.js"

const token = localStorage.getItem("token")

if (!token) {
  window.location.href = "../auth/auth.html"
}

document.getElementById("empresaForm").addEventListener("submit", (e) => {
  e.preventDefault()
  createCompany()
})

/* =========================
   CRIAR EMPRESA
========================= */
const createCompany = async () => {
  const companyName = document.getElementById("name").value
  const companyEmail = document.getElementById("email").value
  const companyPhone = document.getElementById("phone").value
  const companyAddress = document.getElementById("address").value
  
  //  Validações
  const validName = validateCompanyName(companyName)
  const validEmail = validateCompanyEmail(companyEmail)
  const validPhone = validateCompanyPhone(companyPhone)
  const validAddress = validateCompanyAddress(companyAddress)
  
  // Nome
  if (!validName.valid) {
    return createToast(validName.errors[0], "erro")
  }
  
  // Email
  if (validEmail) {
    return createToast(validEmail, "erro")
  }
  
  // Telefone
  if (validPhone) {
    return createToast(validPhone, "erro")
  }
  
  //  Endereço
  if (validAddress) {
    return createToast(validAddress, "erro")
  }
  
  //  Enviar para API
  await sendCompanyToAPI({
    nome: companyName.trim(),
    email: companyEmail.trim(),
    telefone: companyPhone.trim(),
    endereco: companyAddress.trim()
  })
}

/* =========================
   VALIDAÇÕES
========================= */

const validateCompanyName = (name) => {
  const errors = []
  
  if (typeof name !== "string") {
    return { valid: false, errors: ["Nome inválido"] }
  }
  
  const trimmed = name.trim()
  
  if (!trimmed) {
    errors.push("Nome da empresa é obrigatório")
  }
  
  if (trimmed.length < 3) {
    errors.push("Nome deve ter pelo menos 3 caracteres")
  }
  
  if (trimmed.length > 50) {
    errors.push("Nome muito longo")
  }
  
  const regex = /^[a-zA-ZÀ-ÿ0-9\s]+$/
  
  if (!regex.test(trimmed)) {
    errors.push("Nome contém caracteres inválidos")
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

const validateCompanyEmail = (email) => {
  if (!email) return "Email obrigatório"
  
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  
  if (!regex.test(email)) return "Email inválido"
  
  return null
}

const validateCompanyPhone = (phone) => {
  if (typeof phone !== "string") return "Telefone inválido"
  
  let value = phone.trim()
  
  if (!value) return "Telefone obrigatório"
  
  // Remove código do país
  if (value.startsWith("+258")) {
    value = value.slice(4)
  } else if (value.startsWith("258")) {
    value = value.slice(3)
  }
  
  const regex = /^(82|83|84|85|86|87)\d{7}$/
  
  if (!regex.test(value)) return "Telefone inválido"
  
  return null
}

const validateCompanyAddress = (address) => {
  if (typeof address !== "string") return "Endereço inválido"
  
  const value = address.trim()
  
  if (!value) return "Endereço obrigatório"
  
  if (value.length < 5) return "Endereço muito curto"
  
  if (value.length > 100) return "Endereço muito longo"
  
  return null
}

/* =========================
PI
========================= */

const sendCompanyToAPI = async (data) => {
  const toastId = createToast("A criar empresa...", "info")
  
  try {
    const response = await fetch("http://localhost:5000/api/company", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("token")}`
      },
      body: JSON.stringify(data)
    })
    
    const result = await response.json()
    
    if (!response.ok) {
      updateToast(toastId, result.message || "Erro ao criar empresa", "erro")
      return
    }
    
    updateToast(toastId, "Empresa criada com sucesso", "sucesso")
      //  guardar token
  if (!data.token) return
  
  if (data.token) {
    localStorage.setItem("token", data.token);
    // opcional: mostrar mensagem de sucesso aqui
    setTimeout(() => {
      window.location.href = "../dashboard/dashboard.html";
    }, 1500);
  } else {
    console.error("Token não recebido");
  }
  
    clearfields("empresaForm")
    
  } catch (error) {
    updateToast(toastId, "Erro de conexão com a API", "erro")
    console.error(error)
  }
}

/* =========================
   LIMPAR FORMULÁRIO
========================= */

const clearfields = (formId) => {
  const form = document.getElementById(formId)
  if (form) form.reset()
}
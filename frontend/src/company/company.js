import { request, getSession, logOut, setSession } from "../utils/main.js";
import { createToast, updateToast } from "../utils/toast.js";

/* =========================
   PROTEÇÃO
========================= */
const { token } = getSession();

if (!token) {
  logOut();
}

/* =========================
   FORM SUBMIT
========================= */
document.getElementById("empresaForm").addEventListener("submit", (e) => {
  e.preventDefault();
  createCompany();
});

/* =========================
   CRIAR EMPRESA
========================= */
const createCompany = async () => {
  
  const companyName = document.getElementById("name").value;
  const companyEmail = document.getElementById("email").value;
  const companyPhone = document.getElementById("phone").value;
  const companyAddress = document.getElementById("address").value;
  
  // VALIDAÇÕES
  const validName = validateCompanyName(companyName);
  const validEmail = validateCompanyEmail(companyEmail);
  const validPhone = validateCompanyPhone(companyPhone);
  const validAddress = validateCompanyAddress(companyAddress);
  
  if (!validName.valid) return createToast(validName.errors[0], "erro");
  if (validEmail) return createToast(validEmail, "erro");
  if (validPhone) return createToast(validPhone, "erro");
  if (validAddress) return createToast(validAddress, "erro");
  
  await sendCompanyToAPI({
    nome: companyName.trim(),
    email: companyEmail.trim(),
    telefone: companyPhone.trim(),
    endereco: companyAddress.trim()
  });
};

/* =========================
   API
========================= */
const sendCompanyToAPI = async (payload) => {
  const toastId = createToast("A criar empresa...", "info");
  
  try {
    const res = await request("/company", "POST", payload);
    
    if (!res.success) {
      return updateToast(toastId, res.message, "erro");
    }
    
    updateToast(toastId, "Empresa criada com sucesso", "sucesso");
    
    // 🔥 se backend devolver token novo
    if (res.token) {
      setSession(res.token, { role: "admin" });
    }
    
    setTimeout(() => {
      window.location.href = "../dashboard/dashboard.html";
    }, 1500);
    
    clearfields("empresaForm");
    
  } catch (error) {
    updateToast(toastId, error.message, "erro");
  }
};

/* =========================
   VALIDAÇÕES
========================= */

const validateCompanyName = (name) => {
  const errors = [];
  
  if (typeof name !== "string") {
    return { valid: false, errors: ["Nome inválido"] };
  }
  
  const trimmed = name.trim();
  
  if (!trimmed) errors.push("Nome da empresa é obrigatório");
  if (trimmed.length < 3) errors.push("Nome deve ter pelo menos 3 caracteres");
  if (trimmed.length > 50) errors.push("Nome muito longo");
  
  const regex = /^[a-zA-ZÀ-ÿ0-9\s]+$/;
  
  if (!regex.test(trimmed)) {
    errors.push("Nome contém caracteres inválidos");
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

const validateCompanyEmail = (email) => {
  if (!email) return "Email obrigatório";
  
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!regex.test(email)) return "Email inválido";
  
  return null;
};

const validateCompanyPhone = (phone) => {
  if (typeof phone !== "string") return "Telefone inválido";
  
  let value = phone.trim();
  
  if (!value) return "Telefone obrigatório";
  
  // remove +258 ou 258
  if (value.startsWith("+258")) value = value.slice(4);
  else if (value.startsWith("258")) value = value.slice(3);
  
  const regex = /^(82|83|84|85|86|87)\d{7}$/;
  
  if (!regex.test(value)) return "Telefone inválido";
  
  return null;
};

const validateCompanyAddress = (address) => {
  if (typeof address !== "string") return "Endereço inválido";
  
  const value = address.trim();
  
  if (!value) return "Endereço obrigatório";
  if (value.length < 5) return "Endereço muito curto";
  if (value.length > 100) return "Endereço muito longo";
  
  return null;
};

/* =========================
   LIMPAR FORM
========================= */
const clearfields = (formId) => {
  const form = document.getElementById(formId);
  if (form) form.reset();
};
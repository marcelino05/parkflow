import { request, setSession } from "../utils/main.js";
import { createToast, updateToast } from "../utils/toast.js";

document.addEventListener("DOMContentLoaded", () => {
  const formRegister = document.getElementById("formRegister");
  const formLogin = document.getElementById("form-login");
  
  if (formRegister) {
    formRegister.addEventListener("submit", e => {
      e.preventDefault();
      register();
    });
  }
  
  if (formLogin) {
    formLogin.addEventListener("submit", e => {
      e.preventDefault();
      login();
    });
  }
});

/* =========================
   REGISTER
========================= */
const register = async () => {
  const name = document.getElementById("nameRegister").value.toLowerCase().trim();
  const phone = document.getElementById("telephone").value.trim();
  const email = document.getElementById("emailRegister").value.toLowerCase().trim();
  const password = document.getElementById("passwordRegister").value.trim();
  
  const error =
    validateName(name) ||
    validatePhone(phone) ||
    validateEmail(email) ||
    validatePassword(password);
  
  if (error) return createToast(error, "erro");
  
  const toast = createToast("A processar...", "info");
  
  try {
    const res = await request("/auth/registrar", "POST", {
      nome: name,
      telefone: phone,
      email,
      senha: password
    });
    
    if (!res.success) {
      return updateToast(toast, res.message, "erro");
    }
    
    updateToast(toast, "Cadastrado com sucesso", "sucesso");
    
    // 🔥 salvar sessão
    if (res.token) {
      setSession(res.token, { role: "admin" });
      
      setTimeout(() => {
        window.location.href = "../company/company.html";
      }, 1500);
    }
    
    clearfields("formRegister");
    
  } catch (error) {
    updateToast(toast, error.message, "erro");
  }
};

/* =========================
   LOGIN
========================= */
const login = async () => {
  const email = document.getElementById("emailLogin").value.toLowerCase().trim();
  const password = document.getElementById("passwordLogin").value.trim();
  
  const error = validateEmail(email) || validatePassword(password);
  
  if (error) return createToast(error, "erro");
  
  const toast = createToast("A processar...", "info");
  
  try {
    const res = await request("/auth/login", "POST", {
      email,
      senha: password
    });
    
    if (!res.success) {
      return updateToast(toast, res.message, "erro");
    }
    
    const user = res.usuario;
    // 🔥 salvar sessão
    setSession(res.token, user);
    
    updateToast(toast, "Login realizado com sucesso!", "sucesso");
    
    setTimeout(() => {
      if (user.role === "admin") {
        window.location.href = "../dashboard/dashboard.html";
      } else {
        window.location.href = "../session/sessao.html";
      }
    }, 1500);
    
    clearfields("form-login");
    
  } catch (error) {
    updateToast(toast, error.message, "erro");
  }
};

/* =========================
   VALIDAÇÕES
========================= */

const validateEmail = (email) => {
  if (!email) return "Email obrigatório";
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!regex.test(email)) return "Email inválido";
  return null;
};

const validateName = (name) => {
  if (typeof name !== "string") return "Nome inválido";
  
  name = name.trim();
  
  if (!name) return "Nome obrigatório";
  if (name.length < 2) return "Nome deve ter no mínimo 2 caracteres";
  if (name.length > 50) return "Nome excede o limite";
  
  return null;
};

const validatePassword = (password) => {
  if (typeof password !== "string") return "Senha inválida";
  
  password = password.trim();
  
  if (!password) return "Senha obrigatória";
  if (password.length < 6) return "Senha muito curta";
  if (password.length > 30) return "Senha muito longa";
  
  const regex = /^(?=.*[A-Za-z])(?=.*\d).+$/;
  if (!regex.test(password)) {
    return "Senha deve conter letras e números";
  }
  
  return null;
};

const validatePhone = (phone) => {
  if (typeof phone !== "string") return "Telefone inválido";
  
  phone = phone.trim();
  
  if (!phone) return "Telefone obrigatório";
  
  let value = phone;
  
  if (value.startsWith("+258")) value = value.slice(4);
  else if (value.startsWith("258")) value = value.slice(3);
  
  const regex = /^(82|83|84|85|86|87)\d{7}$/;
  
  if (!regex.test(value)) return "Telefone inválido";
  
  return null;
};

/* =========================
   LIMPAR FORM
========================= */
const clearfields = (formId) => {
  const form = document.getElementById(formId);
  if (form) form.reset();
};
  export const API_BASE = "http://localhost:5000/api";
  
  export function setSession(token, user) {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify({ role: user.role }));
    
  }
  
  export function getSession() {
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user") || "null");
    
    return { token, user };
  }
  
  export function clearSession() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    
  }
  
  export function logOut() {
    clearSession();
    window.location.href = "../auth/auth.html";
    
  }
  
  // PERMISSÕES
  export function applyPermissions(user) {
    if (!user) return;
    
    if (user.role === "operador") {
      document
        .querySelectorAll(".only-admin")
        .forEach(el => el.remove());
      document
        .querySelectorAll(".admin")
        .forEach(el => el.style.display = "none");
      
    }
    
    if (user.role === "admin") {
      document
        .querySelectorAll(".admin-select")
        .forEach(el => (el.style.display = "block"));
      
    }
  }
  
  /* =========================
     REQUEST GLOBAL (PADRÃO SAAS)
  ========================= */
  export async function request(endpoint, method = "GET", body = null) {
    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: body ? JSON.stringify(body) : null
      });
      
      const data = await res.json().catch(() => null);

      if (res.status === 401) {
        clearSession();
        window.location.href = "../auth/auth.html";
        return;
      }
      
      if (!res.ok || !data || data.success === false) {
        return {
          success: false,
          message: data?.message || "Erro na requisição",
          data: null
        };
      }
      return data;
      
    } catch (err) {
      return {
        success: false,
        message: "Erro de conexão com servidor",
        data: null
      };
    }
  }
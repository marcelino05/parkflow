import { createToast, updateToast } from "../utils/toast.js";

document.addEventListener("DOMContentLoaded", async () => {
  
  const token = localStorage.getItem("token");
  
  // ==============================
  // SEM TOKEN → LOGIN
  // ==============================
  if (!token) {
    createToast("Acesso negado. Faça login", "erro");
    
    setTimeout(() => {
      window.location.href = "../auth/auth.html";
    }, 1500);
    
    return;
  }
  
  // ==============================
  // ELEMENTOS
  // ==============================
  const companyName = document.getElementById("companyName");
  const companyOwner = document.getElementById("companyOwner");
  const companyEmail = document.getElementById("companyEmail");
  const companyPhone = document.getElementById("companyPhone");
  const companyAddress = document.getElementById("companyAddress");
  
  const companyPlanoNome = document.getElementById("companyPlanoNome");
  const companyPlanoAtivo = document.getElementById("companyPlanoAtivo");
  const companyDiasRestantes = document.getElementById("companyDiasRestantes");
  
  const companyPlanoInicio = document.getElementById("companyPlanoInicio");
  const companyPlanoFim = document.getElementById("companyPlanoFim");
  
  const barParking = document.getElementById("barParking");
  const barOperators = document.getElementById("barOperators");
  const barSpots = document.getElementById("barSpots");
  
  const textParking = document.getElementById("textParking");
  const textOperators = document.getElementById("textOperators");
  const textSpots = document.getElementById("textSpots");
  
  // ==============================
  // MODAL
  // ==============================
  const modal = document.getElementById("companyModal");
  const btnEdit = document.getElementById("btnEditCompany");
  const btnCancel = document.getElementById("btnCancel");
  const btnSave = document.getElementById("btnSave");
  
  const inputName = document.getElementById("inputName");
  const inputEmail = document.getElementById("inputEmail");
  const inputPhone = document.getElementById("inputPhone");
  const inputAddress = document.getElementById("inputAddress");
  
  const errorName = document.getElementById("errorName");
  const errorEmail = document.getElementById("errorEmail");
  const errorPhone = document.getElementById("errorPhone");
  const errorAddress = document.getElementById("errorAddress");
  
  // ==============================
  // LIMPAR ERROS
  // ==============================
  function limparErros() {
    errorName.textContent = "";
    errorEmail.textContent = "";
    errorPhone.textContent = "";
    errorAddress.textContent = "";
    
    inputName.classList.remove("input-error");
    inputEmail.classList.remove("input-error");
    inputPhone.classList.remove("input-error");
    inputAddress.classList.remove("input-error");
  }
  
  // ==============================
  // VALIDAR
  // ==============================
  function validar() {
    let valido = true;
    
    limparErros();
    
    if (!inputName.value.trim()) {
      errorName.textContent = "Nome obrigatório";
      inputName.classList.add("input-error");
      valido = false;
    }
    
    if (!inputEmail.value.trim()) {
      errorEmail.textContent = "Email obrigatório";
      inputEmail.classList.add("input-error");
      valido = false;
    }
    
    if (!inputPhone.value.trim()) {
      errorPhone.textContent = "Telefone obrigatório";
      inputPhone.classList.add("input-error");
      valido = false;
    }
    
    if (!inputAddress.value.trim()) {
      errorAddress.textContent = "Endereço obrigatório";
      inputAddress.classList.add("input-error");
      valido = false;
    }
    
    return valido;
  }
  
  // ==============================
  // CARREGAR EMPRESA
  // ==============================
  async function carregarEmpresa() {
    
    const toastId = createToast("A carregar empresa...", "info");
    
    try {
      const [resEmpresa, resStatus] = await Promise.all([
        fetch("http://localhost:5000/api/company", {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }),
        fetch("http://localhost:5000/api/company/status", {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })
      ]);
      
      if (resEmpresa.status === 401 || resStatus.status === 401) {
        localStorage.removeItem("token");
        
        updateToast(toastId, "Sessão inválida. Faça login novamente", "erro");
        
        setTimeout(() => {
          window.location.href = "../auth/auth.html";
        }, 1500);
        
        return;
      }
      
      const dataEmpresa = await resEmpresa.json();
      const dataStatus = await resStatus.json();
      
      if (!dataEmpresa.success || !dataStatus.success) {
        throw new Error("Erro na API");
      }
      
      const empresa = dataEmpresa.empresa;
      
      companyName.textContent = empresa.nome;
      companyOwner.textContent = dataEmpresa.nomeProprietario;
      companyEmail.textContent = empresa.email;
      companyPhone.textContent = empresa.telefone;
      companyAddress.textContent = empresa.endereco;
      
      companyPlanoNome.textContent = dataStatus.plano;
      companyPlanoAtivo.textContent = dataStatus.status;
      
      // limpar classes antes
      companyPlanoAtivo.classList.remove("sucesso", "erro");
      
      // aplicar cor conforme status
      if (dataStatus.status === "ativo") {
        companyPlanoAtivo.classList.add("sucesso");
      } else {
        companyPlanoAtivo.classList.add("erro");
      }
      companyDiasRestantes.textContent = dataStatus.diasRestantes;
      const dias = Number(companyDiasRestantes.textContent);
      
      // limpa classes antes
      companyDiasRestantes.classList.remove("alerta-laranja", "alerta-vermelho");
      
      // aplica cor conforme valor
      if (dias <= 3) {
        companyDiasRestantes.classList.add("alerta-vermelho");
      }
      else if (dias <= 7) {
        companyDiasRestantes.classList.add("alerta-laranja");
      }
      
      companyPlanoInicio.textContent = formatarData(empresa.trialInicio);
      companyPlanoFim.textContent = formatarData(empresa.trialFim);
      
      atualizarBarra(barParking, textParking, empresa.limites.maxEstacionamentos);
      atualizarBarra(barOperators, textOperators, empresa.limites.maxOperadores);
      atualizarBarra(barSpots, textSpots, empresa.limites.maxVagas);
      
      updateToast(toastId, "Empresa carregada com sucesso", "sucesso");
      
    } catch (error) {
      console.error(error);
      updateToast(toastId, "Erro ao carregar empresa", "erro");
    }
  }
  
  function atualizarBarra(barra, texto, total) {
    
    const usados = 0;
    
    const percent = total === 0 ? 0 : (usados / total) * 100;
    
    barra.style.width = percent + "%";
    texto.textContent = `${usados} / ${total}`;
    
    if (percent < 50) barra.style.background = "green";
    else if (percent < 80) barra.style.background = "orange";
    else barra.style.background = "red";
  }
  
  function formatarData(data) {
    return new Date(data).toLocaleDateString("pt-MZ");
  }
  
  // ==============================
  // ABRIR MODAL
  // ==============================
  btnEdit.addEventListener("click", () => {
    
    inputName.value = companyName.textContent;
    inputEmail.value = companyEmail.textContent;
    inputPhone.value = companyPhone.textContent;
    inputAddress.value = companyAddress.textContent;
    
    modal.classList.add("show");
  });
  
  // ==============================
  // FECHAR MODAL
  // ==============================
  btnCancel.addEventListener("click", () => {
    modal.classList.remove("show");
  });
  
  // ==============================
  // SALVAR
  // ==============================
  btnSave.addEventListener("click", async () => {
    
    if (!validar()) {
      createToast("Preencha corretamente os campos", "erro");
      return;
    }
    
    const toastId = createToast("A guardar empresa...", "info");
    
    try {
      
      const res = await fetch("http://localhost:5000/api/company", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          nome: inputName.value,
          email: inputEmail.value,
          telefone: inputPhone.value,
          endereco: inputAddress.value
        })
      });
      
      const text = await res.text();
      
      let data = null;
      
      try {
        data = JSON.parse(text);
      } catch {}
      
      if (!res.ok) {
        throw new Error("Erro HTTP: " + res.status);
      }
      
      if (data && data.success === false) {
        throw new Error(data.message || "Erro ao atualizar empresa");
      }
      
      updateToast(toastId, "Empresa atualizada com sucesso", "sucesso");
      
      modal.classList.remove("show");
      
      companyName.textContent = inputName.value;
      companyEmail.textContent = inputEmail.value;
      companyPhone.textContent = inputPhone.value;
      companyAddress.textContent = inputAddress.value;
      
    } catch (error) {
      updateToast(toastId, error.message || "Erro ao atualizar empresa", "erro");
    }
  });
  
  // ==============================
  // INICIALIZAR
  // ==============================
  carregarEmpresa();
  
});
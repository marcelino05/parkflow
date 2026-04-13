import { request, getSession, logOut } from "../utils/main.js";
import { createToast, updateToast } from "../utils/toast.js";

document.addEventListener("DOMContentLoaded", async () => {
  
  /* ==============================
     AUTH
  ============================== */
  const session = getSession();
  
  if (!session?.token || !session?.user) {
    createToast("Acesso negado. Faça login", "erro");
    
    setTimeout(() => {
      logOut();
    }, 1500);
    
    return;
  }
  
  const { user } = session;
  
  if (user.role !== "admin") {
    window.location.href = "../session/sessao.html";
    return;
  }
  
  /* ==============================
     ELEMENTOS
  ============================== */
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
  
  /* ==============================
     MODAL
  ============================== */
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
  
  /* ==============================
     UTIL
  ============================== */
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
  
  function formatarData(data) {
    return new Date(data).toLocaleDateString("pt-MZ");
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
  
  /* ==============================
     CARREGAR EMPRESA
  ============================== */
  async function carregarEmpresa() {
    const toastId = createToast("Carregando dados da empresa...", "info");
    
    try {
      const planoEmpresa = await request("/company/status");
      const dadosEmpresa = await request("/company");
      const resUso = await request("/company/uso");
      const uso = resUso?.uso;
      
      if (!dadosEmpresa?.success || !planoEmpresa?.success) {
        throw new Error("Erro ao carregar dados da empresa");
      }
      
      const empresa = dadosEmpresa?.empresa;
      
      if (!empresa) {
        throw new Error("Empresa não encontrada");
      }
      
      companyName.textContent = empresa.nome;
      companyOwner.textContent = empresa?.proprietarioId?.nome || "-";
      companyEmail.textContent = empresa.email;
      companyPhone.textContent = empresa.telefone;
      companyAddress.textContent = empresa.endereco;
      
      companyPlanoNome.textContent = planoEmpresa.plano;
      companyPlanoAtivo.textContent = planoEmpresa.status;
      
      companyPlanoAtivo.classList.remove("sucesso", "erro");
      
      if (planoEmpresa.status === "ativo") {
        companyPlanoAtivo.classList.add("sucesso");
      } else {
        companyPlanoAtivo.classList.add("erro");
      }
      
      const dias = Number(planoEmpresa.diasRestantes || 0);
      companyDiasRestantes.textContent = `${dias} dias`;
      
      companyDiasRestantes.classList.remove("alerta-laranja", "alerta-vermelho");
      
      if (dias <= 3) {
        companyDiasRestantes.classList.add("alerta-vermelho");
      } else if (dias <= 7) {
        companyDiasRestantes.classList.add("alerta-laranja");
      }
      
      companyPlanoInicio.textContent = formatarData(empresa.criadoEm);
      companyPlanoFim.textContent = formatarData(empresa.dataExpiracaoPlano);
      
      function atualizarBarra(barra, texto, total, usados) {
        const percent = total === 0 ? 0 : (usados / total) * 100;
        
        barra.style.width = percent + "%";
        texto.textContent = `${usados} / ${total}`;
        
        if (percent < 50) barra.style.background = "green";
        else if (percent < 80) barra.style.background = "orange";
        else barra.style.background = "red";
      }
      //ESTACIONAMENTO
      atualizarBarra(
        barParking,
        textParking,
        uso?.estacionamentos?.limite || 0,
        uso?.estacionamentos?.usado || 0
      );
      
      //OPERADORES
      
      atualizarBarra(
        barOperators,
        textOperators,
        uso?.operadores?.limite || 0,
        uso?.operadores?.usado || 0
      );
      
      
      //VAGAS
      atualizarBarra(
        barSpots,
        textSpots,
        uso?.vagas?.limite || 0,
        uso?.vagas?.usado || 0
      );
      
      updateToast(toastId, "Empresa carregada com sucesso", "sucesso");
      
    } catch (error) {
      console.error(error);
      updateToast(toastId, error.message, "erro");
    }
  }
  
  /* ==============================
     MODAL
  ============================== */
  btnEdit?.addEventListener("click", () => {
    limparErros();
    
    inputName.value = companyName.textContent;
    inputEmail.value = companyEmail.textContent;
    inputPhone.value = companyPhone.textContent;
    inputAddress.value = companyAddress.textContent;
    
    modal.classList.add("show");
  });
  
  btnCancel?.addEventListener("click", () => {
    modal.classList.remove("show");
  });
  
  /* ==============================
     SALVAR
  ============================== */
  btnSave?.addEventListener("click", async () => {
    
    if (!validar()) {
      createToast("Preencha corretamente os campos", "erro");
      return;
    }
    
    btnSave.disabled = true;
    
    const toastId = createToast("A guardar empresa...", "info");
    
    try {
      const res = await request("/company", "PUT", {
        nome: inputName.value,
        email: inputEmail.value,
        telefone: inputPhone.value,
        endereco: inputAddress.value
      });
      
      if (!res?.success) {
        throw new Error(res?.message || "Erro ao atualizar empresa");
      }
      
      updateToast(toastId, "Empresa atualizada com sucesso", "sucesso");
      
      modal.classList.remove("show");
      
      companyName.textContent = inputName.value;
      companyEmail.textContent = inputEmail.value;
      companyPhone.textContent = inputPhone.value;
      companyAddress.textContent = inputAddress.value;
      
    } catch (error) {
      updateToast(toastId, error.message, "erro");
    } finally {
      btnSave.disabled = false;
    }
  });
  
  /* ==============================
     INIT
  ============================== */
  carregarEmpresa();
  
});
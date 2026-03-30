  /*ANIMAÇÃO NO HERO*/
  export function typingEffect(elementId, frases, velocidade = 120, pausa = 1500) {
    let fraseIndex = 0;
    let letraIndex = 0;
    let apagando = false;
    
    const elemento = document.getElementById(elementId);
    
    function animar() {
      const fraseAtual = frases[fraseIndex];
      
      if (!apagando) {
        elemento.textContent = fraseAtual.substring(0, letraIndex + 1);
        letraIndex++;
        
        if (letraIndex === fraseAtual.length) {
          apagando = true;
          setTimeout(animar, pausa);
          return;
        }
      } else {
        elemento.textContent = fraseAtual.substring(0, letraIndex - 1);
        letraIndex--;
        
        if (letraIndex === 0) {
          apagando = false;
          fraseIndex = (fraseIndex + 1) % frases.length;
        }
      }
      
      setTimeout(animar, apagando ? 30 : velocidade);
    }
    
    animar();
  }
  
  
  typingEffect("typing", [
    "Mais controlo, menos perdas no seu estacionamento",
    "Automatize operações em tempo real",
    "Aumente sua receita sem complicação"
  ]);
  
  /*CONFIG NAVBAR*/
 document.addEventListener("DOMContentLoaded", () => {
  
  /* MENU TOGGLE */
  const menuToggle = document.getElementById("menu-toggle");
  const navLinks = document.getElementById("nav-links");
  
  if (menuToggle && navLinks) {
    menuToggle.addEventListener("click", () => {
      navLinks.classList.toggle("active");
      
      const icon = menuToggle.querySelector("i");
      if (icon) {
        icon.classList.toggle("bi-list");
        icon.classList.toggle("bi-x");
      }
    });
  }
  
  /* TEMA */
  const toggleTheme = document.getElementById("toggle-theme");
  
  if (toggleTheme) {
    const body = document.body;
    const icon = toggleTheme.querySelector("i");
    const texto = toggleTheme.querySelector("span");
    
    toggleTheme.addEventListener("click", (e) => {
      e.preventDefault();
      
      body.classList.toggle("dark");
      
      if (body.classList.contains("dark")) {
        icon?.classList.remove("bi-moon");
        icon?.classList.add("bi-sun");
        
        if (texto) texto.textContent = " Modo Claro";
        
        localStorage.setItem("tema", "dark");
        
      } else {
        icon?.classList.remove("bi-sun");
        icon?.classList.add("bi-moon");
        
        if (texto) texto.textContent = " Modo Escuro";
        
        localStorage.setItem("tema", "light");
      }
    });
  }
  
  /* CARREGAR TEMA SALVO */
  const tema = localStorage.getItem("tema");
  
  if (tema === "dark") {
    document.body.classList.add("dark");
    
    const toggleTheme = document.getElementById("toggle-theme");
    if (toggleTheme) {
      const icon = toggleTheme.querySelector("i");
      const texto = toggleTheme.querySelector("span");
      
      icon?.classList.remove("bi-moon");
      icon?.classList.add("bi-sun");
      
      if (texto) texto.textContent = " Modo Claro";
    }
  }
  
});
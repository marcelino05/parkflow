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
  const menuToggle = document.getElementById("menu-toggle");
  const navLinks = document.getElementById("nav-links");
  
  menuToggle.addEventListener("click", () => {
    navLinks.classList.toggle("active");
    
    // trocar ícone entre ☰ e ✖
    const icon = menuToggle.querySelector('i');
    icon.classList.toggle('bi-list');
    icon.classList.toggle('bi-x');
    i.classList.add("icor")
  });
  
  //MUDAR TEMA
  document.getElementById("toggle-theme").addEventListener("click", e => {
    
    e.preventDefault()
    
    
  })
  
  // Seleciona o botão
  const toggleTheme = document.getElementById("toggle-theme");
  const body = document.body;
  const icon = toggleTheme.querySelector("i");
  
  const texto = toggleTheme.querySelector("span");
  
  toggleTheme.addEventListener("click", (e) => {
    e.preventDefault();
    
    body.classList.toggle("dark");
    
    if (body.classList.contains("dark")) {
      icon.classList.remove("bi-moon");
      icon.classList.add("bi-sun");
      texto.textContent = " Modo Claro";
    } else {
      icon.classList.remove("bi-sun");
      icon.classList.add("bi-moon");
      texto.textContent = " Modo Escuro";
    }
  });
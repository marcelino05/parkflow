document.addEventListener("DOMContentLoaded", () => {
  
  const themeBtn = document.getElementById("themeBtn");
  
  /* CARREGAR TEMA SALVO */
  const temaSalvo = localStorage.getItem("tema");
  
  if (temaSalvo === "dark") {
    document.body.classList.add("dark");
    
    if (themeBtn) {
      themeBtn.classList.remove("bi-moon");
      themeBtn.classList.add("bi-sun");
    }
  }
  
  /* BOTÃO DE TROCAR TEMA */
  if (themeBtn) {
    themeBtn.addEventListener("click", () => {
      
      document.body.classList.toggle("dark");
      
      const isDark = document.body.classList.contains("dark");
      
      if (isDark) {
        themeBtn.classList.remove("bi-moon");
        themeBtn.classList.add("bi-sun");
        localStorage.setItem("tema", "dark");
      } else {
        themeBtn.classList.remove("bi-sun");
        themeBtn.classList.add("bi-moon");
        localStorage.setItem("tema", "light");
      }
      
    });
  }
  
});
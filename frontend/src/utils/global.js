document.addEventListener("DOMContentLoaded", () => {
  
  // =====================
  // THEME
  // =====================
  const themeBtn = document.getElementById("themeBtn");
  
  const temaSalvo = localStorage.getItem("tema");
  
  if (temaSalvo === "dark") {
    document.body.classList.add("dark");
    
    if (themeBtn) {
      themeBtn.classList.remove("bi-moon");
      themeBtn.classList.add("bi-sun");
    }
  }
  
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
  
  // =====================
  // MENU
  // =====================
  const btnMenu = document.getElementById("btn-menu");
  const sidebar = document.getElementById("sidebar");
  
  if (btnMenu && sidebar) {
    
    const icon = btnMenu.querySelector("i");
    
    btnMenu.onclick = () => {
      sidebar.classList.toggle("active");
      
      if (sidebar.classList.contains("active")) {
        icon?.classList.replace("bi-list", "bi-x");
      } else {
        icon?.classList.replace("bi-x", "bi-list");
      }
    };
    
  }
  
});
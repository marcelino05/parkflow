// MENU
const btnMenu = document.getElementById("btn-menu")
const sidebar = document.getElementById("sidebar")
const icon = btnMenu.querySelector("i")

btnMenu.onclick = () => {
  sidebar.classList.toggle("active")
  
  if (sidebar.classList.contains("active")) {
    icon.classList.replace("bi-list", "bi-x")
  } else {
    icon.classList.replace("bi-x", "bi-list")
  }
}

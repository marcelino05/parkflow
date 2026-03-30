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

// GRÁFICOS
const ctx1 = document.getElementById("chart1")
const ctx2 = document.getElementById("chart2")

new Chart(ctx1, {
  type: "line",
  data: {
    labels: ["Seg", "Ter", "Qua", "Qui", "Sex", "Sab", "Dom"],
    datasets: [{
      label: "Receita",
      data: [1200, 1900, 800, 1500, 2000, 1700, 2200],
      tension: 0.4
    }]
  }
})

new Chart(ctx2, {
  type: "bar",
  data: {
    labels: ["8h", "10h", "12h", "14h", "16h", "18h"],
    datasets: [{
      label: "Entradas",
      data: [5, 10, 7, 12, 9, 6]
    }]
  }
})


  const API = "http://localhost:5000/api";
  const token = localStorage.getItem("token");
  
  // PROTEÇÃO
  if (!token) {
    window.location.href = "../auth/auth.html";
  }
  
  // ===== LOADING =====
  function mostrarLoading() {
    document.getElementById("receita").innerText = "...";
    document.getElementById("ativos").innerText = "...";
    document.getElementById("entradas").innerText = "...";
    document.getElementById("vagas").innerText = "...";
  }
  
  // ===== GRÁFICOS =====
  const chartReceita = new Chart(document.getElementById("chart1"), {
    type: "line",
    data: {
      labels: [],
      datasets: [{
        label: "Receita",
        data: [],
        tension: 0.4
      }]
    }
  });
  
  const chartEntradas = new Chart(document.getElementById("chart2"), {
    type: "bar",
    data: {
      labels: [],
      datasets: [{
        label: "Entradas",
        data: []
      }]
    }
  });
  
  // ===== DASHBOARD (CARDS) =====
  async function carregarDashboard() {
    mostrarLoading();
    
    try {
      const res = await fetch(`${API}/session/dashboard`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      const result = await res.json();
      const data = result.dados;
      document.getElementById("receita").innerText = data.receitaHoje + " MZN";
      document.getElementById("ativos").innerText = data.carrosAtivos;
      document.getElementById("entradas").innerText = data.entradasHoje;
      document.getElementById("vagas").innerText = data.vagasDisponiveis;
      
    } catch (err) {
      console.error("Erro dashboard:", err);
    }
  }
  
  // ===== GRÁFICOS =====
  async function carregarGraficos() {
    try {
      // ===== RECEITA =====
      const resReceita = await fetch(`${API}/session/receita?periodo=7dias`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      const receita = await resReceita.json();
      
      if (receita.success) {
        chartReceita.data.labels = receita.dados.map(d =>
          `${d._id.dia}/${d._id.mes}`
        );
        
        chartReceita.data.datasets[0].data = receita.dados.map(d => d.total);
        chartReceita.update();
      }
      
      // ===== ENTRADAS POR HORA =====
      const resEntradas = await fetch(`${API}/session/entradasPorHora?t=${Date.now()}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      const entradas = await resEntradas.json();
      
      if (entradas.success) {
        
        const mapaHoras = new Array(24).fill(0);
        
        entradas.dados.forEach(d => {
          mapaHoras[d._id.hora] = d.total;
        });
        
        const labels = Array.from({ length: 24 }, (_, i) => `${i}h`);
        
        chartEntradas.data.labels = labels;
        chartEntradas.data.datasets[0].data = mapaHoras;
        
        chartEntradas.update();
      }
      
    } catch (err) {
      console.error("Erro gráficos:", err);
    }
  }
  
  // ===== INIT =====
  carregarDashboard();
  carregarGraficos();
  
  // AUTO REFRESH
  setInterval(() => {
    carregarDashboard();
    carregarGraficos();
  }, 10000);
  
  const getCompanyName = async () => {
  try {
    const res = await fetch(`${API}/company`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    const data = await res.json();
    
    console.log(data);
    
    if (data.success) {
      document.getElementById("companyName").textContent = data.empresa?.nome
      console.log("Empresa:", data.empresa?.nome);
    }
    
  } catch (e) {
    console.error("Erro ao buscar empresa:", e);
  }
};

getCompanyName();
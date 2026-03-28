   //VER SENHA
   const toggles = document.querySelectorAll(".toggle-password")
   
   toggles.forEach(t => {
     t.addEventListener("click", e => {
       
       const input = t.parentElement.querySelector(".password")
       
       if (input.type === "password") {
         input.type = "text"
         t.classList.replace("bi-eye", "bi-eye-slash")
         
       } else {
         input.type = "password"
         t.classList.replace("bi-eye-slash", "bi-eye")
         
       }
       
     })
     
   })
   
   //Transição de sessão 
   const container = document.querySelector(".container")
   const btnLogin = document.querySelector(".btn.login")
   const btnRegister = document.querySelector(".btn.register")
   btnLogin.addEventListener("click", () => {
     container.classList.add("active")
     
   })
   
   btnRegister.addEventListener("click", () => {
     container.classList.remove("active")
     
   })
const btnProfissional = document.getElementById("btn-profissional");
const btnCliente = document.getElementById("btn-cliente");


/* =========================
   SOU PROFISSIONAL
========================= */

btnProfissional.addEventListener("click", () => {

  localStorage.setItem("perfilEscolhido", "profissional");

  window.location.href = "cadastro.html?perfil=profissional";

});


/* =========================
   SOU CLIENTE
========================= */

btnCliente.addEventListener("click", () => {

  localStorage.setItem("perfilEscolhido", "cliente");

  window.location.href = "cadastro.html?perfil=cliente";

});
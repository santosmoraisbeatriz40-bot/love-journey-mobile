const formEsqueci = document.getElementById("form-esqueci");

const inputSenha = document.getElementById("senha");
const inputConfirmarSenha = document.getElementById("confirmar-senha");

const mostrarSenha = document.getElementById("mostrar-senha");

const erroSenha = document.getElementById("erro-senha");
const erroConfirmar = document.getElementById("erro-confirmar");

const botaoRedefinir = document.querySelector(".btn-redefinir");


/* =========================
   MOSTRAR / OCULTAR SENHA
========================= */

mostrarSenha.addEventListener("click", () => {

  const visivel = inputSenha.type === "text";

  inputSenha.type = visivel ? "password" : "text";

  mostrarSenha.innerHTML = visivel
    ? '<i aria-hidden="true" class="fa-solid fa-eye"></i>'
    : '<i aria-hidden="true" class="fa-solid fa-eye-slash"></i>';

  mostrarSenha.setAttribute(
    "aria-label",
    visivel ? "Mostrar senha" : "Ocultar senha"
  );

});


document.querySelectorAll(".botao-olho-esqueci").forEach((botao) => {

  botao.addEventListener("click", () => {

    const idAlvo = botao.getAttribute("data-alvo");

    if (!idAlvo) return;

    const input = document.getElementById(idAlvo);

    const visivel = input.type === "text";

    input.type = visivel ? "password" : "text";

    botao.innerHTML = visivel
      ? '<i aria-hidden="true" class="fa-solid fa-eye"></i>'
      : '<i aria-hidden="true" class="fa-solid fa-eye-slash"></i>';

  });

});


/* =========================
   ERRO
========================= */

function mostrarErro(campo, mensagem, texto) {

  const grupo = campo.closest(".campo-esqueci");

  grupo.classList.remove("campo-erro");

  void grupo.offsetWidth;

  grupo.classList.add("campo-erro");

  mensagem.textContent = texto;
}


function limparErro(campo, mensagem) {

  const grupo = campo.closest(".campo-esqueci");

  grupo.classList.remove("campo-erro");

  mensagem.textContent = "";

}


/* =========================
   LIMPAR ERRO AO DIGITAR
========================= */

inputSenha.addEventListener("input", () => {

  if (inputSenha.value.length >= 8) {
    limparErro(inputSenha, erroSenha);
  }

});


inputConfirmarSenha.addEventListener("input", () => {

  if (
    inputConfirmarSenha.value === inputSenha.value &&
    inputConfirmarSenha.value.length >= 8
  ) {
    limparErro(inputConfirmarSenha, erroConfirmar);
  }

});


/* =========================
   ENVIO
========================= */

formEsqueci.addEventListener("submit", (e) => {

  e.preventDefault();

  let valido = true;

  const senha = inputSenha.value;
  const confirmar = inputConfirmarSenha.value;


  /* Senha */

  if (senha === "") {

    mostrarErro(
      inputSenha,
      erroSenha,
      "Digite uma nova senha."
    );

    valido = false;

  } else if (senha.length < 8) {

    mostrarErro(
      inputSenha,
      erroSenha,
      "A senha deve ter pelo menos 8 caracteres."
    );

    valido = false;

  } else {

    limparErro(inputSenha, erroSenha);

  }


  /* Confirmar senha */

  if (confirmar === "") {

    mostrarErro(
      inputConfirmarSenha,
      erroConfirmar,
      "Confirme sua senha."
    );

    valido = false;

  } else if (confirmar !== senha) {

    mostrarErro(
      inputConfirmarSenha,
      erroConfirmar,
      "As senhas não coincidem."
    );

    valido = false;

  } else {

    limparErro(
      inputConfirmarSenha,
      erroConfirmar
    );

  }


  if (!valido) return;


  /* =========================
     ANIMAÇÃO DE ENVIO
  ========================= */

  botaoRedefinir.disabled = true;

  botaoRedefinir.classList.add("botao-enviando");

  botaoRedefinir.textContent = "Redefinindo...";


  setTimeout(() => {

    window.location.href = "senha-redefinida.html";

  }, 1000);

});
// ==========================================
// LOVE JOURNEY — LOGIN
// ==========================================


// ==========================================
// ELEMENTOS
// ==========================================

const formLogin = document.getElementById("form-login");

const inputEmail = document.getElementById("email");

const inputSenha = document.getElementById("senha");

const mostrarSenha = document.getElementById("mostrar-senha");

const erroEmail = document.getElementById("erro-email");

const erroSenha = document.getElementById("erro-senha");

const lembrar = document.getElementById("lembrar");

const botaoGoogle = document.getElementById("botao-google");

const botaoEntrar = document.querySelector(".btn-entrar");


// ==========================================
// MOSTRAR / OCULTAR SENHA
// ==========================================

if (mostrarSenha) {

  mostrarSenha.addEventListener("click", () => {

    const senhaVisivel = inputSenha.type === "text";

    if (senhaVisivel) {

      inputSenha.type = "password";

      mostrarSenha.innerHTML =
        '<i aria-hidden="true" class="fa-solid fa-eye"></i>';

      mostrarSenha.setAttribute(
        "aria-label",
        "Mostrar senha"
      );

    } else {

      inputSenha.type = "text";

      mostrarSenha.innerHTML =
        '<i aria-hidden="true" class="fa-solid fa-eye-slash"></i>';

      mostrarSenha.setAttribute(
        "aria-label",
        "Ocultar senha"
      );

    }

  });

}


// ==========================================
// VALIDAR E-MAIL
// ==========================================

function emailValido(email) {

  const regra =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  return regra.test(email);

}


// ==========================================
// LIMPAR ERRO
// ==========================================

function limparErro(campo, mensagem) {

  const grupo = campo.closest(".campo-login");

  grupo.classList.remove("campo-erro");

  mensagem.textContent = "";

}


// ==========================================
// MOSTRAR ERRO
// ==========================================

function mostrarErro(campo, mensagem, texto) {

  const grupo = campo.closest(".campo-login");

  grupo.classList.remove("campo-erro");

  void grupo.offsetWidth;

  grupo.classList.add("campo-erro");

  mensagem.textContent = texto;

}


// ==========================================
// VALIDAR E-MAIL AO SAIR DO CAMPO
// ==========================================

inputEmail.addEventListener("blur", () => {

  const email = inputEmail.value.trim();

  if (email === "") {

    mostrarErro(
      inputEmail,
      erroEmail,
      "Digite seu e-mail."
    );

    return;

  }

  if (!emailValido(email)) {

    mostrarErro(
      inputEmail,
      erroEmail,
      "Digite um e-mail válido."
    );

    return;

  }

  limparErro(
    inputEmail,
    erroEmail
  );

});


// ==========================================
// LIMPAR ERRO AO DIGITAR
// ==========================================

inputEmail.addEventListener("input", () => {

  if (inputEmail.value.trim() !== "") {

    limparErro(
      inputEmail,
      erroEmail
    );

  }

});


inputSenha.addEventListener("input", () => {

  if (inputSenha.value !== "") {

    limparErro(
      inputSenha,
      erroSenha
    );

  }

});


// ==========================================
// SUBMIT DO LOGIN
// ==========================================

formLogin.addEventListener("submit", (e) => {

  e.preventDefault();

  let valido = true;

  const email =
    inputEmail.value.trim();

  const senha =
    inputSenha.value;


  // ------------------------------------------
  // E-MAIL
  // ------------------------------------------

  if (email === "") {

    mostrarErro(
      inputEmail,
      erroEmail,
      "Digite seu e-mail."
    );

    valido = false;

  } else if (!emailValido(email)) {

    mostrarErro(
      inputEmail,
      erroEmail,
      "Digite um e-mail válido."
    );

    valido = false;

  } else {

    limparErro(
      inputEmail,
      erroEmail
    );

  }


  // ------------------------------------------
  // SENHA
  // ------------------------------------------

  if (senha === "") {

    mostrarErro(
      inputSenha,
      erroSenha,
      "Digite sua senha."
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

    limparErro(
      inputSenha,
      erroSenha
    );

  }


  // ------------------------------------------
  // PARAR SE HOUVER ERRO
  // ------------------------------------------

  if (!valido) {

    const primeiroErro =
      document.querySelector(".campo-erro");

    if (primeiroErro) {

      primeiroErro.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });

    }

    return;

  }


  // ==========================================
  // LOGIN DEMONSTRAÇÃO
  // ==========================================

  botaoEntrar.disabled = true;

  botaoEntrar.classList.add(
    "botao-enviando"
  );

  botaoEntrar.textContent =
    "Entrando...";


  // ------------------------------------------
  // LEMBRAR E-MAIL
  // ------------------------------------------

  if (lembrar.checked) {

    localStorage.setItem(
      "emailLoveJourney",
      email
    );

  } else {

    localStorage.removeItem(
      "emailLoveJourney"
    );

  }


  // ------------------------------------------
  // SIMULAÇÃO
  // ------------------------------------------

  setTimeout(() => {

    botaoEntrar.classList.remove(
      "botao-enviando"
    );

    botaoEntrar.classList.add(
      "login-sucesso"
    );

    botaoEntrar.innerHTML =
      '<i aria-hidden="true" class="fa-solid fa-check"></i> Entrando!';


    setTimeout(() => {

      window.location.href = localStorage.getItem("perfilEscolhido") === "profissional" ? "dashboard-profissional.html" : "dashboard-casal.html";

    }, 700);

  }, 900);

});


// ==========================================
// RECUPERAR E-MAIL SALVO
// ==========================================

window.addEventListener("DOMContentLoaded", () => {

  const emailSalvo =
    localStorage.getItem(
      "emailLoveJourney"
    );

  if (emailSalvo) {

    inputEmail.value =
      emailSalvo;

    lembrar.checked = true;

  }

});


// ==========================================
// GOOGLE
// ==========================================

if (botaoGoogle) {

  botaoGoogle.addEventListener("click", () => {

    alert(
      "O login com Google será disponibilizado na versão final do Love Journey."
    );

  });

}
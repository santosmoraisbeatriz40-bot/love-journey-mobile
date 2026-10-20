// ============================================
// LOVE JOURNEY — cadastro.js
// Lógica da Tela 2 — Cadastro
// ============================================


// ============================================
// DESCOBRIR PERFIL ESCOLHIDO
// ============================================

const parametros = new URLSearchParams(
  window.location.search
);

const perfil =
  parametros.get("perfil") ||
  localStorage.getItem("perfilEscolhido") ||
  "profissional";

// Salva novamente o perfil escolhido
localStorage.setItem(
  "perfilEscolhido",
  perfil
);


// ============================================
// ELEMENTOS
// ============================================

const tituloCadastro =
  document.getElementById("titulo-cadastro");

const grupoCnpj =
  document.getElementById("grupo-cnpj");

const inputCnpj =
  document.getElementById("cnpj");

const inputEmail =
  document.getElementById("email");

const formCadastro =
  document.getElementById("form-cadastro");

const inputSenha =
  document.getElementById("senha");

const inputConfirmarSenha =
  document.getElementById("confirmar-senha");

const erroSenha =
  document.getElementById("erro-senha");

const linkLogin =
  document.getElementById("link-login");


// ============================================
// CONFIGURAÇÃO DO PERFIL
// ============================================

if (perfil === "cliente") {

  tituloCadastro.textContent =
    "Cadastrar-se como Cliente";

  grupoCnpj.classList.add(
    "escondido"
  );

  inputCnpj.required = false;

} else {

  tituloCadastro.textContent =
    "Cadastrar-se como Profissional";

  inputCnpj.required = true;

}


// ============================================
// LINK PARA LOGIN
// ============================================

if (linkLogin) {

  linkLogin.href =
    `login.html?perfil=${perfil}`;

}


// ============================================
// ANIMAÇÃO DE ENTRADA
// ============================================

window.addEventListener(
  "DOMContentLoaded",
  () => {

    const painelForm =
      document.querySelector(
        ".painel-form"
      );

    const painelVisual =
      document.querySelector(
        ".painel-visual"
      );

    if (painelForm) {

      painelForm.classList.add(
        "animacao-entrada"
      );

    }

    if (painelVisual) {

      painelVisual.classList.add(
        "animacao-visual"
      );

    }

  }
);


// ============================================
// ANIMAÇÃO DOS CAMPOS
// ============================================

const gruposCampo =
  document.querySelectorAll(
    ".grupo-campo"
  );

gruposCampo.forEach(
  (campo, index) => {

    campo.style.opacity = "0";

    campo.style.transform =
      "translateY(8px)";

    setTimeout(() => {

      campo.style.transition =
        "opacity 0.4s ease, transform 0.4s ease";

      campo.style.opacity = "1";

      campo.style.transform =
        "translateY(0)";

    }, 150 + index * 70);

  }
);


// ============================================
// MOSTRAR / OCULTAR SENHA
// ============================================

document
  .querySelectorAll(
    ".botao-olho-cadastro"
  )
  .forEach((botao) => {

    botao.addEventListener(
      "click",
      () => {

        const idAlvo =
          botao.getAttribute(
            "data-alvo"
          );

        const input =
          document.getElementById(
            idAlvo
          );

        const mostrando =
          input.type === "text";

        input.type =
          mostrando
            ? "password"
            : "text";

        botao.innerHTML = mostrando
          ? '<i aria-hidden="true" class="fa-solid fa-eye"></i>'
          : '<i aria-hidden="true" class="fa-solid fa-eye-slash"></i>';

      }
    );

  });


// ============================================
// VALIDAÇÃO
// ============================================

formCadastro.addEventListener(
  "submit",
  (e) => {

    e.preventDefault();

    let valido = true;


    // ----------------------------------------
    // E-MAIL
    // ----------------------------------------

    const email =
      inputEmail.value.trim();

    const regraEmail =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (
      email === "" ||
      !regraEmail.test(email)
    ) {

      inputEmail.classList.add(
        "campo-invalido"
      );

      valido = false;

    } else {

      inputEmail.classList.remove(
        "campo-invalido"
      );

    }


    // ----------------------------------------
    // SENHA
    // ----------------------------------------

    if (
      inputSenha.value.length < 8
    ) {

      inputSenha.classList.add(
        "campo-invalido"
      );

      valido = false;

    } else {

      inputSenha.classList.remove(
        "campo-invalido"
      );

    }


    // ----------------------------------------
    // CONFIRMAÇÃO DA SENHA
    // ----------------------------------------

    if (
      inputConfirmarSenha.value !==
        inputSenha.value ||
      inputConfirmarSenha.value.length < 8
    ) {

      inputConfirmarSenha.classList.add(
        "campo-invalido"
      );

      erroSenha.textContent =
        "As senhas não coincidem.";

      erroSenha.classList.add(
        "erro"
      );

      valido = false;

    } else {

      inputConfirmarSenha.classList.remove(
        "campo-invalido"
      );

      erroSenha.textContent =
        "Deve ter pelo menos 8 caracteres.";

      erroSenha.classList.remove(
        "erro"
      );

    }


    // ----------------------------------------
    // CNPJ DO PROFISSIONAL
    // ----------------------------------------

    if (
      perfil === "profissional" &&
      inputCnpj.value.trim() === ""
    ) {

      inputCnpj.classList.add(
        "campo-invalido"
      );

      valido = false;

    } else {

      inputCnpj.classList.remove(
        "campo-invalido"
      );

    }


    // ----------------------------------------
    // SE EXISTIR ERRO
    // ----------------------------------------

    if (!valido) {

      const primeiroErro =
        document.querySelector(
          ".campo-invalido"
        );

      if (primeiroErro) {

        primeiroErro.scrollIntoView({
          behavior: "smooth",
          block: "center"
        });

        primeiroErro.focus();

      }

      return;
    }


    // ========================================
    // CADASTRO VALIDADO
    // ========================================

    const botaoCadastrar =
      document.querySelector(
        ".btn-cadastrar"
      );

    if (botaoCadastrar) {

      botaoCadastrar.disabled = true;

      botaoCadastrar.textContent =
        "Continuando...";

    }


    // Guarda o perfil para a próxima etapa
    localStorage.setItem(
      "perfilEscolhido",
      perfil
    );


    // ========================================
    // REDIRECIONAMENTO
    // ========================================

    setTimeout(() => {

      if (perfil === "profissional") {

        // Profissional → comprovantes
        window.location.href =
          "cadastro-profissional.html";

      } else {

        // Cliente → login
        window.location.href =
          "login.html?perfil=cliente";

      }

    }, 500);

  }
);

// ============================================
// POLÍTICA DE PRIVACIDADE
// ============================================

const modalPrivacidade =
  document.getElementById("politica-privacidade");

document
  .getElementById("abrir-privacidade")
  ?.addEventListener("click", (event) => {

    // Evita marcar o checkbox e mudar a URL
    event.preventDefault();

    modalPrivacidade?.showModal();
  });

modalPrivacidade
  ?.querySelectorAll("[data-fechar-privacidade]")
  .forEach((botao) => {
    botao.addEventListener("click", () =>
      modalPrivacidade.close()
    );
  });

// Fecha ao clicar fora do conteúdo
modalPrivacidade?.addEventListener("click", (event) => {
  if (event.target === modalPrivacidade) {
    modalPrivacidade.close();
  }
});

// ============================================
// LOVE JOURNEY — comprovantes.js
// Tela 3 — Dados Profissionais
// ============================================


// ============================================
// ELEMENTOS
// ============================================

const formProfissional =
  document.getElementById("form-profissional");

const areaUpload =
  document.getElementById("area-upload");

const inputArquivo =
  document.getElementById("arquivo");

const arquivoSelecionado =
  document.getElementById("arquivo-selecionado");

const campoArea =
  document.getElementById("area");

const campoFormacao =
  document.getElementById("formacao");

const campoRegistro =
  document.getElementById("registro");

const campoExperiencia =
  document.getElementById("experiencia");


// ============================================
// ANIMAÇÃO DE ENTRADA
// ============================================

window.addEventListener("DOMContentLoaded", () => {
  const conteudo =
    document.querySelector(".conteudo-profissional");

  if (!conteudo) return;

  conteudo.classList.add("animacao-entrada");
});


// ============================================
// ANIMAÇÃO DOS CAMPOS
// ============================================

const campos =
  document.querySelectorAll(
    ".campo-profissional, .campo-comprovante"
  );

campos.forEach((campo, index) => {
  campo.classList.add("campo-animado");

  campo.style.setProperty(
    "--ordem",
    index
  );
});


// ============================================
// SELECIONAR ARQUIVO
// ============================================

inputArquivo.addEventListener("change", () => {
  const arquivo =
    inputArquivo.files[0];

  if (!arquivo) {
    arquivoSelecionado.textContent = "";
    return;
  }

  validarArquivo(arquivo);
});


// ============================================
// VALIDAR ARQUIVO
// ============================================

function validarArquivo(arquivo) {

  const tiposPermitidos = [
    "application/pdf",
    "image/jpeg",
    "image/png"
  ];

  const tamanhoMaximo =
    10 * 1024 * 1024;


  // ==========================================
  // TIPO INVÁLIDO
  // ==========================================

  if (
    !tiposPermitidos.includes(
      arquivo.type
    )
  ) {

    arquivoSelecionado.textContent =
      "Formato inválido. Envie PDF, JPG ou PNG.";

    arquivoSelecionado.classList.add(
      "arquivo-erro"
    );

    inputArquivo.value = "";

    return false;
  }


  // ==========================================
  // ARQUIVO MUITO GRANDE
  // ==========================================

  if (
    arquivo.size > tamanhoMaximo
  ) {

    arquivoSelecionado.textContent =
      "O arquivo deve ter no máximo 10MB.";

    arquivoSelecionado.classList.add(
      "arquivo-erro"
    );

    inputArquivo.value = "";

    return false;
  }


  // ==========================================
  // ARQUIVO VÁLIDO
  // ==========================================

  arquivoSelecionado.classList.remove(
    "arquivo-erro"
  );

  const iconeSucesso = document.createElement("i");
  iconeSucesso.className = "fa-solid fa-check";
  iconeSucesso.setAttribute("aria-hidden", "true");
  arquivoSelecionado.replaceChildren(
    iconeSucesso,
    document.createTextNode(` ${arquivo.name}`)
  );


  // Reinicia a animação

  arquivoSelecionado.classList.remove(
    "arquivo-aparecendo"
  );

  void arquivoSelecionado.offsetWidth;

  arquivoSelecionado.classList.add(
    "arquivo-aparecendo"
  );


  // Animação da área de upload

  areaUpload.classList.remove(
    "upload-sucesso"
  );

  void areaUpload.offsetWidth;

  areaUpload.classList.add(
    "upload-sucesso"
  );

  setTimeout(() => {

    areaUpload.classList.remove(
      "upload-sucesso"
    );

  }, 700);

  return true;
}


// ============================================
// DRAG AND DROP
// ============================================

areaUpload.addEventListener(
  "dragover",
  (e) => {

    e.preventDefault();

    areaUpload.classList.add(
      "arrastando"
    );

  }
);


areaUpload.addEventListener(
  "dragleave",
  () => {

    areaUpload.classList.remove(
      "arrastando"
    );

  }
);


areaUpload.addEventListener(
  "drop",
  (e) => {

    e.preventDefault();

    areaUpload.classList.remove(
      "arrastando"
    );

    const arquivos =
      e.dataTransfer.files;

    if (!arquivos.length) return;

    const arquivo =
      arquivos[0];


    // Cria um FileList compatível

    const dataTransfer =
      new DataTransfer();

    dataTransfer.items.add(
      arquivo
    );

    inputArquivo.files =
      dataTransfer.files;

    validarArquivo(arquivo);

  }
);


// ============================================
// EFEITO AO CLICAR NO UPLOAD
// ============================================

areaUpload.addEventListener(
  "click",
  (e) => {

    if (
      e.target.closest(
        ".botao-selecionar"
      )
    ) {
      return;
    }

    areaUpload.classList.add(
      "clicado"
    );

    setTimeout(() => {

      areaUpload.classList.remove(
        "clicado"
      );

    }, 180);

  }
);


// ============================================
// EFEITO NOS CAMPOS
// ============================================

const inputs =
  document.querySelectorAll(
    ".campo-profissional input, .campo-profissional select, .campo-profissional textarea"
  );


inputs.forEach((input) => {

  input.addEventListener(
    "focus",
    () => {

      input.classList.add(
        "campo-focado"
      );

    }
  );


  input.addEventListener(
    "blur",
    () => {

      input.classList.remove(
        "campo-focado"
      );

    }
  );

});


// ============================================
// VALIDAÇÃO DO FORMULÁRIO
// ============================================

formProfissional.addEventListener(
  "submit",
  (e) => {

    e.preventDefault();

    let valido = true;


    // ========================================
    // ÁREA
    // ========================================

    if (
      campoArea.value === ""
    ) {

      campoArea.classList.add(
        "campo-invalido"
      );

      valido = false;

    } else {

      campoArea.classList.remove(
        "campo-invalido"
      );

    }


    // ========================================
    // FORMAÇÃO
    // ========================================

    if (
      campoFormacao.value.trim().length < 3
    ) {

      campoFormacao.classList.add(
        "campo-invalido"
      );

      valido = false;

    } else {

      campoFormacao.classList.remove(
        "campo-invalido"
      );

    }


    // ========================================
    // COMPROVANTE
    // ========================================

    if (
      !inputArquivo.files.length
    ) {

      areaUpload.classList.add(
        "upload-invalido"
      );

      arquivoSelecionado.textContent =
        "Envie um comprovante para continuar.";

      arquivoSelecionado.classList.add(
        "arquivo-erro"
      );

      valido = false;

    } else {

      areaUpload.classList.remove(
        "upload-invalido"
      );

    }


    // ========================================
    // EXISTEM ERROS
    // ========================================

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

      } else {

        areaUpload.scrollIntoView({
          behavior: "smooth",
          block: "center"
        });

      }

      return;
    }


    // ========================================
    // ENVIO
    // ========================================

    const botao =
      document.querySelector(
        ".btn-finalizar"
      );


    botao.disabled = true;

    botao.classList.add(
      "botao-enviando"
    );

    botao.textContent =
      "Enviando...";


    setTimeout(() => {

      botao.classList.remove(
        "botao-enviando"
      );

      botao.classList.add(
        "botao-sucesso"
      );

      botao.innerHTML =
        '<i aria-hidden="true" class="fa-solid fa-check"></i> Enviado!';


      setTimeout(() => {

        window.location.href =
          "login.html?perfil=profissional";

      }, 700);

    }, 900);

  }
);
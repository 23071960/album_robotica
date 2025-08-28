// Configuração Supabase
const SUPABASE_URL = 'https://hufrtioqiywncqghboal.supabase.co';
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh1ZnJ0aW9xaXl3bmNxZ2hib2FsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxODE3MTksImV4cCI6MjA2MDc1NzcxOX0.SNwH57bVGYwspmsDkRi5kwvZcTiwPba0NOobT-kFko8";
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Mapear pastas do Supabase para nomes amigáveis
const albumMap = {
  public: "Geral",
  album1: "Feira de Robótica",
  album2: "Oficina",
  album3: "Competição"
};

// SENHA DE ACESSO
const SENHA_PROFESSOR = "robotica2025"; // Altere para a senha desejada

// Função para filtrar arquivos válidos
function filtrarArquivosValidos(files) {
  return files.filter(file => {
    const lowerName = file.name.toLowerCase();
    const isImage = /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(file.name);
    const isPlaceholder = lowerName.includes('placeholder') || 
                         lowerName.includes('vazio') || 
                         lowerName.includes('empty');
    
    return isImage && !isPlaceholder;
  });
}

// Função para carregar todos os álbuns
async function carregarAlbums() {
  const albumList = document.getElementById("album-list");
  
  // Mostrar mensagem de carregamento
  albumList.innerHTML = '<p class="loading">Carregando álbuns...</p>';

  try {
    for (const [folder, name] of Object.entries(albumMap)) {
      const { data: files, error } = await supabase.storage.from('Robotica').list(folder, { limit: 100 });
      
      if (error) {
        console.error(`Erro ao listar arquivos da pasta ${folder}:`, error);
        continue;
      }

      // Filtrar apenas arquivos de imagem válidos
      const arquivosValidos = filtrarArquivosValidos(files || []);
      
      if (arquivosValidos.length === 0) {
        console.log(`Pasta ${folder} está vazia ou não contém imagens válidas`);
        continue;
      }

      // Remover mensagem de carregamento se for o primeiro álbum
      if (albumList.innerHTML.includes('loading')) {
        albumList.innerHTML = '';
      }

      // Criar card do álbum
      const card = document.createElement("div");
      card.className = "album-card";
      card.addEventListener("click", () => openAlbum(folder, name));

      // Miniatura (primeira imagem válida)
      const firstFileUrl = supabase.storage.from('Robotica').getPublicUrl(`${folder}/${arquivosValidos[0].name}`).data.publicUrl;
      const img = document.createElement("img");
      img.src = firstFileUrl;
      img.alt = name;
      
      img.onerror = function() {
        this.src = "https://via.placeholder.com/300x200?text=Imagem+Não+Carregada";
      };

      const titulo = document.createElement("h4");
      titulo.innerText = name;

      const count = document.createElement("p");
      count.innerText = `${arquivosValidos.length} imagem${arquivosValidos.length > 1 ? 'ns' : ''}`;

      card.appendChild(img);
      card.appendChild(titulo);
      card.appendChild(count);
      albumList.appendChild(card);
    }
    
    // Se nenhum álbum foi carregado, mostrar mensagem
    if (albumList.children.length === 0) {
      albumList.innerHTML = '<p class="no-albums">Nenhum álbum com imagens encontrado.</p>';
    }
  } catch (error) {
    console.error("Erro ao carregar álbuns:", error);
    albumList.innerHTML = '<p class="no-albums">Erro ao carregar álbuns. Verifique o console.</p>';
  }
}

// Abrir modal de um álbum
async function openAlbum(folder, albumName) {
  const modal = document.getElementById("album-modal");
  const modalContent = document.getElementById("album-modal-content");
  modalContent.innerHTML = "";

  // Adicionar título do álbum
  const title = document.createElement("h2");
  title.className = "modal-title";
  title.textContent = albumName;
  modalContent.appendChild(title);

  const { data: files, error } = await supabase.storage.from('Robotica').list(folder, { limit: 100 });
  if (error) {
    console.error(`Erro ao listar arquivos da pasta ${folder}:`, error);
    modalContent.innerHTML += "<p>Erro ao carregar imagens.</p>";
    modal.style.display = "flex";
    return;
  }

  // Filtrar apenas arquivos de imagem válidos
  const arquivosValidos = filtrarArquivosValidos(files || []);
  
  if (arquivosValidos.length === 0) {
    modalContent.innerHTML += "<p>Nenhuma imagem válida neste álbum.</p>";
    modal.style.display = "flex";
    return;
  }

  // Criar container para as imagens
  const imagesContainer = document.createElement("div");
  imagesContainer.className = "album-images";

  for (const file of arquivosValidos) {
    const url = supabase.storage.from('Robotica').getPublicUrl(`${folder}/${file.name}`).data.publicUrl;

    const figure = document.createElement("figure");

    const img = document.createElement("img");
    img.src = url;
    img.alt = file.name;
    img.loading = "lazy";
    
    img.onerror = function() {
      this.src = "https://via.placeholder.com/200x150?text=Imagem+Não+Carregada";
    };

    const figcaption = document.createElement("figcaption");
    figcaption.innerText = file.name.replace(/\.[^/.]+$/, "");

    figure.appendChild(img);
    figure.appendChild(figcaption);
    imagesContainer.appendChild(figure);
  }

  modalContent.appendChild(imagesContainer);
  modal.style.display = "flex";
  
  // Adicionar evento de tecla ESC para fechar o modal
  document.addEventListener('keydown', handleAlbumKeyPress);
}

// Fechar modal do álbum
function closeAlbumModal() {
  const modal = document.getElementById("album-modal");
  modal.style.display = "none";
  document.removeEventListener('keydown', handleAlbumKeyPress);
}

// Manipular pressionamento de tecla (ESC para fechar modal do álbum)
function handleAlbumKeyPress(e) {
  if (e.key === 'Escape') {
    closeAlbumModal();
  }
}

// Função para abrir o modal de login
function openLoginModal() {
  const modal = document.getElementById("login-modal");
  modal.style.display = "flex";
  document.getElementById("password").focus();
}

// Função para fechar o modal de login
function closeLoginModal() {
  const modal = document.getElementById("login-modal");
  modal.style.display = "none";
  document.getElementById("login-message").textContent = "";
  document.getElementById("login-message").className = "login-message";
  document.getElementById("login-form").reset();
}

// Função para verificar a senha
function verificarSenha(event) {
  event.preventDefault();
  
  const senhaInserida = document.getElementById("password").value;
  const messageElement = document.getElementById("login-message");
  
  if (senhaInserida === SENHA_PROFESSOR) {
    messageElement.textContent = "Acesso permitido! Redirecionando...";
    messageElement.className = "login-message message-success";
    
    // Armazenar autenticação na sessão
    sessionStorage.setItem('professor_autenticado', 'true');
    
    // Redirecionar após breve delay
    setTimeout(() => {
      window.location.href = "upload.html";
    }, 1000);
  } else {
    messageElement.textContent = "Senha incorreta. Tente novamente.";
    messageElement.className = "login-message message-error";
    
    // Efeito de shake no input
    const passwordInput = document.getElementById("password");
    passwordInput.classList.add("shake");
    setTimeout(() => {
      passwordInput.classList.remove("shake");
    }, 500);
  }
}

// Fechar modais ao clicar fora
window.addEventListener("click", function(e) {
  const loginModal = document.getElementById("login-modal");
  if (e.target === loginModal) closeLoginModal();
  
  const albumModal = document.getElementById("album-modal");
  if (e.target === albumModal) closeAlbumModal();
});

// Inicializar quando o documento estiver pronto
document.addEventListener("DOMContentLoaded", function() {
  // Configurar o formulário de login
  const loginForm = document.getElementById("login-form");
  if (loginForm) {
    loginForm.addEventListener("submit", verificarSenha);
  }
  
  // Carregar álbuns
  carregarAlbums();
});
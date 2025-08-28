// VERIFICAÇÃO DE AUTENTICAÇÃO
const SENHA_PROFESSOR = "robotica2025"; // Deve ser a mesma senha

// Verificar se o usuário está autenticado
function verificarAutenticacao() {
  // Verificar se a senha foi armazenada (autenticação temporária por sessão)
  if (!sessionStorage.getItem('professor_autenticado')) {
    // Se não estiver autenticado, redirecionar para a página principal
    alert("Acesso não autorizado. Redirecionando...");
    window.location.href = "index.html";
    return false;
  }
  return true;
}

// Executar a verificação quando a página carregar
document.addEventListener("DOMContentLoaded", function() {
  if (!verificarAutenticacao()) {
    return;
  }
  
  // O restante do código de upload só executa se autenticado
  // ... seu código existente de upload ...
});
// Configuração Supabase
const SUPABASE_URL = 'https://hufrtioqiywncqghboal.supabase.co';
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh1ZnJ0aW9xaXl3bmNxZ2hib2FsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxODE3MTksImV4cCI6MjA2MDc1NzcxOX0.SNwH57bVGYwspmsDkRi5kwvZcTiwPba0NOobT-kFko8";
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Mapeamento de álbuns
const albumMap = {
  public: "Geral",
  album1: "Feira de Robótica",
  album2: "Oficina",
  album3: "Competição"
};

// Inicialização quando o documento estiver carregado
document.addEventListener('DOMContentLoaded', function() {
  // Configurar o formulário de upload
  const uploadForm = document.getElementById('upload-form');
  uploadForm.addEventListener('submit', handleUpload);
  
  // Carregar imagens enviadas recentemente
  loadRecentUploads();
});

// Manipular o envio do formulário
async function handleUpload(e) {
  e.preventDefault();
  
  const albumSelect = document.getElementById('album');
  const fileInput = document.getElementById('image-upload');
  const nameInput = document.getElementById('image-name');
  const statusDiv = document.getElementById('upload-status');
  
  const album = albumSelect.value;
  const file = fileInput.files[0];
  
  if (!album || !file) {
    showStatus('Por favor, selecione um álbum e uma imagem.', 'error');
    return;
  }
  
  // Nome do arquivo
  const fileName = nameInput.value.trim() || file.name;
  const fileExt = file.name.split('.').pop();
  const finalFileName = `${fileName}.${fileExt}`;
  
  try {
    showStatus('Enviando imagem...', '');
    
    // Fazer upload para o Supabase
    const { data, error } = await supabase.storage
      .from('Robotica')
      .upload(`${album}/${finalFileName}`, file);
    
    if (error) {
      throw error;
    }
    
    // Exibir mensagem de sucesso
    showStatus('Imagem enviada com sucesso!', 'success');
    
    // Limpar o formulário
    fileInput.value = '';
    nameInput.value = '';
    
    // Exibir a imagem enviada
    displayUploadedImage(album, finalFileName);
    
  } catch (error) {
    console.error('Erro no upload:', error);
    showStatus(`Erro ao enviar imagem: ${error.message}`, 'error');
  }
}

// Exibir mensagem de status
function showStatus(message, type) {
  const statusDiv = document.getElementById('upload-status');
  statusDiv.textContent = message;
  statusDiv.className = type ? `status-${type}` : '';
}

// Exibir a imagem enviada recentemente
function displayUploadedImage(album, fileName) {
  const container = document.getElementById('uploaded-images-container');
  
  // Obter URL pública da imagem
  const { data: { publicUrl } } = supabase.storage
    .from('Robotica')
    .getPublicUrl(`${album}/${fileName}`);
  
  // Criar elemento para a imagem
  const imageItem = document.createElement('div');
  imageItem.className = 'uploaded-image-item';
  
  imageItem.innerHTML = `
    <img src="${publicUrl}" alt="${fileName}">
    <div class="image-info">
      <p class="image-name" title="${fileName}">${fileName}</p>
      <p class="image-album">Álbum: ${albumMap[album] || album}</p>
    </div>
  `;
  
  // Adicionar no início do container
  container.insertBefore(imageItem, container.firstChild);
}

// Carregar imagens enviadas recentemente
async function loadRecentUploads() {
  const container = document.getElementById('uploaded-images-container');
  container.innerHTML = '<p>Carregando imagens...</p>';
  
  try {
    // Buscar imagens de todos os álbuns
    const allImages = [];
    
    for (const album of Object.keys(albumMap)) {
      const { data: files, error } = await supabase.storage
        .from('Robotica')
        .list(album, { limit: 10, sortBy: { column: 'created_at', order: 'desc' } });
      
      if (!error && files) {
        // Adicionar informações do álbum a cada arquivo
        const albumFiles = files.map(file => ({
          ...file,
          album,
          albumName: albumMap[album]
        }));
        
        allImages.push(...albumFiles);
      }
    }
    
    // Ordenar por data de criação (mais recentes primeiro)
    allImages.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    // Limitar às 6 imagens mais recentes
    const recentImages = allImages.slice(0, 6);
    
    // Exibir as imagens
    container.innerHTML = '';
    
    if (recentImages.length === 0) {
      container.innerHTML = '<p>Nenhuma imagem enviada ainda.</p>';
      return;
    }
    
    recentImages.forEach(image => {
      displayUploadedImage(image.album, image.name);
    });
    
  } catch (error) {
    console.error('Erro ao carregar imagens:', error);
    container.innerHTML = '<p>Erro ao carregar imagens.</p>';
  }
}
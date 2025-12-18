import api from './api';

class CreatorPostService {
  /**
   * Obter meus posts como criador
   */
  async getMyPosts(params = {}) {
    try {
      const response = await api.get('/creator/posts', { params });
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching my posts:', error);
      throw error;
    }
  }

  /**
   * Criar novo post
   */
  async createPost(postData) {
    try {
      console.log('📤 Sending post data:', postData);

      const response = await api.post('/creator/posts', postData);

      console.log('✅ Post created:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error creating post:', error.response?.data || error);

      // Melhor mensagem de erro
      const errorMessage = error.response?.data?.message
        || error.message
        || 'Erro ao criar post';

      throw new Error(errorMessage);
    }
  }

  /**
   * Atualizar post existente
   */
  async updatePost(postId, postData) {
    try {
      const response = await api.put(`/creator/posts/${postId}`, postData);
      return response.data;
    } catch (error) {
      console.error('Error updating post:', error);
      throw error;
    }
  }

  /**
   * Deletar post
   */
  async deletePost(postId) {
    try {
      const response = await api.delete(`/creator/posts/${postId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting post:', error);
      throw error;
    }
  }

  /**
   * Deletar múltiplos posts
   */
  async bulkDeletePosts(postIds) {
    try {
      const response = await api.post('/creator/posts/bulk-delete', { postIds });
      return response.data;
    } catch (error) {
      console.error('Error bulk deleting posts:', error);
      throw error;
    }
  }

  /**
   * Obter post específico
   */
  async getPost(postId) {
    try {
      const response = await api.get(`/creator/posts/${postId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching post:', error);
      throw error;
    }
  }

  /**
   * Upload de mídia para Cloudinary
   * ✅ SEM AUTENTICAÇÃO - Upload direto
   */
  async uploadMedia(file, type = 'image') {
    try {
      console.log('📤 Starting Cloudinary upload:', {
        name: file.name,
        size: file.size,
        type: file.type,
        mediaType: type,
      });

      // ✅ Verificar variáveis de ambiente
      const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
      const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'ml_default';

      if (!cloudName) {
        throw new Error(
          'Configuração do Cloudinary não encontrada.\n' +
          'Adicione VITE_CLOUDINARY_CLOUD_NAME no arquivo .env'
        );
      }

      // Preparar FormData
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', uploadPreset);

      // Determinar tipo de recurso
      const resourceType = type === 'video' ? 'video' : type === 'audio' ? 'video' : 'image';
      const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;

      console.log(`🌐 Uploading to:  ${uploadUrl}`);

      // ✅ Upload direto para Cloudinary (SEM passar pelo axios/api)
      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Cloudinary error response:', errorData);
        throw new Error(errorData.error?.message || 'Upload falhou');
      }

      const data = await response.json();

      console.log('✅ Cloudinary upload successful:', {
        url: data.secure_url,
        publicId: data.public_id,
        format: data.format,
      });

      return {
        url: data.secure_url,
        publicId: data.public_id,
        format: data.format,
        width: data.width,
        height: data.height,
        duration: data.duration,
        bytes: data.bytes,
      };
    } catch (error) {
      console.error('❌ Cloudinary upload error:', error);
      throw new Error(`Falha no upload:  ${error.message}`);
    }
  }
}

export default new CreatorPostService();
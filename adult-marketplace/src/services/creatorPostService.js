// creatorPostService.js - VERSÃO SEGURA
import api from './api';

class CreatorPostService {
  /**
   * Upload de mídia via backend (SEGURO)
   * Não expõe credenciais do Cloudinary no frontend
   */
  async uploadMedia(file, mediaType = 'photo') {
    try {
      console.log('📤 Starting upload via backend:', {
        name: file.name,
        size: file.size,
        type: file.type,
        mediaType
      });

      // Criar FormData
      const formData = new FormData();
      formData.append('file', file);
      formData.append('mediaType', mediaType);

      // Upload via backend
      const response = await api.post('/upload/media', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          console.log(`📊 Upload progress: ${percentCompleted}%`);
        },
      });

      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Upload failed');
      }

      console.log('✅ Upload successful:', response.data.data);

      return {
        url: response.data.data.url,
        publicId: response.data.data.publicId,
        mediaType: response.data.data.mediaType,
        thumbnail: response.data.data.thumbnail,
      };

    } catch (error) {
      console.error('❌ Upload error:', error);
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Falha no upload'
      );
    }
  }

  /**
   * Criar post com múltiplas mídias
   */
  async createPost(postData, files = []) {
    try {
      console.log('🚀 Creating post with media...');

      // Upload de todas as mídias
      const mediaUploads = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        console.log(`📤 Uploading ${i + 1}/${files.length}: ${file.name}`);
        
        const mediaType = file.type.startsWith('video/') ? 'video' : 'photo';
        const uploadResult = await this.uploadMedia(file, mediaType);
        
        mediaUploads.push({
          url: uploadResult.url,
          publicId: uploadResult.publicId,
          type: mediaType,
          thumbnail: uploadResult.thumbnail,
        });
      }

      // Criar post com as URLs das mídias
      const postPayload = {
        ...postData,
        media: mediaUploads,
      };

      const response = await api.post('/posts', postPayload);

      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Falha ao criar post');
      }

      console.log('✅ Post created successfully:', response.data.data);
      return response.data.data;

    } catch (error) {
      console.error('❌ Create post error:', error);
      throw error;
    }
  }

  /**
   * Buscar posts do criador
   */
  async getMyPosts(params = {}) {
    try {
      const { page = 1, limit = 10, status } = params;
      
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(status && { status }),
      });

      const response = await api.get(`/posts/my-posts?${queryParams}`);
      return response.data;

    } catch (error) {
      console.error('❌ Get posts error:', error);
      throw error;
    }
  }

  /**
   * Atualizar post
   */
  async updatePost(postId, updateData) {
    try {
      const response = await api.patch(`/posts/${postId}`, updateData);
      return response.data;
    } catch (error) {
      console.error('❌ Update post error:', error);
      throw error;
    }
  }

  /**
   * Deletar post
   */
  async deletePost(postId) {
    try {
      const response = await api.delete(`/posts/${postId}`);
      return response.data;
    } catch (error) {
      console.error('❌ Delete post error:', error);
      throw error;
    }
  }
}

export default new CreatorPostService();
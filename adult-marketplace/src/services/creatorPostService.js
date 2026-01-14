// creatorPostService.js - VERSÃO CORRIGIDA
import api from './api';

class CreatorPostService {
  async uploadMedia(file, mediaType = 'photo') {
    try {
      console.log('📤 Starting upload via backend:', {
        name: file.name,
        size: file.size,
        type: file.type,
        mediaType
      });

      const formData = new FormData();
      formData.append('file', file);
      formData.append('mediaType', mediaType);

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

      // ✅ CORRIGIDO: Verificar response.data.status em vez de response.data.success
      if (response.data?.status !== 'success') {
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

  async createPost(postData) {
    try {
      console.log('📝 Creating post:', postData);

      const response = await api.post('/posts', postData);

      if (response.data?.status !== 'success') {
        throw new Error(response.data?.message || 'Falha ao criar post');
      }

      console.log('✅ Post created successfully:', response.data.data);
      return response.data.data;

    } catch (error) {
      console.error('❌ Create post error:', error);
      throw new Error(
        error.response?.data?.message ||
        error.message ||
        'Erro ao criar post'
      );
    }
  }

  // creatorPostService.js

  async getMyPosts(params = {}) {
    try {
      const { page = 1, limit = 10, status } = params;

      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(status && status !== 'all' && { status }),
      });

      const response = await api.get(`/posts/my-posts?${queryParams}`);

      // Estrutura esperada: { status: 'success', data: { data: [...], stats: {...}, pagination: {...} } }
      const result = response.data;

      // Se a API retorna { status, data: { data, stats } }
      if (result.data && result.data.data) {
        return {
          data: result.data.data,
          stats: result.data.stats,
          pagination: result.data.pagination
        };
      }

      // Se a API retorna { status, data: [...] }
      if (Array.isArray(result.data)) {
        return {
          data: result.data,
          stats: { all: 0, published: 0, scheduled: 0, draft: 0 },
          pagination: null
        };
      }

      // Fallback
      return {
        data: [],
        stats: { all: 0, published: 0, scheduled: 0, draft: 0 },
        pagination: null
      };

    } catch (error) {
      console.error('❌ Get posts error:', error);
      // Retornar estrutura vazia em vez de throw
      return {
        data: [],
        stats: { all: 0, published: 0, scheduled: 0, draft: 0 },
        pagination: null
      };
    }
  }

  async updatePost(postId, updateData) {
    try {
      const response = await api.patch(`/posts/${postId}`, updateData);
      return response.data;
    } catch (error) {
      console.error('❌ Update post error:', error);
      throw error;
    }
  }

  async deletePost(postId) {
    try {
      const response = await api.delete(`/posts/${postId}`);
      return response.data;
    } catch (error) {
      console.error('❌ Delete post error:', error);
      throw error;
    }
  }

  async bulkDeletePosts(postIds) {
    try {
      const response = await api.post('/posts/bulk-delete', { postIds });
      return response.data;
    } catch (error) {
      console.error('❌ Bulk delete error:', error);
      throw error;
    }
  }
}

export default new CreatorPostService();
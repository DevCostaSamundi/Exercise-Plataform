import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import CreatorSidebar from '../../components/CreatorSidebar';
import creatorPostService from '../../services/creatorPostService'; // ✅ ADICIONAR IMPORT

export default function UploadContentPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [step, setStep] = useState(1);
  const [files, setFiles] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    contentType: 'photo',
    visibility: 'subscribers',
    price: 0,
    tags: [],
    scheduled: false,
    scheduledDate: '',
    scheduledTime: '',
    watermark: true,
    allowDownload: false,
  });
  const [errors, setErrors] = useState({});
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);

  const availableTags = [
    'Sensual', 'Artístico', 'Casual', 'Fitness', 'Fetiche', 'Lifestyle',
    'Behind the scenes', 'Exclusivo', 'Novo', 'Popular', 'Teaser'
  ];

  const MAX_FILE_SIZE = 100 * 1024 * 1024;
  const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  const ACCEPTED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm'];
  const ACCEPTED_AUDIO_TYPES = ['audio/mpeg', 'audio/wav', 'audio/ogg'];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleTagToggle = (tag) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleFiles = (newFiles) => {
    const validFiles = [];
    const newErrors = {};

    newFiles.forEach((file, index) => {
      if (file.size > MAX_FILE_SIZE) {
        newErrors[`file-${index}`] = `${file.name} excede o tamanho máximo de 100MB`;
        return;
      }

      const acceptedTypes = [...ACCEPTED_IMAGE_TYPES, ...ACCEPTED_VIDEO_TYPES, ...ACCEPTED_AUDIO_TYPES];
      if (!acceptedTypes.includes(file.type)) {
        newErrors[`file-${index}`] = `${file.name} não é um tipo de arquivo suportado`;
        return;
      }

      const preview = URL.createObjectURL(file);
      validFiles.push({
        file,
        preview,
        type: file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : 'audio',
        name: file.name,
        size: file.size,
        id: Date.now() + index,
      });
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
    }

    setFiles(prev => [...prev, ...validFiles]);

    if (validFiles.length > 0 && step === 1) {
      const firstFile = validFiles[0];
      setFormData(prev => ({
        ...prev,
        contentType: firstFile.type === 'image' ? 'photo' : firstFile.type === 'video' ? 'video' : 'audio'
      }));
    }
  };

  const removeFile = (id) => {
    setFiles(prev => {
      const fileToRemove = prev.find(f => f.id === id);
      if (fileToRemove) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      return prev.filter(f => f.id !== id);
    });
  };

  const validateStep2 = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Título é obrigatório';
    } else if (formData.title.length < 3) {
      newErrors.title = 'Título deve ter no mínimo 3 caracteres';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Descrição é obrigatória';
    } else if (formData.description.length < 10) {
      newErrors.description = 'Descrição deve ter no mínimo 10 caracteres';
    }

    if (formData.visibility === 'premium' && formData.price <= 0) {
      newErrors.price = 'Defina um preço para conteúdo premium';
    }

    if (formData.scheduled && !formData.scheduledDate) {
      newErrors.scheduledDate = 'Selecione uma data';
    }

    if (formData.scheduled && !formData.scheduledTime) {
      newErrors.scheduledTime = 'Selecione um horário';
    }

    return newErrors;
  };

  const handleNext = () => {
    if (step === 1) {
      if (files.length === 0) {
        setErrors({ files: 'Selecione pelo menos um arquivo' });
        return;
      }
      setStep(2);
    } else if (step === 2) {
      const newErrors = validateStep2();
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }
      setStep(3);
    }
    window.scrollTo(0, 0);
  };

  const handleBack = () => {
    setStep(step - 1);
    window.scrollTo(0, 0);
  };

  // ✅ NOVA FUNÇÃO DE UPLOAD REAL
  // ✅ FUNÇÃO CORRIGIDA - handlePublish
  const handlePublish = async () => {
    setIsUploading(true);
    setUploadProgress(0);

    try {
      console.log('🚀 Starting upload process...');

      // Step 1: Upload files to Cloudinary
      const uploadedMedia = [];
      const totalFiles = files.length;

      for (let i = 0; i < totalFiles; i++) {
        const fileObj = files[i];
        console.log(`📤 Uploading ${i + 1}/${totalFiles}: `, fileObj.name);

        try {
          const result = await creatorPostService.uploadMedia(
            fileObj.file,
            formData.contentType
          );
          uploadedMedia.push(result.url);

          const progress = ((i + 1) / totalFiles) * 70;
          setUploadProgress(Math.round(progress));

          console.log(`✅ Uploaded: `, result.url);
        } catch (uploadError) {
          console.error(`❌ Error uploading ${fileObj.name}:`, uploadError);
          throw new Error(`Falha ao fazer upload de ${fileObj.name}`);
        }
      }

      setUploadProgress(75);

      // Step 2: Prepare post data
      let scheduledFor = null;
      if (formData.scheduled && formData.scheduledDate && formData.scheduledTime) {
        scheduledFor = new Date(`${formData.scheduledDate}T${formData.scheduledTime}:00`).toISOString();
      }

      // ✅ CORRIGIDO: Mapear contentType para o enum correto do backend
      const mediaTypeMap = {
        'photo': 'IMAGE',
        'video': 'VIDEO',
        'audio': 'AUDIO',
        'document': 'DOCUMENT'
      };

      const postData = {
        title: formData.title,
        content: formData.description,
        mediaUrls: uploadedMedia,
        mediaType: mediaTypeMap[formData.contentType] || 'IMAGE', // ✅ CONVERSÃO AQUI
        isPublic: formData.visibility === 'free',
        isPPV: formData.visibility === 'premium',
        ppvPrice: formData.visibility === 'premium' ? parseFloat(formData.price) : null,
        tags: formData.tags,
        scheduledFor,
      };

      console.log('📝 Creating post:', postData);

      setUploadProgress(85);

      // Step 3: Create post
      await creatorPostService.createPost(postData);

      setUploadProgress(100);

      console.log('✅ Post created successfully!');

      // Navigate to posts page
      setTimeout(() => {
        navigate('/creator/posts', {
          state: {
            message: formData.scheduled
              ? 'Post agendado com sucesso!'
              : 'Post publicado com sucesso!'
          }
        });
      }, 500);

    } catch (error) {
      console.error('❌ Upload error:', error);
      setErrors({ submit: error.message || 'Erro ao publicar. Tente novamente.' });
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatPrice = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex">
      <CreatorSidebar />
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <Link to="/" className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-black dark:bg-white rounded-xl flex items-center justify-center">
                    <span className="text-white dark:text-black font-black text-xl">F</span>
                  </div>
                  <span className="font-bold text-slate-900 dark:text-white">Novo Post</span>
                </Link>
              </div>

              {/* Progress Steps */}
              <div className="hidden sm:flex items-center space-x-2 text-sm">
                <div className={`flex items-center ${step >= 1 ? 'text-black' : 'text-slate-400'}`}>
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-black text-white' : 'bg-slate-200 dark:bg-slate-700'}`}>
                    {step > 1 ? '✓' : '1'}
                  </span>
                  <span className="ml-2 hidden md:inline">Upload</span>
                </div>
                <div className="w-8 h-0.5 bg-slate-200 dark:bg-slate-700"></div>
                <div className={`flex items-center ${step >= 2 ? 'text-black' : 'text-slate-400'}`}>
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-black text-white' : 'bg-slate-200 dark:bg-slate-700'}`}>
                    {step > 2 ? '✓' : '2'}
                  </span>
                  <span className="ml-2 hidden md:inline">Detalhes</span>
                </div>
                <div className="w-8 h-0.5 bg-slate-200 dark:bg-slate-700"></div>
                <div className={`flex items-center ${step >= 3 ? 'text-black' : 'text-slate-400'}`}>
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-black text-white' : 'bg-slate-200 dark:bg-slate-700'}`}>
                    3
                  </span>
                  <span className="ml-2 hidden md:inline">Revisar</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-8">
          {/* Step 1: Upload Files */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                  Faça upload do seu conteúdo
                </h2>
                <p className="text-slate-600 dark:text-slate-400">
                  Arraste e solte seus arquivos ou clique para selecionar
                </p>
              </div>

              {/* Upload Area */}
              <div
                className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all ${dragActive
                  ? 'border-black dark:border-white bg-black/5 dark:bg-white/5'
                  : 'border-slate-300 dark:border-slate-700 hover:border-black dark:hover:border-white'
                  }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,video/*,audio/*"
                  onChange={handleFileInput}
                  className="hidden"
                />

                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 bg-black dark:bg-black/20 rounded-full flex items-center justify-center mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-black dark:text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>

                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                    Solte seus arquivos aqui
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                    ou clique no botão abaixo para selecionar
                  </p>

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-black hover:bg-black text-white font-medium px-6 py-3 rounded-lg transition-colors"
                  >
                    Selecionar Arquivos
                  </button>

                  <div className="mt-6 text-xs text-slate-500 dark:text-slate-400 space-y-1">
                    <p>Formatos suportados: JPG, PNG, GIF, WebP, MP4, MOV, WebM, MP3, WAV</p>
                    <p>Tamanho máximo por arquivo: 100MB</p>
                  </div>
                </div>
              </div>

              {errors.files && (
                <p className="text-sm text-slate-900 dark:text-slate-900">{errors.files}</p>
              )}

              {/* File Preview */}
              {files.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-slate-900 dark:text-white">
                    Arquivos selecionados ({files.length})
                  </h3>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {files.map((fileObj) => (
                      <div key={fileObj.id} className="relative group">
                        <div className="aspect-square rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                          {fileObj.type === 'image' && (
                            <img
                              src={fileObj.preview}
                              alt={fileObj.name}
                              className="w-full h-full object-cover"
                            />
                          )}
                          {fileObj.type === 'video' && (
                            <video
                              src={fileObj.preview}
                              className="w-full h-full object-cover"
                            />
                          )}
                          {fileObj.type === 'audio' && (
                            <div className="w-full h-full flex items-center justify-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3.895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3.895 3 2zM9 10l12-3" />
                              </svg>
                            </div>
                          )}

                          {/* Overlay with remove button */}
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button
                              onClick={() => removeFile(fileObj.id)}
                              className="bg-slate-900 hover:bg-slate-900 text-white p-2 rounded-lg transition-colors"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </div>

                          {/* File type badge */}
                          <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                            {fileObj.type === 'image' ? '📷' : fileObj.type === 'video' ? '🎥' : '🎵'}
                          </div>
                        </div>

                        <div className="mt-2">
                          <p className="text-xs text-slate-600 dark:text-slate-400 truncate">{fileObj.name}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-500">{formatFileSize(fileObj.size)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Details */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                  Detalhes do Post
                </h2>
                <p className="text-slate-600 dark:text-slate-400">
                  Adicione informações sobre seu conteúdo
                </p>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-5">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Título *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    maxLength={100}
                    className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border ${errors.title ? 'border-red-300' : 'border-slate-200 dark:border-slate-700'
                      } rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white`}
                    placeholder="Dê um título chamativo para seu post..."
                  />
                  <div className="flex justify-between mt-1">
                    {errors.title && <p className="text-sm text-slate-900">{errors.title}</p>}
                    <p className="text-xs text-slate-500 ml-auto">{formData.title.length}/100</p>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Descrição *
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={4}
                    maxLength={500}
                    className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border ${errors.description ? 'border-red-300' : 'border-slate-200 dark:border-slate-700'
                      } rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white resize-none`}
                    placeholder="Descreva seu conteúdo..."
                  ></textarea>
                  <div className="flex justify-between mt-1">
                    {errors.description && <p className="text-sm text-slate-900">{errors.description}</p>}
                    <p className="text-xs text-slate-500 ml-auto">{formData.description.length}/500</p>
                  </div>
                </div>

                {/* Visibility */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                    Visibilidade
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, visibility: 'subscribers', price: 0 }))}
                      className={`p-4 rounded-lg border-2 transition-all ${formData.visibility === 'subscribers'
                        ? 'border-black dark:border-white bg-black/5 dark:bg-white/5'
                        : 'border-slate-200 dark:border-slate-700 hover:border-black dark:hover:border-white'
                        }`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 mx-auto mb-2 ${formData.visibility === 'subscribers' ? 'text-black' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">Assinantes</p>
                      <p className="text-xs text-slate-500 mt-1">Incluído na assinatura</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, visibility: 'premium' }))}
                      className={`p-4 rounded-lg border-2 transition-all ${formData.visibility === 'premium'
                        ? 'border-slate-800 dark:border-slate-200 bg-black/5 dark:bg-white/5'
                        : 'border-slate-200 dark:border-slate-700 hover:border-black dark:hover:border-white'
                        }`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 mx-auto mb-2 ${formData.visibility === 'premium' ? 'text-black' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8c1.657 0 3-1.343 3-3S13.657 2 12 2 9 3.343 9 5s1.343 3 3 3zm0 0v14m-6 0h12"
                        />                      </svg>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">PPV Premium</p>
                      <p className="text-xs text-slate-500 mt-1">Pagamento extra</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, visibility: 'free', price: 0 }))}
                      className={`p-4 rounded-lg border-2 transition-all ${formData.visibility === 'free'
                        ? 'border-green-600 bg-slate-800 dark:bg-slate-800/20'
                        : 'border-slate-200 dark:border-slate-700 hover:border-green-300'
                        }`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 mx-auto mb-2 ${formData.visibility === 'free' ? 'text-slate-800' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">Gratuito</p>
                      <p className="text-xs text-slate-500 mt-1">Público (teaser)</p>
                    </button>
                  </div>
                </div>

                {/* Price (if PPV) */}
                {formData.visibility === 'premium' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Preço (PPV - Pay Per View) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                      <input
                        type="number"
                        name="price"
                        value={formData.price}
                        onChange={handleChange}
                        min="5"
                        max="500"
                        step="0.50"
                        className={`w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border ${errors.price ? 'border-red-300' : 'border-slate-200 dark:border-slate-700'
                          } rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white`}
                      />
                    </div>
                    {errors.price && <p className="mt-1 text-sm text-slate-900">{errors.price}</p>}
                    <p className="mt-1 text-xs text-slate-500">Preço mínimo: $ 5.00 | Máximo: $ 500.00</p>
                  </div>
                )}

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                    Tags (opcional)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {availableTags.map(tag => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleTagToggle(tag)}
                        className={`text-sm px-3 py-1.5 rounded-full transition-all ${formData.tags.includes(tag)
                          ? 'bg-black text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-black'
                          }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Schedule */}
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="scheduled"
                      checked={formData.scheduled}
                      onChange={handleChange}
                      className="w-5 h-5 text-black bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600 rounded focus:ring-2 focus:ring-black dark:focus:ring-white"
                    />
                    <div>
                      <span className="text-sm font-medium text-slate-900 dark:text-white">Agendar publicação</span>
                      <p className="text-xs text-slate-500">Escolha data e hora para publicar automaticamente</p>
                    </div>
                  </label>

                  {formData.scheduled && (
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          Data
                        </label>
                        <input
                          type="date"
                          name="scheduledDate"
                          value={formData.scheduledDate}
                          onChange={handleChange}
                          min={new Date().toISOString().split('T')[0]}
                          className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border ${errors.scheduledDate ? 'border-red-300' : 'border-slate-200 dark:border-slate-700'
                            } rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white`}
                        />
                        {errors.scheduledDate && <p className="mt-1 text-sm text-slate-900">{errors.scheduledDate}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          Horário
                        </label>
                        <input
                          type="time"
                          name="scheduledTime"
                          value={formData.scheduledTime}
                          onChange={handleChange}
                          className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border ${errors.scheduledTime ? 'border-red-300' : 'border-slate-200 dark:border-slate-700'
                            } rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white`}
                        />
                        {errors.scheduledTime && <p className="mt-1 text-sm text-slate-900">{errors.scheduledTime}</p>}
                      </div>
                    </div>
                  )}
                </div>

                {/* Additional Options */}
                <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                  <label className="flex items-center justify-between cursor-pointer">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        name="watermark"
                        checked={formData.watermark}
                        onChange={handleChange}
                        className="w-5 h-5 text-black bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600 rounded focus:ring-2 focus:ring-black dark:focus:ring-white"
                      />
                      <div>
                        <span className="text-sm font-medium text-slate-900 dark:text-white">Adicionar marca d'água</span>
                        <p className="text-xs text-slate-500">Protege contra pirataria</p>
                      </div>
                    </div>
                    <span className="text-xs bg-slate-800 dark:bg-slate-800/20 text-slate-800 dark:text-slate-800 px-2 py-1 rounded-full">
                      Recomendado
                    </span>
                  </label>

                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="allowDownload"
                      checked={formData.allowDownload}
                      onChange={handleChange}
                      className="w-5 h-5 text-black bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600 rounded focus:ring-2 focus:ring-black dark:focus:ring-white"
                    />
                    <div>
                      <span className="text-sm font-medium text-slate-900 dark:text-white">Permitir download</span>
                      <p className="text-xs text-slate-500">Assinantes poderão baixar este conteúdo</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Preview */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                  Revisar Post
                </h2>
                <p className="text-slate-600 dark:text-slate-400">
                  Confira como seu post ficará antes de publicar
                </p>
              </div>

              {/* Preview Card */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden max-w-2xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">Seu Nome</p>
                      <p className="text-xs text-slate-500">Agora</p>
                    </div>
                  </div>
                  {formData.visibility === 'premium' && (
                    <span className="bg-black dark:bg-black/20 text-black dark:text-black text-xs font-bold px-3 py-1 rounded-full">
                      PPV {formatPrice(formData.price)}
                    </span>
                  )}
                  {formData.visibility === 'free' && (
                    <span className="bg-slate-800 dark:bg-slate-800/20 text-slate-800 dark:text-slate-800 text-xs font-bold px-3 py-1 rounded-full">
                      GRATUITO
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">{formData.title}</h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-4 whitespace-pre-wrap">{formData.description}</p>

                  {formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {formData.tags.map(tag => (
                        <span key={tag} className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-1 rounded">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Media Preview */}
                  <div className="grid grid-cols-2 gap-2">
                    {files.slice(0, 4).map((fileObj, index) => (
                      <div key={fileObj.id} className="aspect-square rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 relative">
                        {fileObj.type === 'image' && (
                          <img src={fileObj.preview} alt="" className="w-full h-full object-cover" />
                        )}
                        {fileObj.type === 'video' && (
                          <video src={fileObj.preview} className="w-full h-full object-cover" />
                        )}
                        {index === 3 && files.length > 4 && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                            <span className="text-white text-2xl font-bold">+{files.length - 4}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between text-sm text-slate-500">
                    <div className="flex items-center space-x-4">
                      <span className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                        </svg>
                        Curtir
                      </span>
                      <span className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                        </svg>
                        Comentar
                      </span>
                    </div>
                    <span className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                      </svg>
                      Compartilhar
                    </span>
                  </div>
                </div>
              </div>

              {/* Summary Info */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 max-w-2xl mx-auto">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-600 dark:text-slate-400 mb-1">Arquivos:</p>
                    <p className="font-semibold text-slate-900 dark:text-white">{files.length} arquivo(s)</p>
                  </div>
                  <div>
                    <p className="text-slate-600 dark:text-slate-400 mb-1">Visibilidade:</p>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {formData.visibility === 'subscribers' && 'Assinantes'}
                      {formData.visibility === 'premium' && `PPV ${formatPrice(formData.price)}`}
                      {formData.visibility === 'free' && 'Gratuito (Público)'}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-600 dark:text-slate-400 mb-1">Marca d'água:</p>
                    <p className="font-semibold text-slate-900 dark:text-white">{formData.watermark ? 'Sim' : 'Não'}</p>
                  </div>
                  <div>
                    <p className="text-slate-600 dark:text-slate-400 mb-1">Publicação:</p>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {formData.scheduled ? `Agendado para ${formData.scheduledDate} às ${formData.scheduledTime}` : 'Imediata'}
                    </p>
                  </div>
                </div>
              </div>

              {errors.submit && (
                <div className="bg-slate-900 dark:bg-slate-900/20 border border-red-200 dark:border-red-800 text-slate-900 dark:text-slate-900 px-4 py-3 rounded-lg max-w-2xl mx-auto">
                  {errors.submit}
                </div>
              )}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-6 border-t border-slate-200 dark:border-slate-800">
            {step > 1 ? (
              <button
                onClick={handleBack}
                disabled={isUploading}
                className="px-6 py-3 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium transition-colors flex items-center space-x-2 disabled:opacity-50"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
                <span>Voltar</span>
              </button>
            ) : (
              <button
                onClick={() => navigate('/creator/dashboard')}
                className="px-6 py-3 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium transition-colors"
              >
                Cancelar
              </button>
            )}

            {step < 3 ? (
              <button
                onClick={handleNext}
                className="px-6 py-3 bg-black hover:bg-black text-white font-bold rounded-lg transition-colors flex items-center space-x-2"
              >
                <span>Próximo</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            ) : (
              <button
                onClick={handlePublish}
                disabled={isUploading}
                className="px-8 py-3 bg-black hover:bg-black/90 disabled:opacity-50 text-white font-bold rounded-lg transition-all flex items-center space-x-2"
              >
                {isUploading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Publicando... {uploadProgress}%</span>
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>{formData.scheduled ? 'Agendar Publicação' : 'Publicar Agora'}</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
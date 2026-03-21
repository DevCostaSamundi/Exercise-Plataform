import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import CreatorSidebar from '../../components/CreatorSidebar';
import api from '../../services/api';

// ============================================
// CONSTANTES
// ============================================

const TABS = [
  { id: 'profile', icon: '👤', label: 'Perfil' },
  { id: 'account', icon: '🔐', label: 'Conta & Segurança' },
  { id: 'subscription', icon: '💎', label: 'Assinatura & Preços' },
  { id: 'payments', icon: '💰', label: 'Pagamentos & Saques' },
  { id: 'notifications', icon: '🔔', label: 'Notificações' },
  { id: 'privacy', icon: '🔒', label: 'Privacidade' },
  { id: 'content', icon: '📸', label: 'Conteúdo' },
  { id: 'blocking', icon: '🚫', label: 'Bloqueios' },
];

const CATEGORIES = [
  'Lifestyle', 'Fitness', 'Arte', 'Música', 'Moda', 'Culinária',
  'Viagens', 'Gaming', 'Educação', 'Entretenimento', 'ASMR', 'Cosplay',
  'Dança', 'Fotografia', 'Podcast', 'Outros'
];

const GENDERS = [
  { value: 'Cis homem', label: 'Cis Homem' },
  { value: 'Cis mulher', label: 'Cis Mulher' },
  { value: 'Trans homem', label: 'Trans Homem' },
  { value: 'Trans mulher', label: 'Trans Mulher' },
  { value: 'Não-binário', label: 'Não-Binário' },
  { value: 'Queer', label: 'Queer' },
  { value: 'Gênero fluido', label: 'Gênero Fluido' },
  { value: 'Prefiro não dizer', label: 'Prefiro não dizer' },
];

const ORIENTATIONS = [
  { value: 'Gay', label: 'Gay' },
  { value: 'Lésbica', label: 'Lésbica' },
  { value: 'Bissexual', label: 'Bissexual' },
  { value: 'Pansexual', label: 'Pansexual' },
  { value: 'Assexual', label: 'Assexual' },
  { value: 'Demissexual', label: 'Demissexual' },
  { value: 'Queer', label: 'Queer' },
  { value: 'Prefiro não dizer', label: 'Prefiro não dizer' },
];

// ============================================
// COMPONENTES DE UI REUTILIZÁVEIS
// ============================================

function Input({ id, type = 'text', value, onChange, placeholder, disabled, className = '', prefix, ...props }) {
  return (
    <div className="relative">
      {prefix && (
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">{prefix}</span>
      )}
      <input
        id={id}
        type={type}
        value={value || ''}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${prefix ? 'pl-8' : ''} ${className}`}
        {...props}
      />
    </div>
  );
}

function TextArea({ id, value, onChange, placeholder, rows = 4, maxLength, disabled }) {
  return (
    <div className="relative">
      <textarea
        id={id}
        value={value || ''}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        maxLength={maxLength}
        disabled={disabled}
        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-colors resize-none"
      />
      {maxLength && (
        <span className="absolute bottom-2 right-3 text-xs text-slate-400">
          {(value || '').length}/{maxLength}
        </span>
      )}
    </div>
  );
}

function Select({ id, value, onChange, options, placeholder, disabled }) {
  return (
    <select
      id={id}
      value={value || ''}
      onChange={onChange}
      disabled={disabled}
      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-colors appearance-none cursor-pointer"
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((opt) => (
        <option key={opt.value || opt} value={opt.value || opt}>
          {opt.label || opt}
        </option>
      ))}
    </select>
  );
}

function Toggle({ id, checked, onChange, label, description, disabled }) {
  return (
    <div className="flex items-start justify-between py-3">
      <div className="flex-1 pr-4">
        <label htmlFor={id} className="text-sm font-medium text-slate-900 dark:text-white cursor-pointer">
          {label}
        </label>
        {description && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>
        )}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => !disabled && onChange(!checked)}
        disabled={disabled}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:ring-offset-2 dark:focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed ${checked ? 'bg-black' : 'bg-slate-300 dark:bg-slate-600'
          }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${checked ? 'translate-x-5' : 'translate-x-0'
            }`}
        />
      </button>
    </div>
  );
}

function Button({ children, variant = 'primary', size = 'md', loading, disabled, className = '', ...props }) {
  const variants = {
    primary: 'bg-black hover:bg-black/90 text-white shadow-lg',
    secondary: 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white',
    danger: 'bg-slate-900 hover:bg-slate-900 text-white shadow-lg shadow-red-600/25',
    success: 'bg-slate-800 hover:bg-slate-800 text-white shadow-lg shadow-green-600/25',
    outline: 'border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {children}
    </button>
  );
}

function FormGroup({ label, htmlFor, required, hint, error, children }) {
  return (
    <div className="mb-5">
      <label htmlFor={htmlFor} className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
        {label}
        {required && <span className="text-slate-900 ml-1">*</span>}
      </label>
      {children}
      {hint && !error && (
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">{hint}</p>
      )}
      {error && (
        <p className="text-xs text-slate-900 mt-1.5 flex items-center space-x-1">
          <span>⚠️</span>
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}

function SettingsCard({ title, description, children, actions }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 mb-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h3>
          {description && (
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{description}</p>
          )}
        </div>
        {actions && <div className="flex items-center space-x-2">{actions}</div>}
      </div>
      {children}
    </div>
  );
}

function TabNavigation({ activeTab, setActiveTab }) {
  return (
    <div className="mb-8 overflow-x-auto scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
      <div className="flex justify-center space-x-1 min-w-max bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center align-center space-x-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === tab.id
              ? 'bg-white dark:bg-slate-900 text-black dark:text-black shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-700/50'
              }`}
          >
            <span>{tab.icon}</span>
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function Toast({ show, message, type = 'success', onClose }) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(onClose, 4000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  if (!show) return null;

  const styles = {
    success: 'bg-slate-800',
    error: 'bg-slate-900',
    info: 'bg-black',
    warning: 'bg-slate-600',
  };

  const icons = {
    success: '✅',
    error: '❌',
    info: 'ℹ️',
    warning: '⚠️',
  };

  return (
    <div className={`fixed bottom-6 right-6 ${styles[type]} text-white px-6 py-3 rounded-lg shadow-xl flex items-center space-x-3 z-50 animate-slideUp`}>
      <span>{icons[type]}</span>
      <span>{message}</span>
      <button onClick={onClose} className="ml-2 hover:opacity-75">✕</button>
    </div>
  );
}

// ============================================
// SEÇÕES DE CONFIGURAÇÃO
// ============================================

function ProfileSection({ profile, setProfile, onSave, saving, toast }) {
  const avatarInputRef = useRef(null);
  const coverInputRef = useRef(null);
  const [avatarPreview, setAvatarPreview] = useState(profile.avatar);
  const [coverPreview, setCoverPreview] = useState(profile.coverImage);

  useEffect(() => {
    setAvatarPreview(profile.avatar);
    setCoverPreview(profile.coverImage);
  }, [profile.avatar, profile.coverImage]);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast('Imagem muito grande.  Máximo 5MB. ', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
        setProfile({ ...profile, avatarFile: file, avatar: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCoverChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast('Imagem muito grande. Máximo 10MB.', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverPreview(reader.result);
        setProfile({ ...profile, coverFile: file, coverImage: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'PC';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  return (
    <>
      {/* Avatar e Cover */}
      <SettingsCard
        title="Foto de Perfil & Capa"
        description="Sua imagem pública que será exibida para assinantes"
      >
        {/* Cover Image */}
        <div className="relative mb-16">
          <div
            className="h-40 sm:h-52 bg-slate-200 dark:bg-slate-800 rounded-xl overflow-hidden cursor-pointer group"
            onClick={() => coverInputRef.current?.click()}
          >
            {coverPreview ? (
              <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center text-white/70">
                  <span className="text-4xl mb-2 block">🖼️</span>
                  <span>Clique para adicionar capa</span>
                </div>
              </div>
            )}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-white font-medium flex items-center space-x-2">
                <span>📷</span>
                <span>Alterar capa</span>
              </span>
            </div>
          </div>
          <input
            ref={coverInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleCoverChange}
            className="hidden"
          />

          {/* Avatar */}
          <div className="absolute -bottom-12 left-6">
            <div
              className="relative w-28 h-28 rounded-full border-4 border-white dark:border-slate-900 overflow-hidden cursor-pointer group shadow-xl"
              onClick={() => avatarInputRef.current?.click()}
            >
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
                  <span className="text-white font-bold text-2xl">
                    {getInitials(profile.displayName)}
                  </span>
                </div>
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-white text-2xl">📷</span>
              </div>
            </div>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </div>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 mt-4">
          📷 <strong>Avatar:</strong> Recomendado 400x400px, máx 5MB (JPG, PNG, GIF, WebP)<br />
          🖼️ <strong>Capa:</strong> Recomendado 1500x500px, máx 10MB (JPG, PNG, WebP)
        </p>
      </SettingsCard>

      {/* Informações Básicas */}
      <SettingsCard
        title="Informações Básicas"
        description="Dados que aparecem no seu perfil público"
      >
        <div className="grid sm:grid-cols-2 gap-5">
          <FormGroup label="Nome de exibição" htmlFor="displayName" required>
            <Input
              id="displayName"
              value={profile.displayName}
              onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
              placeholder="Seu nome artístico"
            />
          </FormGroup>

          <FormGroup label="Username" htmlFor="username" required hint="flowconnect.com/@username">
            <Input
              id="username"
              value={profile.username}
              onChange={(e) => setProfile({
                ...profile,
                username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '')
              })}
              placeholder="seu_username"
              prefix="@"
            />
          </FormGroup>
        </div>

        <FormGroup label="Bio / Sobre mim" htmlFor="bio" hint="Conte um pouco sobre você e seu conteúdo">
          <TextArea
            id="bio"
            value={profile.bio}
            onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
            placeholder="Olá!  Sou criador de conteúdo exclusivo..."
            rows={4}
            maxLength={500}
          />
        </FormGroup>

        <div className="grid sm:grid-cols-2 gap-5">
          <FormGroup label="Localização" htmlFor="location">
            <Input
              id="location"
              value={profile.location}
              onChange={(e) => setProfile({ ...profile, location: e.target.value })}
              placeholder="São Paulo, Brasil"
            />
          </FormGroup>

          <FormGroup label="Website" htmlFor="website">
            <Input
              id="website"
              type="url"
              value={profile.website}
              onChange={(e) => setProfile({ ...profile, website: e.target.value })}
              placeholder="https://seusite.com"
            />
          </FormGroup>
        </div>

        <FormGroup label="Categoria principal" htmlFor="category">
          <Select
            id="category"
            value={profile.category}
            onChange={(e) => setProfile({ ...profile, category: e.target.value })}
            options={CATEGORIES.map(c => ({ value: c.toLowerCase(), label: c }))}
            placeholder="Selecione uma categoria"
          />
        </FormGroup>
      </SettingsCard>

      {/* Identidade */}
      <SettingsCard
        title="Identidade (Opcional)"
        description="Informações para ajudar assinantes a encontrar você"
      >
        <div className="grid sm:grid-cols-2 gap-5">
          <FormGroup label="Identidade de gênero" htmlFor="genderIdentity">
            <Select
              id="genderIdentity"
              value={profile.genderIdentity}
              onChange={(e) => setProfile({ ...profile, genderIdentity: e.target.value })}
              options={GENDERS}
              placeholder="Selecione (opcional)"
            />
          </FormGroup>

          <FormGroup label="Orientação sexual" htmlFor="orientation">
            <Select
              id="orientation"
              value={profile.orientation}
              onChange={(e) => setProfile({ ...profile, orientation: e.target.value })}
              options={ORIENTATIONS}
              placeholder="Selecione (opcional)"
            />
          </FormGroup>
        </div>

        <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
          <p className="text-sm text-black dark:text-black">
            🏳️‍🌈 Essas informações são opcionais e ajudam a comunidade LGBT+ a
            encontrar criadores com identidades semelhantes.
          </p>
        </div>
      </SettingsCard>

      {/* Redes Sociais */}
      <SettingsCard
        title="Redes Sociais"
        description="Links para suas outras plataformas"
      >
        <div className="space-y-4">
          {[
            { key: 'twitter', icon: '𝕏', placeholder: 'https://twitter.com/username' },
            { key: 'instagram', icon: '📸', placeholder: 'https://instagram.com/username' },
            { key: 'tiktok', icon: '🎵', placeholder: 'https://tiktok.com/@username' },
            { key: 'youtube', icon: '▶️', placeholder: 'https://youtube.com/@channel' },
          ].map((social) => (
            <div key={social.key} className="flex items-center space-x-3">
              <span className="text-xl w-8 text-center">{social.icon}</span>
              <div className="flex-1">
                <Input
                  value={profile.socialLinks?.[social.key] || ''}
                  onChange={(e) => setProfile({
                    ...profile,
                    socialLinks: { ...profile.socialLinks, [social.key]: e.target.value }
                  })}
                  placeholder={social.placeholder}
                />
              </div>
            </div>
          ))}
        </div>
      </SettingsCard>

      {/* Botão Salvar */}
      <div className="flex justify-end">
        <Button onClick={onSave} loading={saving} size="lg">
          💾 Salvar Perfil
        </Button>
      </div>
    </>
  );
}

function AccountSection({ account, setAccount, onSave, saving, toast }) {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordError, setPasswordError] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  const handlePasswordChange = async () => {
    setPasswordError('');

    if (!passwordData.currentPassword) {
      setPasswordError('Digite sua senha atual');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setPasswordError('A nova senha deve ter pelo menos 8 caracteres');
      return;
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(passwordData.newPassword)) {
      setPasswordError('Senha deve conter maiúsculas, minúsculas e números');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('As senhas não coincidem');
      return;
    }

    setChangingPassword(true);
    try {
      // TODO: Chamar API de alteração de senha
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast('Senha alterada com sucesso!', 'success');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast('Erro ao alterar senha', 'error');
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <>
      {/* Email */}
      <SettingsCard title="Email" description="Seu email de acesso e comunicação">
        <FormGroup label="Endereço de email" htmlFor="email" required>
          <Input
            id="email"
            type="email"
            value={account.email}
            onChange={(e) => setAccount({ ...account, email: e.target.value })}
            placeholder="seu@email.com"
          />
        </FormGroup>

        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
          <div className="flex items-center space-x-2">
            <span className={`w-3 h-3 rounded-full ${account.emailVerified ? 'bg-slate-800' : 'bg-slate-600'}`}></span>
            <span className="text-sm text-slate-700 dark:text-slate-300">
              {account.emailVerified ? 'Email verificado' : 'Email não verificado'}
            </span>
          </div>
          {!account.emailVerified && (
            <Button variant="outline" size="sm">Verificar email</Button>
          )}
        </div>
      </SettingsCard>

      {/* Alterar Senha */}
      <SettingsCard title="Alterar Senha" description="Mantenha sua conta segura">
        <FormGroup label="Senha atual" htmlFor="currentPassword" required>
          <div className="relative">
            <Input
              id="currentPassword"
              type={showCurrentPassword ? 'text' : 'password'}
              value={passwordData.currentPassword}
              onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showCurrentPassword ? '🙈' : '👁️'}
            </button>
          </div>
        </FormGroup>

        <div className="grid sm:grid-cols-2 gap-5">
          <FormGroup label="Nova senha" htmlFor="newPassword" required error={passwordError}>
            <div className="relative">
              <Input
                id="newPassword"
                type={showNewPassword ? 'text' : 'password'}
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showNewPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </FormGroup>

          <FormGroup label="Confirmar nova senha" htmlFor="confirmPassword" required>
            <Input
              id="confirmPassword"
              type="password"
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
              placeholder="••••••••"
            />
          </FormGroup>
        </div>

        <p className="text-xs text-slate-500 mb-4">
          Mínimo 8 caracteres, com maiúsculas, minúsculas e números
        </p>

        <div className="flex justify-end">
          <Button
            onClick={handlePasswordChange}
            loading={changingPassword}
            disabled={!passwordData.currentPassword || !passwordData.newPassword}
          >
            🔐 Alterar Senha
          </Button>
        </div>
      </SettingsCard>

      {/* 2FA */}
      <SettingsCard
        title="Autenticação em Dois Fatores (2FA)"
        description="Adicione uma camada extra de segurança"
      >
        <Toggle
          id="twoFactorEnabled"
          checked={account.twoFactorEnabled}
          onChange={(checked) => setAccount({ ...account, twoFactorEnabled: checked })}
          label="Ativar 2FA"
          description="Use um app autenticador como Google Authenticator ou Authy"
        />

        {!account.twoFactorEnabled && (
          <Button variant="outline" className="mt-4">🔒 Configurar 2FA</Button>
        )}
      </SettingsCard>

      {/* Excluir Conta */}
      <SettingsCard title="Zona de Perigo" description="Ações irreversíveis">
        <div className="bg-slate-900 dark:bg-slate-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <h4 className="font-semibold text-slate-900 dark:text-slate-900 mb-2">Excluir Conta</h4>
          <p className="text-sm text-slate-900 dark:text-slate-900 mb-4">
            Ao excluir sua conta, todos os seus dados, conteúdos, assinantes e
            ganhos serão permanentemente removidos. Esta ação não pode ser desfeita.
          </p>
          <Button variant="danger" size="sm">🗑️ Excluir minha conta</Button>
        </div>
      </SettingsCard>
    </>
  );
}

function SubscriptionSection({ subscription, setSubscription, onSave, saving }) {
  const creatorEarnings = (subscription.monthlyPrice || 0) * 0.9;

  return (
    <>
      {/* Preço da Assinatura */}
      <SettingsCard
        title="Preço da Assinatura"
        description="Defina o valor mensal para acessar seu conteúdo exclusivo"
      >
        <div className="grid sm:grid-cols-2 gap-6">
          <FormGroup label="Preço mensal (USD)" htmlFor="monthlyPrice" required hint="Mínimo $4.99, máximo $49.99">
            <Input
              id="monthlyPrice"
              type="number"
              min="4.99"
              max="49.99"
              step="0.01"
              value={subscription.monthlyPrice}
              onChange={(e) => setSubscription({ ...subscription, monthlyPrice: parseFloat(e.target.value) || 0 })}
              prefix="$"
            />
          </FormGroup>

          <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4">
            <p className="text-sm text-slate-800 dark:text-slate-800">💰 Você recebe:</p>
            <p className="text-3xl font-bold text-slate-800 dark:text-slate-800 mt-1">
              ${creatorEarnings.toFixed(2)}
              <span className="text-sm font-normal text-slate-800 ml-2">/ mês</span>
            </p>
            <p className="text-xs text-slate-800 dark:text-slate-800 mt-1">Taxa da plataforma: 10%</p>
          </div>
        </div>
      </SettingsCard>

      {/* Pacotes de Desconto */}
      <SettingsCard
        title="Pacotes de Desconto"
        description="Ofereça descontos para assinaturas mais longas"
      >
        <div className="space-y-4">
          {[
            { key: 'threeMonths', label: '3 Meses', months: 3 },
            { key: 'sixMonths', label: '6 Meses', months: 6 },
            { key: 'twelveMonths', label: '12 Meses', months: 12 },
          ].map((bundle) => {
            const discount = subscription.discounts?.[bundle.key] || 0;
            const totalPrice = (subscription.monthlyPrice || 0) * bundle.months * (1 - discount / 100);

            return (
              <div key={bundle.key} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">{bundle.label}</p>
                  <p className="text-sm text-slate-500">
                    Total: ${totalPrice.toFixed(2)}
                    {discount > 0 && <span className="text-slate-800 ml-1">(-{discount}%)</span>}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Input
                    type="number"
                    min="0"
                    max="50"
                    value={discount}
                    onChange={(e) => setSubscription({
                      ...subscription,
                      discounts: { ...subscription.discounts, [bundle.key]: parseInt(e.target.value) || 0 }
                    })}
                    className="w-20 text-center"
                  />
                  <span className="text-slate-400">% off</span>
                </div>
              </div>
            );
          })}
        </div>
      </SettingsCard>

      {/* Promoção */}
      <SettingsCard
        title="Promoção Ativa"
        description="Crie uma promoção temporária para novos assinantes"
      >
        <Toggle
          id="promoActive"
          checked={subscription.promoActive}
          onChange={(checked) => setSubscription({ ...subscription, promoActive: checked })}
          label="Ativar promoção"
          description="Ofereça desconto para novos assinantes por tempo limitado"
        />

        {subscription.promoActive && (
          <div className="mt-4 grid sm:grid-cols-3 gap-4">
            <FormGroup label="Desconto (%)" htmlFor="promoDiscount">
              <Input
                id="promoDiscount"
                type="number"
                min="5"
                max="70"
                value={subscription.promoDiscount}
                onChange={(e) => setSubscription({ ...subscription, promoDiscount: parseInt(e.target.value) || 0 })}
              />
            </FormGroup>

            <FormGroup label="Duração (dias)" htmlFor="promoDuration">
              <Input
                id="promoDuration"
                type="number"
                min="1"
                max="30"
                value={subscription.promoDuration}
                onChange={(e) => setSubscription({ ...subscription, promoDuration: parseInt(e.target.value) || 0 })}
              />
            </FormGroup>

            <FormGroup label="Válido até" htmlFor="promoExpiry">
              <Input
                id="promoExpiry"
                type="date"
                value={subscription.promoExpiry}
                onChange={(e) => setSubscription({ ...subscription, promoExpiry: e.target.value })}
              />
            </FormGroup>
          </div>
        )}
      </SettingsCard>

      {/* Trial Gratuito */}
      <SettingsCard
        title="Período de Teste Gratuito"
        description="Permita que novos assinantes experimentem gratuitamente"
      >
        <Toggle
          id="trialEnabled"
          checked={subscription.trialEnabled}
          onChange={(checked) => setSubscription({ ...subscription, trialEnabled: checked })}
          label="Oferecer trial gratuito"
          description="Novos assinantes podem testar por alguns dias antes de pagar"
        />

        {subscription.trialEnabled && (
          <FormGroup label="Dias de trial" htmlFor="trialDays" className="mt-4">
            <Input
              id="trialDays"
              type="number"
              min="1"
              max="7"
              value={subscription.trialDays}
              onChange={(e) => setSubscription({ ...subscription, trialDays: parseInt(e.target.value) || 0 })}
              className="w-32"
            />
          </FormGroup>
        )}
      </SettingsCard>

      {/* Botão Salvar */}
      <div className="flex justify-end">
        <Button onClick={onSave} loading={saving} size="lg">
          💾 Salvar Preços
        </Button>
      </div>
    </>
  );
}

function PaymentsSection({ payments, setPayments, onSave, saving }) {
  return (
    <>
      {/* Método de Recebimento */}
      <SettingsCard
        title="Método de Recebimento"
        description="Como você deseja receber seus pagamentos"
      >
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { id: 'web3', icon: '🔐', label: 'Web3 Wallet', desc: 'USDC na Polygon' },
            { id: 'manual', icon: '🏦', label: 'Manual', desc: 'Transferência manual' },
          ].map((method) => (
            <button
              key={method.id}
              onClick={() => setPayments({ ...payments, withdrawMethod: method.id })}
              className={`p-4 rounded-xl border-2 transition-all text-left ${payments.withdrawMethod === method.id
                ? 'border-black dark:border-white bg-slate-100 dark:bg-slate-800'
                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
            >
              <span className="text-3xl block mb-2">{method.icon}</span>
              <p className="font-medium text-slate-900 dark:text-white">{method.label}</p>
              <p className="text-xs text-slate-500">{method.desc}</p>
            </button>
          ))}
        </div>
      </SettingsCard>

      {/* Web3 Wallet Config — com guia amigável */}
      {payments.withdrawMethod === 'web3' && (
        <SettingsCard title="Configurar Recebimentos" description="Configure sua carteira para receber pagamentos dos seus assinantes">

          {/* Guia passo a passo */}
          <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-5 mb-6 space-y-4">
            <h4 className="font-semibold text-slate-900 dark:text-white text-sm">📖 Como configurar em 3 passos simples:</h4>

            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-black text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">1</div>
                <div>
                  <p className="font-medium text-slate-900 dark:text-white text-sm">Crie uma carteira digital gratuita</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Baixe o app <strong>MetaMask</strong> ou <strong>Trust Wallet</strong> no seu celular (disponível na App Store e Google Play). Crie uma conta seguindo as instruções do app — leva menos de 2 minutos.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-black text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">2</div>
                <div>
                  <p className="font-medium text-slate-900 dark:text-white text-sm">Copie o endereço da sua carteira</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    No app, toque no endereço que começa com <strong>0x...</strong> para copiar. Certifique-se de estar na <strong>rede Polygon</strong> (em alguns apps precisa adicionar a rede manualmente).
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-black text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">3</div>
                <div>
                  <p className="font-medium text-slate-900 dark:text-white text-sm">Cole aqui embaixo e salve</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Pronto! A partir daí, todos os pagamentos que receber vão direto para a sua carteira, sem intermediários.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Campo da wallet */}
          <FormGroup label="Endereço da sua carteira" htmlFor="payoutWallet" required hint="Começa com 0x e tem 42 caracteres">
            <Input
              id="payoutWallet"
              value={payments.payoutWallet || ''}
              onChange={(e) => setPayments({ ...payments, payoutWallet: e.target.value })}
              placeholder="0x..."
            />
          </FormGroup>

          {/* Avisos importantes */}
          <div className="mt-4 space-y-3">
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
              <p className="text-xs text-amber-800 dark:text-amber-300">
                ⚠️ <strong>Atenção:</strong> Confira que o endereço está correto antes de salvar. Pagamentos enviados para um endereço errado não podem ser recuperados.
              </p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <p className="text-xs text-blue-800 dark:text-blue-300">
                💡 <strong>Dica:</strong> Você recebe em <strong>USDC</strong> (dólar digital) na rede Polygon. Pode converter para dinheiro real a qualquer momento no app da sua carteira ou em uma exchange como Binance.
              </p>
            </div>
          </div>
        </SettingsCard>
      )}


      {/* Saque Automático */}
      <SettingsCard
        title="Saque Automático"
        description="Configure saques automáticos quando atingir um valor"
      >
        <Toggle
          id="autoWithdraw"
          checked={payments.autoWithdraw}
          onChange={(checked) => setPayments({ ...payments, autoWithdraw: checked })}
          label="Ativar saque automático"
          description="Seus ganhos serão transferidos automaticamente"
        />

        {payments.autoWithdraw && (
          <FormGroup label="Valor mínimo (USD)" htmlFor="autoWithdrawMin" className="mt-4">
            <Input
              id="autoWithdrawMin"
              type="number"
              min="50"
              step="10"
              value={payments.autoWithdrawMin}
              onChange={(e) => setPayments({ ...payments, autoWithdrawMin: parseInt(e.target.value) || 50 })}
              prefix="$"
              className="w-40"
            />
          </FormGroup>
        )}
      </SettingsCard>

      {/* Botão Salvar */}
      <div className="flex justify-end">
        <Button onClick={onSave} loading={saving} size="lg">
          💾 Salvar Pagamentos
        </Button>
      </div>
    </>
  );
}

function NotificationsSection({ notifications, setNotifications, onSave, saving }) {
  const notificationOptions = [
    { key: 'newSubscriber', label: 'Novo assinante', desc: 'Quando alguém assinar seu perfil', icon: '⭐' },
    { key: 'newMessage', label: 'Nova mensagem', desc: 'Quando receber uma mensagem', icon: '💬' },
    { key: 'newTip', label: 'Nova gorjeta', desc: 'Quando receber uma gorjeta', icon: '💰' },
    { key: 'newComment', label: 'Novo comentário', desc: 'Quando alguém comentar', icon: '💭' },
    { key: 'newLike', label: 'Nova curtida', desc: 'Quando alguém curtir', icon: '❤️' },
    { key: 'ppvPurchase', label: 'Compra PPV', desc: 'Quando alguém comprar conteúdo PPV', icon: '🎬' },
    { key: 'payoutProcessed', label: 'Saque processado', desc: 'Quando seu saque for processado', icon: '🏦' },
  ];

  return (
    <>
      {/* Email Notifications */}
      <SettingsCard title="Notificações por Email" description="Escolha quais emails receber">
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {notificationOptions.map((opt) => (
            <Toggle
              key={`email_${opt.key}`}
              id={`email_${opt.key}`}
              checked={notifications.email?.[opt.key] ?? true}
              onChange={(checked) => setNotifications({
                ...notifications,
                email: { ...notifications.email, [opt.key]: checked }
              })}
              label={`${opt.icon} ${opt.label}`}
              description={opt.desc}
            />
          ))}
        </div>
      </SettingsCard>
      {/* Push Notifications */}
      <SettingsCard title="Notificações Push" description="Notificações no navegador">
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {notificationOptions.slice(0, 5).map((opt) => (
            <Toggle
              key={`push_${opt.key}`}
              id={`push_${opt.key}`}
              checked={notifications.push?.[opt.key] ?? true}
              onChange={(checked) => setNotifications({
                ...notifications,
                push: { ...notifications.push, [opt.key]: checked }
              })}
              label={`${opt.icon} ${opt.label}`}
              description={opt.desc}
            />
          ))}
        </div>
      </SettingsCard>
      {/* Marketing */}
      <SettingsCard title="Marketing e Novidades" description="Comunicações promocionais">
        <Toggle
          id="marketing"
          checked={notifications.marketing}
          onChange={(checked) => setNotifications({ ...notifications, marketing: checked })}
          label="📧 Emails de marketing"
          description="Novidades, promoções e dicas para criadores"
        />

        <Toggle
          id="newsletter"
          checked={notifications.newsletter}
          onChange={(checked) => setNotifications({ ...notifications, newsletter: checked })}
          label="📰 Newsletter semanal"
          description="Resumo de performance e tendências"
        />
      </SettingsCard>

      {/* Botão Salvar */}
      <div className="flex justify-end">
        <Button onClick={onSave} loading={saving} size="lg">
          💾 Salvar Notificações
        </Button>
      </div>
    </>
  );
}

function PrivacySection({ privacy, setPrivacy, onSave, saving }) {
  return (
    <>
      {/* Visibilidade */}
      <SettingsCard title="Visibilidade do Perfil" description="Controle quem pode ver seu perfil">
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          <Toggle
            id="publicProfile"
            checked={privacy.publicProfile}
            onChange={(checked) => setPrivacy({ ...privacy, publicProfile: checked })}
            label="🌐 Perfil público"
            description="Seu perfil pode ser encontrado em buscas"
          />

          <Toggle
            id="showActivity"
            checked={privacy.showActivity}
            onChange={(checked) => setPrivacy({ ...privacy, showActivity: checked })}
            label="🟢 Mostrar quando online"
            description="Exibir status de atividade"
          />

          <Toggle
            id="showSubscriberCount"
            checked={privacy.showSubscriberCount}
            onChange={(checked) => setPrivacy({ ...privacy, showSubscriberCount: checked })}
            label="👥 Mostrar número de assinantes"
            description="Exibir quantos assinantes você tem"
          />
        </div>
      </SettingsCard>

      {/* Mensagens */}
      <SettingsCard title="Mensagens" description="Controle quem pode enviar mensagens">
        <FormGroup label="Quem pode enviar mensagens" htmlFor="messagePermission">
          <Select
            id="messagePermission"
            value={privacy.messagePermission}
            onChange={(e) => setPrivacy({ ...privacy, messagePermission: e.target.value })}
            options={[
              { value: 'everyone', label: 'Todos' },
              { value: 'subscribers', label: 'Apenas assinantes' },
              { value: 'nobody', label: 'Ninguém' },
            ]}
          />
        </FormGroup>

        <Toggle
          id="allowTips"
          checked={privacy.allowTips}
          onChange={(checked) => setPrivacy({ ...privacy, allowTips: checked })}
          label="💰 Permitir gorjetas"
          description="Assinantes podem enviar gorjetas"
        />
      </SettingsCard>

      {/* Proteção de Conteúdo */}
      <SettingsCard title="Proteção de Conteúdo" description="Ferramentas para proteger seu conteúdo">
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          <Toggle
            id="watermark"
            checked={privacy.watermark}
            onChange={(checked) => setPrivacy({ ...privacy, watermark: checked })}
            label="💧 Marca d'água automática"
            description="Adicionar seu username em fotos e vídeos"
          />

          <Toggle
            id="disableScreenshots"
            checked={privacy.disableScreenshots}
            onChange={(checked) => setPrivacy({ ...privacy, disableScreenshots: checked })}
            label="📵 Bloquear screenshots"
            description="Tentar impedir capturas de tela (quando possível)"
          />

          <Toggle
            id="hideFromSearch"
            checked={privacy.hideFromSearch}
            onChange={(checked) => setPrivacy({ ...privacy, hideFromSearch: checked })}
            label="🔍 Ocultar de buscadores"
            description="Impedir indexação por Google"
          />
        </div>
      </SettingsCard>

      {/* Restrições Geográficas */}
      <SettingsCard title="Restrições Geográficas" description="Bloqueie acesso de certas regiões">
        <FormGroup
          label="Bloquear países"
          htmlFor="blockedCountries"
          hint="Separe os códigos por vírgula (ex: BR, US, PT)"
        >
          <Input
            id="blockedCountries"
            value={privacy.blockedCountries?.join(', ') || ''}
            onChange={(e) => setPrivacy({
              ...privacy,
              blockedCountries: e.target.value.split(',').map(c => c.trim().toUpperCase()).filter(c => c)
            })}
            placeholder="BR, US, PT..."
          />
        </FormGroup>
      </SettingsCard>

      {/* Botão Salvar */}
      <div className="flex justify-end">
        <Button onClick={onSave} loading={saving} size="lg">
          💾 Salvar Privacidade
        </Button>
      </div>
    </>
  );
}

function ContentSection({ content, setContent, onSave, saving }) {
  return (
    <>
      {/* Upload Settings */}
      <SettingsCard title="Configurações de Upload" description="Preferências padrão para novos posts">
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          <Toggle
            id="defaultPPV"
            checked={content.defaultPPV}
            onChange={(checked) => setContent({ ...content, defaultPPV: checked })}
            label="💎 Posts PPV por padrão"
            description="Novos posts serão pay-per-view automaticamente"
          />

          <Toggle
            id="autoPublish"
            checked={content.autoPublish}
            onChange={(checked) => setContent({ ...content, autoPublish: checked })}
            label="📤 Publicar automaticamente"
            description="Posts são publicados imediatamente"
          />

          <Toggle
            id="commentsEnabled"
            checked={content.commentsEnabled}
            onChange={(checked) => setContent({ ...content, commentsEnabled: checked })}
            label="💬 Comentários habilitados"
            description="Permitir comentários por padrão"
          />
        </div>
      </SettingsCard>

      {/* Preço PPV Padrão */}
      <SettingsCard title="Preço Padrão PPV" description="Valor padrão para conteúdo pay-per-view">
        <FormGroup label="Preço padrão (USD)" htmlFor="defaultPPVPrice">
          <Input
            id="defaultPPVPrice"
            type="number"
            min="1"
            max="100"
            step="0.01"
            value={content.defaultPPVPrice}
            onChange={(e) => setContent({ ...content, defaultPPVPrice: parseFloat(e.target.value) || 0 })}
            prefix="$"
            className="w-40"
          />
        </FormGroup>
      </SettingsCard>

      {/* Qualidade de Mídia */}
      <SettingsCard title="Qualidade de Mídia" description="Configurações de processamento">
        <div className="grid sm:grid-cols-2 gap-5">
          <FormGroup label="Qualidade de imagem" htmlFor="imageQuality">
            <Select
              id="imageQuality"
              value={content.imageQuality}
              onChange={(e) => setContent({ ...content, imageQuality: e.target.value })}
              options={[
                { value: 'original', label: 'Original (maior tamanho)' },
                { value: 'high', label: 'Alta (recomendado)' },
                { value: 'medium', label: 'Média (menor tamanho)' },
              ]}
            />
          </FormGroup>

          <FormGroup label="Qualidade de vídeo" htmlFor="videoQuality">
            <Select
              id="videoQuality"
              value={content.videoQuality}
              onChange={(e) => setContent({ ...content, videoQuality: e.target.value })}
              options={[
                { value: '1080p', label: '1080p Full HD' },
                { value: '720p', label: '720p HD' },
                { value: '480p', label: '480p SD' },
              ]}
            />
          </FormGroup>
        </div>
      </SettingsCard>

      {/* Botão Salvar */}
      <div className="flex justify-end">
        <Button onClick={onSave} loading={saving} size="lg">
          💾 Salvar Conteúdo
        </Button>
      </div>
    </>
  );
}

function BlockingSection({ blocking, setBlocking }) {
  const [newBlockUsername, setNewBlockUsername] = useState('');

  const handleBlock = () => {
    if (newBlockUsername && !blocking.blockedUsers?.includes(newBlockUsername)) {
      setBlocking({
        ...blocking,
        blockedUsers: [...(blocking.blockedUsers || []), newBlockUsername]
      });
      setNewBlockUsername('');
    }
  };

  const handleUnblock = (username) => {
    setBlocking({
      ...blocking,
      blockedUsers: blocking.blockedUsers?.filter(u => u !== username) || []
    });
  };

  return (
    <>
      {/* Bloquear Usuário */}
      <SettingsCard
        title="Bloquear Usuário"
        description="Usuários bloqueados não podem ver seu perfil ou enviar mensagens"
      >
        <div className="flex space-x-3">
          <div className="flex-1">
            <Input
              value={newBlockUsername}
              onChange={(e) => setNewBlockUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              placeholder="username"
              prefix="@"
            />
          </div>
          <Button onClick={handleBlock} disabled={!newBlockUsername}>
            🚫 Bloquear
          </Button>
        </div>
      </SettingsCard>

      {/* Lista de Bloqueados */}
      <SettingsCard
        title="Usuários Bloqueados"
        description={`${blocking.blockedUsers?.length || 0} usuário(s) bloqueado(s)`}
      >
        {blocking.blockedUsers?.length > 0 ? (
          <div className="space-y-2">
            {blocking.blockedUsers.map((username) => (
              <div
                key={username}
                className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-slate-300 dark:bg-slate-600 rounded-full flex items-center justify-center">
                    <span className="text-slate-500 dark:text-slate-400">👤</span>
                  </div>
                  <span className="font-medium text-slate-900 dark:text-white">@{username}</span>
                </div>
                <Button variant="outline" size="sm" onClick={() => handleUnblock(username)}>
                  Desbloquear
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500 dark:text-slate-400">
            <span className="text-4xl block mb-2">✨</span>
            Nenhum usuário bloqueado
          </div>
        )}
      </SettingsCard>

      {/* Palavras Bloqueadas */}
      <SettingsCard
        title="Palavras Bloqueadas"
        description="Comentários com essas palavras serão filtrados automaticamente"
      >
        <FormGroup
          label="Palavras bloqueadas"
          htmlFor="blockedWords"
          hint="Separe as palavras por vírgula"
        >
          <TextArea
            id="blockedWords"
            value={blocking.blockedWords?.join(', ') || ''}
            onChange={(e) => setBlocking({
              ...blocking,
              blockedWords: e.target.value.split(',').map(w => w.trim().toLowerCase()).filter(w => w)
            })}
            placeholder="palavra1, palavra2, palavra3..."
            rows={3}
          />
        </FormGroup>
      </SettingsCard>
    </>
  );
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export default function CreatorSettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Estados para cada seção
  const [profile, setProfile] = useState({
    displayName: '',
    username: '',
    bio: '',
    location: '',
    website: '',
    category: '',
    genderIdentity: '',
    orientation: '',
    avatar: null,
    coverImage: null,
    socialLinks: {},
  });

  const [account, setAccount] = useState({
    email: '',
    emailVerified: false,
    twoFactorEnabled: false,
  });

  const [subscription, setSubscription] = useState({
    monthlyPrice: 9.99,
    discounts: { threeMonths: 10, sixMonths: 15, twelveMonths: 20 },
    promoActive: false,
    promoDiscount: 20,
    promoDuration: 7,
    promoExpiry: '',
    trialEnabled: false,
    trialDays: 3,
  });

  const [payments, setPayments] = useState({
    withdrawMethod: 'web3',
    payoutWallet: '',
    walletVerified: false,
    autoWithdraw: false,
    autoWithdrawMin: 100,
  });

  const [notifications, setNotifications] = useState({
    email: {},
    push: {},
    marketing: true,
    newsletter: true,
  });

  const [privacy, setPrivacy] = useState({
    publicProfile: true,
    showActivity: true,
    showSubscriberCount: true,
    messagePermission: 'subscribers',
    allowTips: true,
    watermark: true,
    disableScreenshots: false,
    hideFromSearch: false,
    blockedCountries: [],
  });

  const [content, setContent] = useState({
    defaultPPV: false,
    autoPublish: true,
    commentsEnabled: true,
    defaultPPVPrice: 9.99,
    imageQuality: 'high',
    videoQuality: '1080p',
  });

  const [blocking, setBlocking] = useState({
    blockedUsers: [],
    blockedWords: [],
  });

  // Carregar configurações ao montar
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const response = await api.get('/creator/settings');
      const data = response.data;

      if (data.profile) setProfile({ ...profile, ...data.profile });
      if (data.account) setAccount({ ...account, ...data.account });
      if (data.subscription) setSubscription({ ...subscription, ...data.subscription });
      if (data.payments) setPayments({ ...payments, ...data.payments });
      if (data.notifications) setNotifications({ ...notifications, ...data.notifications });
      if (data.privacy) setPrivacy({ ...privacy, ...data.privacy });
      if (data.content) setContent({ ...content, ...data.content });
      if (data.blocking) setBlocking({ ...blocking, ...data.blocking });

    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      showToast('Erro ao carregar configurações', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  const handleSave = async () => {
    setSaving(true);

    try {
      const formData = new FormData();

      // Adicionar arquivos se existirem
      if (profile.avatarFile) {
        formData.append('avatar', profile.avatarFile);
      }
      if (profile.coverFile) {
        formData.append('cover', profile.coverFile);
      }

      // Preparar dados
      const settingsData = {
        profile: {
          displayName: profile.displayName,
          username: profile.username,
          bio: profile.bio,
          location: profile.location,
          website: profile.website,
          category: profile.category,
          genderIdentity: profile.genderIdentity,
          orientation: profile.orientation,
          socialLinks: profile.socialLinks,
        },
        account: {
          email: account.email,
        },
        subscription,
        payments,
        notifications,
        privacy,
        content,
        blocking,
      };

      formData.append('settings', JSON.stringify(settingsData));

      // Enviar para API
      await api.put('/creator/settings', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      showToast('Configurações salvas com sucesso!', 'success');

      // Recarregar para obter URLs atualizadas
      await loadSettings();

    } catch (error) {
      console.error('Erro ao salvar:', error);
      const errorMessage = error.response?.data?.message || 'Erro ao salvar configurações';
      showToast(errorMessage, 'error');
    } finally {
      setSaving(false);
    }
  };

  const renderTabContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <svg className="animate-spin h-12 w-12 text-black mx-auto mb-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="text-slate-600 dark:text-slate-400">Carregando configurações...</p>
          </div>
        </div>
      );
    }

    const commonProps = { onSave: handleSave, saving, toast: showToast };

    switch (activeTab) {
      case 'profile':
        return <ProfileSection profile={profile} setProfile={setProfile} {...commonProps} />;
      case 'account':
        return <AccountSection account={account} setAccount={setAccount} {...commonProps} />;
      case 'subscription':
        return <SubscriptionSection subscription={subscription} setSubscription={setSubscription} {...commonProps} />;
      case 'payments':
        return <PaymentsSection payments={payments} setPayments={setPayments} {...commonProps} />;
      case 'notifications':
        return <NotificationsSection notifications={notifications} setNotifications={setNotifications} {...commonProps} />;
      case 'privacy':
        return <PrivacySection privacy={privacy} setPrivacy={setPrivacy} {...commonProps} />;
      case 'content':
        return <ContentSection content={content} setContent={setContent} {...commonProps} />;
      case 'blocking':
        return <BlockingSection blocking={blocking} setBlocking={setBlocking} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950">
      <CreatorSidebar />

      <main className="flex-1 overflow-y-auto">
        <div className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-2">
              ⚙️ Configurações
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Gerencie seu perfil, conta e preferências
            </p>
          </div>

          {/* Tabs */}
          <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />

          {/* Content */}
          <div className="mb-8">
            {renderTabContent()}
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
            <Link
              to="/creator/dashboard"
              className="inline-flex items-center text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <span className="mr-2">←</span>
              Voltar ao Dashboard
            </Link>
          </div>
        </div>
      </main>

      {/* Toast Notification */}
      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, show: false })}
      />
    </div>
  );
}
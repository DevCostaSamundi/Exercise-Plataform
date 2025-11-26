import { Link } from 'react-router-dom';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-8">
        <Link to="/" className="text-indigo-600 hover:text-indigo-700 mb-4 inline-block">← Voltar</Link>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">Termos de Uso</h1>
        <div className="prose dark:prose-invert max-w-none">
          <p className="text-slate-600 dark:text-slate-400">
            Esta página será preenchida com os termos de uso completos da plataforma.
          </p>
          {/* Conteúdo completo será adicionado depois */}
        </div>
      </div>
    </div>
  );
}
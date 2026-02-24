import { useParams, Link } from 'react-router-dom';

export default function CreatorPostEditPage() {
  const { id } = useParams();

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-50 flex items-center justify-center px-4">
      <div className="max-w-xl w-full space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Editar Post #{id}</h1>
          <Link
            to="/creator/posts"
            className="text-sm text-slate-500 hover:text-black dark:hover:text-white underline"
          >
            Voltar para Meus Posts
          </Link>
        </div>
        <p className="text-slate-400">
          Esta é uma página placeholder para edição de post. Depois do backend você pode carregar os
          dados do post `{id}` e reutilizar o formulário de upload com os campos preenchidos.
        </p>
      </div>
    </div>
  );
}
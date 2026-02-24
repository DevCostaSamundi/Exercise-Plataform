// src/components/AgeGate.jsx
import { useState } from 'react';

export default function AgeGate({ onVerify }) {
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [error, setError] = useState('');

  const years = Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  const handleSubmit = (e) => {
    e.preventDefault();
    const birthDate = new Date(year, month - 1, day);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;

    if (age >= 18) {
      localStorage.setItem('adultVerified', 'true');
      onVerify();
    } else {
      setError('Você deve ter pelo menos 18 anos para acessar este conteúdo.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center p-4">
      <div className="bg-gray-800 text-white rounded-xl shadow-2xl p-8 max-w-md w-full">
        <h2 className="text-2xl font-bold text-center mb-2">Verificação de Idade</h2>
        <p className="text-gray-300 text-center mb-6">
          Este site contém conteúdo para maiores de 18 anos. Por favor, confirme sua data de nascimento.
        </p>

        {error && <p className="text-slate-900 text-center mb-4">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <select
              value={day}
              onChange={(e) => setDay(e.target.value)}
              className="bg-gray-700 border border-gray-600 rounded-lg p-2 text-center focus:ring-black focus:outline-none"
            >
              <option value="">Dia</option>
              {days.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>

            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="bg-gray-700 border border-gray-600 rounded-lg p-2 text-center focus:ring-black focus:outline-none"
            >
              <option value="">Mês</option>
              {months.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>

            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="bg-gray-700 border border-gray-600 rounded-lg p-2 text-center focus:ring-black focus:outline-none"
            >
              <option value="">Ano</option>
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="w-full bg-black hover:bg-black py-3 rounded-lg font-semibold transition duration-200"
          >
            Confirmar e Entrar
          </button>
        </form>
      </div>
    </div>
  );
}
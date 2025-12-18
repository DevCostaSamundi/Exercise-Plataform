import { useState, useEffect } from 'react';

export default function AuthDebugger() {
    const [logs, setLogs] = useState([]);
    const [tokenInfo, setTokenInfo] = useState(null);
    const [testResults, setTestResults] = useState({});

    const addLog = (type, message, data = null) => {
        const log = {
            type,
            message,
            data,
            timestamp: new Date().toLocaleTimeString()
        };
        setLogs(prev => [...prev, log]);
    };

    useEffect(() => {
        checkLocalStorage();
    }, []);

    const checkLocalStorage = () => {
        const keys = ['authToken', 'accessToken', 'pride_connect_token', 'refreshToken', 'user'];
        const storage = {};

        keys.forEach(key => {
            const value = localStorage.getItem(key);
            if (value) {
                storage[key] = value;
            }
        });

        setTokenInfo(storage);

        if (Object.keys(storage).length === 0) {
            addLog('warning', 'Nenhum token encontrado no localStorage!');
        } else {
            addLog('success', 'Tokens encontrados:', Object.keys(storage));
        }
    };

    const testLogin = async () => {
        addLog('info', 'Iniciando teste de login...');

        try {
            const response = await fetch('http://localhost:5000/api/v1/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: 'pislon@gmail.com', // ALTERE PARA SEU EMAIL DE TESTE
                    password: 'Pislon123' // ALTERE PARA SUA SENHA DE TESTE
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                addLog('error', 'Erro no login', result);
                setTestResults(prev => ({ ...prev, login: 'FALHOU' }));
                return;
            }

            addLog('success', 'Login bem-sucedido!', result);

            // Verificar estrutura da resposta
            if (result.data?.accessToken) {
                addLog('success', 'Token encontrado em result.data.accessToken');
                localStorage.setItem('authToken', result.data.accessToken);
            } else if (result.accessToken) {
                addLog('warning', 'Token encontrado em result.accessToken (estrutura diferente!)');
                localStorage.setItem('authToken', result.accessToken);
            } else if (result.token) {
                addLog('warning', 'Token encontrado em result.token (estrutura diferente!)');
                localStorage.setItem('authToken', result.token);
            } else {
                addLog('error', 'Token NÃO encontrado na resposta!', result);
            }

            setTestResults(prev => ({ ...prev, login: 'SUCESSO' }));
            checkLocalStorage();

        } catch (error) {
            addLog('error', 'Erro de conexão', error.message);
            setTestResults(prev => ({ ...prev, login: 'ERRO' }));
        }
    };

    const testAuthenticatedRequest = async () => {
        addLog('info', 'Testando requisição autenticada...');

        const token = localStorage.getItem('authToken');

        if (!token) {
            addLog('error', 'Token não encontrado no localStorage!');
            setTestResults(prev => ({ ...prev, authenticated: 'SEM TOKEN' }));
            return;
        }

        addLog('info', `Token encontrado: ${token.substring(0, 20)}...`);

        try {
            const response = await fetch('http://localhost:5000/api/v1/creators', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
            });

            const result = await response.json();

            if (response.status === 401) {
                addLog('error', 'Não autorizado! Token inválido ou expirado', result);
                setTestResults(prev => ({ ...prev, authenticated: 'NÃO AUTORIZADO' }));
            } else if (response.ok) {
                addLog('success', 'Requisição autenticada com sucesso!', result);
                setTestResults(prev => ({ ...prev, authenticated: 'SUCESSO' }));
            } else {
                addLog('error', `Erro ${response.status}`, result);
                setTestResults(prev => ({ ...prev, authenticated: `ERRO ${response.status}` }));
            }

        } catch (error) {
            addLog('error', 'Erro de conexão', error.message);
            setTestResults(prev => ({ ...prev, authenticated: 'ERRO' }));
        }
    };

    const clearStorage = () => {
        localStorage.clear();
        setTokenInfo(null);
        addLog('info', 'localStorage limpo!');
        setTestResults({});
    };

    const clearLogs = () => {
        setLogs([]);
    };

    return (
        <div className="min-h-screen bg-slate-900 text-white p-8">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-3xl font-bold mb-8 text-indigo-400">🔍 Auth Debugger</h1>

                {/* Controles */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <button
                        onClick={checkLocalStorage}
                        className="bg-blue-600 hover:bg-blue-700 px-4 py-3 rounded-lg font-semibold transition"
                    >
                        🔎 Check Storage
                    </button>
                    <button
                        onClick={testLogin}
                        className="bg-green-600 hover:bg-green-700 px-4 py-3 rounded-lg font-semibold transition"
                    >
                        🔐 Test Login
                    </button>
                    <button
                        onClick={testAuthenticatedRequest}
                        className="bg-purple-600 hover:bg-purple-700 px-4 py-3 rounded-lg font-semibold transition"
                    >
                        🔑 Test Auth Request
                    </button>
                    <button
                        onClick={clearStorage}
                        className="bg-red-600 hover:bg-red-700 px-4 py-3 rounded-lg font-semibold transition"
                    >
                        🗑️ Clear Storage
                    </button>
                </div>

                {/* Resultados dos Testes */}
                <div className="bg-slate-800 rounded-lg p-6 mb-8">
                    <h2 className="text-xl font-bold mb-4">📊 Resultados dos Testes</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-700 p-4 rounded">
                            <div className="text-sm text-slate-400 mb-1">Login Test</div>
                            <div className={`text-lg font-bold ${testResults.login === 'SUCESSO' ? 'text-green-400' :
                                    testResults.login === 'FALHOU' ? 'text-red-400' : 'text-slate-400'
                                }`}>
                                {testResults.login || 'Não testado'}
                            </div>
                        </div>
                        <div className="bg-slate-700 p-4 rounded">
                            <div className="text-sm text-slate-400 mb-1">Authenticated Request</div>
                            <div className={`text-lg font-bold ${testResults.authenticated === 'SUCESSO' ? 'text-green-400' :
                                    testResults.authenticated?.includes('NÃO') || testResults.authenticated?.includes('ERRO') ? 'text-red-400' : 'text-slate-400'
                                }`}>
                                {testResults.authenticated || 'Não testado'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* LocalStorage Info */}
                {tokenInfo && (
                    <div className="bg-slate-800 rounded-lg p-6 mb-8">
                        <h2 className="text-xl font-bold mb-4">💾 LocalStorage</h2>
                        {Object.keys(tokenInfo).length === 0 ? (
                            <p className="text-slate-400">Nenhum token armazenado</p>
                        ) : (
                            <div className="space-y-2">
                                {Object.entries(tokenInfo).map(([key, value]) => (
                                    <div key={key} className="bg-slate-700 p-3 rounded">
                                        <div className="text-sm text-indigo-400 font-semibold mb-1">{key}</div>
                                        <div className="text-xs text-slate-300 break-all font-mono">
                                            {key === 'user' ? value : `${value.substring(0, 50)}...`}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Logs */}
                <div className="bg-slate-800 rounded-lg p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold">📝 Logs</h2>
                        <button
                            onClick={clearLogs}
                            className="text-sm bg-slate-700 hover:bg-slate-600 px-3 py-1 rounded transition"
                        >
                            Limpar Logs
                        </button>
                    </div>

                    <div className="space-y-2 max-h-96 overflow-y-auto">
                        {logs.length === 0 ? (
                            <p className="text-slate-400 text-center py-8">Nenhum log ainda. Execute um teste!</p>
                        ) : (
                            logs.map((log, index) => (
                                <div
                                    key={index}
                                    className={`p-3 rounded ${log.type === 'success' ? 'bg-green-900/30 border-l-4 border-green-500' :
                                            log.type === 'error' ? 'bg-red-900/30 border-l-4 border-red-500' :
                                                log.type === 'warning' ? 'bg-yellow-900/30 border-l-4 border-yellow-500' :
                                                    'bg-slate-700 border-l-4 border-blue-500'
                                        }`}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="font-semibold">
                                            {log.type === 'success' ? '✅' :
                                                log.type === 'error' ? '❌' :
                                                    log.type === 'warning' ? '⚠️' : 'ℹ️'}
                                            {' '}{log.message}
                                        </span>
                                        <span className="text-xs text-slate-400">{log.timestamp}</span>
                                    </div>
                                    {log.data && (
                                        <pre className="text-xs text-slate-300 mt-2 overflow-x-auto bg-slate-900/50 p-2 rounded">
                                            {JSON.stringify(log.data, null, 2)}
                                        </pre>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Instruções */}
                <div className="mt-8 bg-indigo-900/30 border border-indigo-700 rounded-lg p-6">
                    <h3 className="font-bold text-lg mb-3">📋 Como usar:</h3>
                    <ol className="space-y-2 text-sm text-slate-300">
                        <li><strong>1.</strong> Altere o email/senha no código (linha 45-46) para suas credenciais de teste</li>
                        <li><strong>2.</strong> Clique em "Test Login" para fazer login</li>
                        <li><strong>3.</strong> Verifique se o token foi salvo corretamente</li>
                        <li><strong>4.</strong> Clique em "Test Auth Request" para testar uma requisição autenticada</li>
                        <li><strong>5.</strong> Analise os logs para identificar o problema</li>
                    </ol>
                </div>
            </div>
        </div>
    );
}
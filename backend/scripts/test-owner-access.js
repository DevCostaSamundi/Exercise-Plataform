/**
 * Script para testar acesso de OWNER
 * Simula uma requisição com a wallet do owner
 */

import dotenv from 'dotenv';
dotenv.config();

const OWNER_WALLET = process.env.OWNER_WALLET;

console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log('║            🔐 VERIFICAÇÃO DE ACESSO OWNER                  ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

console.log('📋 Configuração:');
console.log(`   OWNER_WALLET: ${OWNER_WALLET}\n`);

console.log('✅ Como funciona o acesso Admin:\n');
console.log('1. Usuário conecta wallet no frontend');
console.log('2. Backend verifica se wallet === OWNER_WALLET');
console.log('3. Se SIM → Acesso a rotas /api/v1/ai/* (admin)');
console.log('4. Se NÃO → Acesso negado (403 Forbidden)\n');

console.log('🎯 Rotas protegidas (require OWNER_WALLET):\n');
console.log('   GET  /api/v1/ai/marketing-strategy');
console.log('   GET  /api/v1/ai/platform-analytics');
console.log('   POST /api/v1/ai/content-ideas');
console.log('   POST /api/v1/ai/sentiment-analysis');
console.log('   GET  /api/v1/ai/growth-tactics\n');

console.log('💡 Não precisa criar usuário no banco!');
console.log('   A verificação é feita apenas pela wallet conectada.\n');

console.log('╔══════════════════════════════════════════════════════════════╗');
console.log('║  Para testar:                                              ║');
console.log('║  1. Inicie backend: npm start                              ║');
console.log('║  2. Conecte wallet: 0x7a2645A0C5FA3A17e531B204ec89Fd813eb6f3f2 ║');
console.log('║  3. Acesse: http://localhost:5173/admin                    ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

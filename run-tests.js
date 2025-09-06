// Script para ejecutar tests sin PowerShell colgándose
const { execSync } = require('child_process');

try {
  console.log('🧪 EJECUTANDO TESTS DE LA-IA APP...\n');
  
  const result = execSync('npm test -- --reporter=verbose --no-watch', {
    encoding: 'utf8',
    stdio: 'pipe',
    timeout: 60000 // 60 segundos máximo
  });
  
  console.log(result);
  
} catch (error) {
  console.log('📊 RESULTADOS DE TESTS:');
  console.log(error.stdout || error.message);
  
  if (error.stderr) {
    console.log('\n❌ ERRORES:');
    console.log(error.stderr);
  }
}

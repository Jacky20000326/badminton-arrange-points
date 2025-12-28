import { prisma } from './src/lib/prisma';

async function testConnection() {
  try {
    console.log('🔗 正在測試數據庫連接...');

    // 執行簡單的查詢測試連接
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ 數據庫連接成功！');
    console.log('查詢結果:', result);

    // 獲取表的信息（如果表已存在）
    try {
      const tables = await prisma.$queryRaw`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
      `;
      console.log('\n📊 已存在的表:');
      console.log(tables);
    } catch (error) {
      console.log('\n⚠️  無法獲取表信息（可能是因為 schema 還未初始化）');
    }

  } catch (error: any) {
    console.error('❌ 數據庫連接失敗：');
    console.error('錯誤信息:', error.message);
    if (error.code) {
      console.error('錯誤代碼:', error.code);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    console.log('\n✔️  連接已關閉');
  }
}

testConnection();

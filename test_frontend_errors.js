const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // 监听控制台输出
  page.on('console', msg => {
    console.log('CONSOLE:', msg.type(), msg.text());
  });
  
  // 监听页面错误
  page.on('pageerror', error => {
    console.log('PAGE ERROR:', error.message);
  });
  
  // 监听请求失败
  page.on('requestfailed', request => {
    console.log('REQUEST FAILED:', request.url(), request.failure().errorText);
  });
  
  try {
    await page.goto('http://localhost:11010', { waitUntil: 'networkidle2' });
    await page.waitForTimeout(3000); // 等待3秒让页面完全加载
  } catch (error) {
    console.error('Failed to load page:', error);
  } finally {
    await browser.close();
  }
})();
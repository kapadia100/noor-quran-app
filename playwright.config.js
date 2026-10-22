import {defineConfig,devices} from '@playwright/test';
const BASE=process.env.E2E_URL||'http://localhost:4173/';
const chrome={channel:process.env.CI?undefined:'chrome',launchOptions:{args:['--autoplay-policy=no-user-gesture-required']}};
export default defineConfig({testDir:'tests',timeout:90000,retries:process.env.CI?1:0,reporter:[['list']],
 use:{baseURL:BASE,geolocation:{latitude:24.8607,longitude:67.0011},permissions:['geolocation','notifications','accelerometer','gyroscope','magnetometer'],timezoneId:'Asia/Karachi'},
 projects:[{name:'iphone',testDir:'tests/e2e',use:{...devices['iPhone 14'],browserName:'chromium',...chrome}},{name:'android',testDir:'tests/e2e',use:{...devices['Pixel 7'],...chrome}},{name:'webkit-iphone',testDir:'tests/ios',use:{...devices['iPhone 14'],permissions:['geolocation'],channel:undefined,launchOptions:{}}}],
 webServer:process.env.E2E_URL?undefined:{command:'npx vite build && npx vite preview --port 4173',url:BASE,reuseExistingServer:true,timeout:120000}});

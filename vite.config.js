import {defineConfig} from 'vite'
import {readFileSync} from 'fs'
const pkg=JSON.parse(readFileSync(new URL('./package.json',import.meta.url)))
export default defineConfig({base: process.env.BASE || './',define:{__APP_VERSION__:JSON.stringify(pkg.version)}})

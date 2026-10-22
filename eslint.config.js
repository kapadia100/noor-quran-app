import js from '@eslint/js';import globals from 'globals';
export default [{ignores:['dist/**','android/**','ios/**','node_modules/**','public/data/**']},js.configs.recommended,
 {languageOptions:{ecmaVersion:2023,sourceType:'module',globals:{...globals.browser,MediaMetadata:'readonly',__APP_VERSION__:'readonly'}},rules:{'no-empty':['error',{allowEmptyCatch:true}]}},
 {files:['public/sw.js'],languageOptions:{globals:globals.serviceworker}},{files:['tests/**','*.config.js','scripts/**'],languageOptions:{globals:globals.node}}];

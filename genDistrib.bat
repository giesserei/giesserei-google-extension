@echo off & setlocal

set "NODE_PATH=%globalNodeModules%"
call node build/genDistrib.js

@echo off & setlocal

if exist tempBuild rd /s /q tempBuild

call tsc
if errorlevel 1 exit /b

call teslint
if errorlevel 1 exit /b

call rollup -c --silent

@echo off
chcp 65001 >nul
echo ========================================
echo   键词达人 - 例句语音服务
echo ========================================
echo.
echo 电脑IP: 192.168.2.44
echo 端口: 8765
echo 启动中...
echo 启动后请保持此窗口打开
echo.
C:\Python311\python.exe "%~dp0scripts\sentence-tts-server.py"
pause

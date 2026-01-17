@echo off
setlocal enabledelayedexpansion

:MENU
cls
echo ============================================
echo   Docker Compose Connect Tool
echo ============================================
echo.

:: Main menu
echo   1. Search and start docker-compose projects
echo   2. Connect to running containers
echo   3. Stop/Down docker-compose projects
echo   q. Quit
echo.
set "MAIN_CHOICE="
set /p MAIN_CHOICE="Select option: "

if /i "!MAIN_CHOICE!"=="q" goto END
if "!MAIN_CHOICE!"=="1" goto SEARCH_COMPOSE
if "!MAIN_CHOICE!"=="2" goto LIST_CONTAINERS
if "!MAIN_CHOICE!"=="3" goto STOP_COMPOSE

echo Invalid option
timeout /t 1 >nul
goto MENU

:SEARCH_COMPOSE
cls
echo ============================================
echo   Searching docker-compose.yml files...
echo ============================================
echo.

:: Search for docker-compose files in WSL ~/dev
set "SEARCH_PATHS=~/dev"
set COUNT=0

for %%p in (%SEARCH_PATHS%) do (
    for /f "usebackq delims=" %%f in (`wsl bash -c "find %%p -maxdepth 4 -name 'docker-compose.yml' -o -name 'docker-compose.yaml' 2>/dev/null"`) do (
        set /a COUNT+=1
        set "COMPOSE_PATH_!COUNT!=%%f"
        
        :: Get directory name for display
        for /f "usebackq delims=" %%d in (`wsl bash -c "dirname '%%f'"`) do (
            set "DIR_!COUNT!=%%d"
            
            :: Get project name from directory
            for /f "usebackq tokens=*" %%n in (`wsl bash -c "basename '%%d'"`) do (
                set "PROJECT_!COUNT!=%%n"
                echo   !COUNT!. %%n
                echo      Path: %%d
                echo.
            )
        )
    )
)

if !COUNT! equ 0 (
    echo No docker-compose.yml files found
    echo.
    echo Searched in:
    for %%p in (%SEARCH_PATHS%) do echo   - %%p
    echo.
    pause
    goto MENU
)

echo --------------------------------------------
echo   b. Back to main menu
echo --------------------------------------------
echo.

:INPUT_COMPOSE
set "CHOICE="
set /p CHOICE="Enter project number to start (1-!COUNT!): "

if /i "!CHOICE!"=="b" goto MENU

set /a NUM=!CHOICE! 2>nul
if !NUM! lss 1 (
    echo Invalid - too low
    goto INPUT_COMPOSE
)
if !NUM! gtr !COUNT! (
    echo Invalid - too high
    goto INPUT_COMPOSE
)

set "SELECTED_DIR=!DIR_%NUM%!"
set "SELECTED_PROJECT=!PROJECT_%NUM%!"

echo.
echo Selected: !SELECTED_PROJECT!
echo Path: !SELECTED_DIR!
echo.

:: Ask whether to build or not
set "BUILD_CHOICE="
set /p BUILD_CHOICE="Build images before starting? (y/n, default=n): "

if /i "!BUILD_CHOICE!"=="y" (
    set "BUILD_FLAG="
) else (
    set "BUILD_FLAG=--no-build"
)

echo.

echo.
echo Enter sudo password (or press Enter to skip):
for /f "usebackq delims=" %%p in (`powershell -NoProfile -Command "$p = Read-Host -AsSecureString; [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($p))"`) do set "SUDO_PASS=%%p"

echo.
echo Starting docker-compose project...
echo.

if "!SUDO_PASS!"=="" (
    wsl bash -c "cd '!SELECTED_DIR!' && docker compose up -d !BUILD_FLAG! 2>&1"
    set "EXIT_CODE=!ERRORLEVEL!"
) else (
    wsl bash -c "cd '!SELECTED_DIR!' && echo '!SUDO_PASS!' | sudo -S docker compose up -d !BUILD_FLAG! 2>&1"
    set "EXIT_CODE=!ERRORLEVEL!"
)

if !EXIT_CODE! neq 0 (
    echo.
    echo ============================================
    echo ERROR: Failed to start docker-compose project
    echo ============================================
    echo.
    echo This error might be caused by:
    echo   1. Corrupted container state
    echo   2. Permission issues
    echo   3. Image compatibility issues
    echo.
    echo Suggested fixes:
    echo   - Run: docker compose down
    echo   - Or: docker system prune
    echo   - Or: Rebuild with: docker compose up -d --build
    echo.
    pause
    goto MENU
)

echo.
echo Project started successfully!
echo Waiting for containers to be ready...
timeout /t 3 >nul

echo.
echo Press any key to view running containers...
pause >nul
goto LIST_CONTAINERS

:STOP_COMPOSE
cls
echo ============================================
echo   Stop/Down docker-compose projects
echo ============================================
echo.

:: Search for docker-compose files in WSL ~/dev
set "SEARCH_PATHS=~/dev"
set COUNT=0

for %%p in (%SEARCH_PATHS%) do (
    for /f "usebackq delims=" %%f in (`wsl bash -c "find %%p -maxdepth 4 -name 'docker-compose.yml' -o -name 'docker-compose.yaml' 2>/dev/null"`) do (
        set /a COUNT+=1
        set "COMPOSE_PATH_!COUNT!=%%f"
        
        :: Get directory name for display
        for /f "usebackq delims=" %%d in (`wsl bash -c "dirname '%%f'"`) do (
            set "DIR_!COUNT!=%%d"
            
            :: Get project name from directory
            for /f "usebackq tokens=*" %%n in (`wsl bash -c "basename '%%d'"`) do (
                set "PROJECT_!COUNT!=%%n"
                
                :: Check if project has running containers
                for /f "usebackq delims=" %%c in (`wsl bash -c "cd '%%d' && docker-compose ps -q 2>/dev/null | wc -l"`) do (
                    if %%c gtr 0 (
                        echo   !COUNT!. %%n [%%c containers]
                        echo      Path: %%d
                        echo.
                    ) else (
                        echo   !COUNT!. %%n [no containers]
                        echo      Path: %%d
                        echo.
                    )
                )
            )
        )
    )
)

if !COUNT! equ 0 (
    echo No docker-compose.yml files found
    echo.
    pause
    goto MENU
)

echo --------------------------------------------
echo   b. Back to main menu
echo --------------------------------------------
echo.

:INPUT_STOP_COMPOSE
set "CHOICE="
set /p CHOICE="Enter project number to stop (1-!COUNT!): "

if /i "!CHOICE!"=="b" goto MENU

set /a NUM=!CHOICE! 2>nul
if !NUM! lss 1 (
    echo Invalid - too low
    goto INPUT_STOP_COMPOSE
)
if !NUM! gtr !COUNT! (
    echo Invalid - too high
    goto INPUT_STOP_COMPOSE
)

set "SELECTED_DIR=!DIR_%NUM%!"
set "SELECTED_PROJECT=!PROJECT_%NUM%!"

echo.
echo Selected: !SELECTED_PROJECT!
echo Path: !SELECTED_DIR!
echo.

:: Choose stop or down
echo   s. Stop (keep containers)
echo   d. Down (remove containers and networks)
echo   k. Kill all (remove containers, networks, images, volumes)
echo   b. Back
echo.
set "STOP_MODE="
set /p STOP_MODE="Select action (s/d/k/b): "

if /i "!STOP_MODE!"=="b" goto STOP_COMPOSE
if /i "!STOP_MODE!"=="s" (
    set "COMPOSE_ACTION=stop"
    set "ACTION_DESC=Stopping"
) else if /i "!STOP_MODE!"=="d" (
    set "COMPOSE_ACTION=down"
    set "ACTION_DESC=Stopping and removing"
) else if /i "!STOP_MODE!"=="k" (
    set "COMPOSE_ACTION=down --rmi all --volumes"
    set "ACTION_DESC=Stopping and removing everything (containers, images, volumes)"
) else (
    echo Invalid option
    timeout /t 1 >nul
    goto INPUT_STOP_COMPOSE
)

echo.

:: Ask for sudo password if needed
echo Enter sudo password (or press Enter to skip):
for /f "usebackq delims=" %%p in (`powershell -NoProfile -Command "$p = Read-Host -AsSecureString; [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($p))"`) do set "SUDO_PASS=%%p"

echo.
echo !ACTION_DESC! docker-compose project...
echo.

if "!SUDO_PASS!"=="" (
    wsl bash -c "cd '!SELECTED_DIR!' && docker compose !COMPOSE_ACTION! 2>&1"
    set "EXIT_CODE=!ERRORLEVEL!"
) else (
    wsl bash -c "cd '!SELECTED_DIR!' && echo '!SUDO_PASS!' | sudo -S docker compose !COMPOSE_ACTION! 2>&1"
    set "EXIT_CODE=!ERRORLEVEL!"
)

if !EXIT_CODE! neq 0 (
    echo.
    echo ERROR: Failed to !COMPOSE_ACTION! docker-compose project
    echo.
    pause
    goto MENU
)

echo.
echo Project !COMPOSE_ACTION! completed successfully!
echo.
pause
goto MENU

:LIST_CONTAINERS
cls
echo ============================================
echo   Running Docker Containers
echo ============================================
echo.

:: Get all containers (running and stopped)
echo [Containers]
echo --------------------------------------------

set COUNT=0
for /f "usebackq tokens=1,2" %%a in (`wsl docker ps -a --format "{{.Names}} {{.State}}"`) do (
    set /a COUNT+=1
    set "CONTAINER_!COUNT!=%%a"
    set "STATE_!COUNT!=%%b"
    if "%%b"=="running" (
        echo   !COUNT!. %%a [running]
    ) else (
        echo   !COUNT!. %%a [stopped]
    )
)

if !COUNT! equ 0 (
    echo No containers found
    echo.
    pause
    goto MENU
)

echo --------------------------------------------
echo   r. Refresh    b. Back to menu
echo --------------------------------------------
echo.

:INPUT_CONTAINER
set "CHOICE="
set /p CHOICE="Enter container number (1-!COUNT!): "

if /i "!CHOICE!"=="b" goto MENU
if /i "!CHOICE!"=="r" (
    goto LIST_CONTAINERS
)

set /a NUM=!CHOICE! 2>nul

if !NUM! lss 1 (
    echo Invalid - too low
    goto INPUT_CONTAINER
)
if !NUM! gtr !COUNT! (
    echo Invalid - too high
    goto INPUT_CONTAINER
)

set "SELECTED=!CONTAINER_%NUM%!"
set "SELECTED_STATE=!STATE_%NUM%!"

:: If stopped, ask to start
if not "!SELECTED_STATE!"=="running" (
    echo.
    echo Container [!SELECTED!] is stopped.
    echo.
    set "START_CHOICE="
    set /p START_CHOICE="Start this container? (y/n): "
    
    if /i "!START_CHOICE!"=="y" (
        echo.
        echo Enter sudo password:
        for /f "usebackq delims=" %%p in (`powershell -NoProfile -Command "$p = Read-Host -AsSecureString; [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($p))"`) do set "SUDO_PASS=%%p"
        echo.
        echo Starting container...
        wsl bash -c "echo '!SUDO_PASS!' | sudo -S docker start !SELECTED!" 2>nul
        if !ERRORLEVEL! neq 0 (
            echo Failed to start container
            pause
            goto LIST_CONTAINERS
        )
        echo Waiting for container to be ready...
        timeout /t 2 >nul
    ) else (
        goto LIST_CONTAINERS
    )
)

goto SELECT_MODE

:SELECT_MODE
echo.
echo   Selected: [!SELECTED!]
echo.
echo   s. Shell
echo   v. VSCode
echo   b. Back
echo.
set "MODE="
set /p MODE="How to connect? (s/v/b): "

if /i "!MODE!"=="b" goto LIST_CONTAINERS
if /i "!MODE!"=="s" goto CONNECT_SHELL
if /i "!MODE!"=="v" goto CONNECT_VSCODE

echo Invalid option
goto SELECT_MODE

:CONNECT_SHELL
echo.
echo Connecting to [!SELECTED!] with Shell...
echo (Type 'exit' to disconnect)
echo.
wsl docker exec -it !SELECTED! /bin/bash || wsl docker exec -it !SELECTED! /bin/sh
echo.
echo Disconnected. Press any key to return...
pause >nul
goto LIST_CONTAINERS

:CONNECT_VSCODE
echo.
echo Opening VSCode for [!SELECTED!]...

:: Get container name as hex using PowerShell
for /f "usebackq delims=" %%h in (`powershell -NoProfile -Command "[System.BitConverter]::ToString([System.Text.Encoding]::UTF8.GetBytes('!SELECTED!')).Replace('-','').ToLower()"`) do set "CONTAINER_HEX=%%h"

echo Container HEX: !CONTAINER_HEX!

:: Open vscode and attach the container
code --file-uri "vscode-remote://attached-container+!CONTAINER_HEX!/workspace/projects/ws.code-workspace"

echo.
echo VSCode launched. Press any key to return...
pause >nul
goto LIST_CONTAINERS

:END
endlocal
exit /b 0

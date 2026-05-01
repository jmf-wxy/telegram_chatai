# Windows 安装程序打包完整指南

## 📦 打包功能特性

✅ **专业安装程序** (NSIS 格式)
- 支持自定义安装路径
- 自动创建桌面快捷方式
- 自动创建开始菜单快捷方式
- 支持卸载程序
- 注册表集成

✅ **便携版** (Portable)
- 无需安装，即插即用
- 适合 U盘携带

✅ **多架构支持**
- x64 (64位系统)
- ia32 (32位系统)

---

## 🚀 快速开始（3步完成）

### 方式一：使用图形化工具（推荐新手）

```bash
# 双击运行
build.bat
```

选择选项 `1` 即可生成安装包！

### 方式二：使用命令行

```bash
# 1. 安装依赖（首次）
npm install

# 2. 构建安装包
npm run build:installer

# 输出位置：dist-electron/Telegram AI Assistant-1.0.0-Setup.exe
```

---

## 📋 详细步骤

### 步骤 1: 环境准备

确保已安装：
- **Node.js** >= 16.0.0
- **npm** (随 Node.js 安装)
- **Git** (可选，用于版本控制)

检查版本：
```bash
node --version  # 应显示 v16.x 或更高
npm --version   # 应显示 8.x 或更高
```

### 步骤 2: 安装项目依赖

```bash
cd d:\VScode\26年\02-Telegram智能机器人
npm install
```

这将安装：
- electron - 桌面应用框架
- electron-builder - 打包工具
- 其他运行时依赖

### 步骤 3: 准备图标文件（可选但推荐）

#### 选项 A: 使用默认图标（快速测试）
```bash
# 直接打包，无自定义图标
npm run build:win
```

#### 选项 B: 使用自定义图标（推荐发布）

1. **准备图标源文件**
   - PNG 格式，尺寸 ≥ 256x256 像素
   - 推荐尺寸：1024x1024 或 512x512

2. **转换为 ICO 格式**

**方法 1: 在线转换（最简单）**
- 访问：https://convertico.com/
- 上传 PNG 图片
- 下载 ICO 文件
- 重命名为 `icon.ico`
- 放入 `build/` 目录

**方法 2: 使用 ImageMagick**
```bash
# 安装 ImageMagick (https://imagemagick.org/)
convert your-logo.png -define icon:auto-resize=256,128,64,48,32,16 build/icon.ico
```

**方法 3: 使用 electron-icon-builder**
```bash
npx electron-icon-builder --input=your-logo.png --output=build
```

3. **验证图标**
```bash
node build/check-assets.js
```

### 步骤 4: 执行打包

#### 构建 NSIS 安装程序

```bash
# 完整命令
npm run build:win

# 或使用
npm run desktop:build
```

**输出文件：**
```
dist-electron/
├── Telegram AI Assistant-1.0.0-Setup.exe    # 安装程序 (NSIS)
├── Telegram AI Assistant-Portable-1.0.0.exe # 便携版
└── builder-effective-config.yml            # 配置快照
```

#### 构建便携版

```bash
npx electron-builder --win portable
```

#### 构建所有版本

```bash
npm run build:installer  # 先构建安装版
npx electron-builder --win portable  # 再构建便携版
```

---

## 🎨 自定义配置

### 修改 package.json 的 build 配置

编辑 [package.json](../package.json) 的 `build` 部分：

```json
{
  "build": {
    "appId": "com.telegram.aiassistant",        // 应用 ID
    "productName": "Telegram AI Assistant",      // 产品名称
    "copyright": "Copyright © 2026",             // 版权信息
    
    "nsis": {
      "oneClick": false,                         // false = 显示安装向导
      "allowToChangeInstallationDirectory": true, // 允许更改安装目录
      "createDesktopShortcut": true,             // 创建桌面快捷方式
      "createStartMenuShortcut": true,           // 创建开始菜单快捷方式
      "desktopShortcutName": "Telegram AI",      // 桌面快捷方式名称
      "shortcutName": "Telegram AI Assistant"    // 开始菜单名称
    }
  }
}
```

### 常用 NSIS 选项说明

| 选项 | 默认值 | 说明 |
|------|--------|------|
| `oneClick` | false | 一键安装（true）或传统向导（false）|
| `allowToChangeInstallationDirectory` | true | 是否允许用户选择安装路径 |
| `perMachine` | false | 为所有用户安装（需管理员权限）|
| `createDesktopShortcut` | true | 创建桌面快捷方式 |
| `createStartMenuShortcut` | true | 创建开始菜单快捷方式 |
| `runAfterFinish` | true | 安装完成后运行应用 |
| `deleteAppDataOnUninstall` | false | 卸载时删除用户数据 |

---

## 🔧 故障排除

### 问题 1: 找不到 icon.ico

**错误信息：**
```
Error: Cannot find icon "build/icon.ico"
```

**解决方案：**
```bash
# 方式 1: 删除图标配置（使用默认图标）
# 编辑 package.json，删除 "win.icon" 和 "nsis.installerIcon" 行

# 方式 2: 下载默认图标
node build/download-icon.js

# 方式 3: 创建占位符图标（空文件）
type nul > build/icon.ico
```

### 问题 2: npm 权限错误（Windows）

**错误信息：**
```
Error: EACCES: permission denied
```

**解决方案：**
```bash
# 以管理员身份运行 PowerShell
# 右键点击 PowerShell -> 以管理员身份运行

# 然后执行
npm install
npm run build:installer
```

### 问题 3: electron-builder 下载慢

**问题：** Electron 二进制文件下载缓慢

**解决方案：**
```bash
# 设置镜像（国内用户）
set ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/
npm run build:installer

# 或设置代理
set HTTPS_PROXY=http://127.0.0.1:7890
npm run build:installer
```

### 问题 4: NSIS 编译失败

**错误信息：**
```
Error: Exit code: 1. NSIS compiler failed
```

**解决方案：**
```bash
# 清理缓存后重试
rmdir /s /q dist-electron
rmdir /s /q node_modules\.cache
npm run build:installer
```

### 问题 5: 应用启动失败

**可能原因：**
- 缺少 .env 配置文件
- API Keys 未配置

**解决方案：**
1. 首次运行会自动在 `%APPDATA%/telegram-ai-assistant/` 创建 `.env`
2. 在应用界面中填入 API Keys
3. 点击 Save 保存

---

## 📊 输出文件说明

### 安装程序文件结构

```
dist-electron/
├── Telegram AI Assistant-1.0.0-Setup.exe     # 主安装程序 (~100MB)
│   ├── 包含完整应用程序                      #
│   ├── 支持 x64 + ia32                       #
│   └── NSIS 安装器                           #
│
├── Telegram AI Assistant-Portable-1.0.0.exe  # 便携版 (~90MB)
│   ├── 单文件执行                            #
│   ├── 无需安装                              #
│   └── 可放在 U盘                            #
│
├── builder-effective-config.yml              # 实际使用的配置
└── latest.yml                                # 更新信息（如启用自动更新）
```

### 安装后的文件结构（用户机器）

```
C:\Users\<用户名>\AppData\Local\Programs\telegram-ai-assistant\
├── Telegram AI Assistant.exe                 # 主程序
├── resources/                                 # 应用资源
│   └── app.asar                              # 应用代码包
├── uninstall.exe                             # 卸载程序
└── ...                                        #

桌面快捷方式 → Telegram AI Assistant.lnk
开始菜单 → Telegram AI Assistant
```

---

## ✨ 高级功能

### 启用自动更新

在 `package.json` 中添加：

```json
{
  "build": {
    "publish": {
      "provider": "github",
      "owner": "your-github-username",
      "repo": "telegram-ai-assistant"
    }
  }
}
```

### 代码签名（避免安全警告）

需要购买代码签名证书：

```bash
# 安装 signtool（Windows SDK）
# 设置环境变量
set CSC_LINK=path/to/certificate.pfx
set CSC_KEY_PASSWORD=your-password

# 打包时自动签名
npm run build:installer
```

### 自定义安装向导界面

编辑 [build/installer.nsh](installer.nsh) 来自定义安装过程。

---

## 🧪 测试打包结果

### 测试安装程序

```bash
# 运行安装程序
dist-electron\Telegram AI Assistant-1.0.0-Setup.exe

# 验证项：
# □ 显示安装向导（非一键安装）
# □ 可以选择安装路径
# □ 创建桌面快捷方式
# □ 创建开始菜单快捷方式
# □ 安装成功后可启动应用
# □ 卸载程序正常工作
```

### 测试便携版

```bash
# 直接运行
dist-electron\Telegram AI Assistant-Portable-1.0.0.exe

# 验证项：
# □ 无需安装即可运行
# □ 所有数据保存在同目录下
```

---

## 📝 发布清单

打包完成后，发布前检查：

- [ ] 在干净虚拟机中测试安装/卸载流程
- [ ] 验证所有 API Keys 配置正常工作
- [ ] 测试 Telegram Bot 连接
- [ ] 测试 AI 对话功能
- [ ] 检查日志记录是否正常
- [ ] 确认图标和品牌元素正确显示
- [ ] 测试不同 Windows 版本（10/11）
- [ ] 准备发布说明文档

---

## 💡 提示与最佳实践

1. **版本号管理**：每次发布前更新 `package.json` 的 `version` 字段
2. **清理构建**：重新打包前删除 `dist-electron/` 目录
3. **缓存清理**：遇到奇怪问题时尝试清除 `node_modules/.cache/`
4. **日志查看**：打包日志会显示详细错误信息
5. **文件大小**：最终安装包约 80-120MB（包含 Electron 运行时）

---

## 🆘 获取帮助

如果遇到问题：

1. 查看本文档的故障排除部分
2. 检查 `dist-electron/` 目录下的构建日志
3. 访问 electron-builder 官方文档：https://www.electron.build/
4. 查看项目 Issues：https://github.com/your-repo/issues

---

**最后更新**: 2026-05-01  
**适用版本**: Telegram AI Assistant v1.0.0+

# LyricLearn 🎵

**通过听英文歌学英语** — 搜索网易云音乐，实时同步歌词，点击任意单词获取 AI 解释，生词自动存入复习本。

## 功能

- **歌词同步** — LRC 逐行高亮，当前行放大 + 光晕动画
- **点词解释** — 点击歌词中任意单词，DeepSeek AI 给出词义、歌词语境、文化背景、记忆技巧
- **智能生词本** — 一键保存，卡片翻转复习，数据离线存储在浏览器
- **慢放练习** — 0.6x / 0.75x / 1x / 1.25x 速率切换
- **黑胶唱片动画** — 播放时旋转，暂停时停止

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | React 19 + TypeScript + Vite 8 |
| 样式 | Tailwind CSS v4 + Framer Motion |
| 状态 | Zustand 5 |
| 离线存储 | Dexie.js（IndexedDB） |
| 音乐数据 | NeteaseCloudMusicApi（非官方网易云 API） |
| AI 解释 | DeepSeek API（deepseek-chat） |

## 快速开始

**前置要求：** Node.js 18+

```powershell
# 克隆项目
git clone https://github.com/Ryanswift13/lyriclearn.git
cd lyriclearn

# 安装后端依赖
cd backend && npm install && cd ..

# 安装前端依赖
cd frontend && npm install && cd ..

# 一键启动（Windows）
.\start.ps1
```

启动后访问 `http://localhost:5173`

**首次使用**：点击右上角 ⚙ 设置，填入 [DeepSeek API Key](https://platform.deepseek.com/)，才能使用点词解释功能。

## 项目结构

```
lyriclearn/
├── backend/          # NeteaseCloudMusicApi 服务（port 3000）
├── frontend/
│   └── src/
│       ├── components/   # UI 组件
│       ├── hooks/        # 音频播放、歌词同步、生词本
│       ├── services/     # 网易云 API、DeepSeek API
│       ├── store/        # Zustand 状态
│       └── lib/          # LRC 解析器、IndexedDB schema
└── start.ps1         # 一键启动脚本
```

## 使用说明

1. 在搜索框输入英文歌名或歌手名
2. 点击搜索结果，歌曲自动开始播放
3. 右侧歌词实时高亮，当前行单词带下划线可点击
4. 点击单词 → AI 解释弹窗 → 点「加入生词本」保存
5. 点击右上角 📚 打开生词本，点击卡片翻转查看解释

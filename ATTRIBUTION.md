# 致谢与版权声明

## 原始项目

本小程序基于 [RealKai42/qwerty-learner](https://github.com/RealKai42/qwerty-learner) 开发。

- **原作者**: RealKai42
- **原始仓库**: https://github.com/RealKai42/qwerty-learner
- **原始协议**: GNU General Public License v3.0 (GPL-3.0)

## 修改说明

本项目将原始 Web 应用移植为微信小程序，主要修改包括：

- 将 React + Jotai 架构替换为微信小程序原生框架
- 将 Dexie (IndexedDB) 替换为 wx.setStorageSync 本地存储
- 将物理键盘输入替换为虚拟 QWERTY 键盘组件
- 适配微信小程序的生命周期和页面路由
- 新增深色/浅色主题切换功能
- 新增发音语速、循环播放、中文释义朗读等设置
- 新增单词字体大小调节
- 新增单词循环重复练习功能

## 许可证

本项目继承原始项目的 GPL-3.0 协议。完整许可证文本见 [LICENSE](./LICENSE) 文件。

根据 GPL-3.0 协议要求，本项目的完整源代码已公开发布于：
https://github.com/huangcaixing124-dotcom/qwerty-learner-miniprogram

## 词典数据

词典数据文件来自原始项目的 gh-pages 分支，遵循 GPL-3.0 协议。

# qu-ai-wei · 去 AI 味

给中文文本做"去 AI 味"改写和审稿的 Claude/Codex skill。先做减法（删模板、降调、换真主语、打散假排比），再在广播站/口播/公众号场景做加法（补对象感、作者反应、故事推进、判断和可带走句）。

## 结构

- `SKILL.md` — 主流程：场景判定、力度/范围三档、去味、补味、广播站基线保存、两遍回读、输出合同
- `references/ai-bingzao.md` — AI 病灶识别表（诊断时加载）
- `references/broadcast-style.md` — 广播站文风补味（广播站/口播/公众号稿加载）
- `references/kuaidao-voice.md` — 快刀青衣文风参考（用户明确要求"按我的文风"时加载）

## 安装

把整个目录压缩为 zip，后缀改成 `.skill`，在 Claude 桌面端打开安装；或放入 Claude Code 的 skills 目录。注意 `references/` 必须一起打包，SKILL.md 单文件不完整。

本机 Codex 安装版位于 `~/.codex/skills/qu-ai-wei/`。广播站 Markdown 写回后，会在 `/Users/luojilab/Personal/01-写作/00-广播站/.qu-ai-wei-baselines/` 保存 AI 改稿基线，用于后续从人工终稿中反哺文风规则。

## 语料状态

`kuaidao-voice.md` 基于虎嗅专栏语料提炼：早期以 2013–2016 年文章为主，近年以 2025 年为重点，2026 年文章作为延续参照；暂无 2024 年文章。语料更新后同步修改本节。

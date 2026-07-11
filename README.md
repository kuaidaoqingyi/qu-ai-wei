# qu-ai-wei · 去 AI 味

给中文文本做去 AI 味、空话套话清理和“快刀青衣”文风改写的 Codex / Claude skill。

处理顺序：

1. 保住事实、数字、术语、引用、责任主体和作者已有经历。
2. 删除模板、信息复读、感慨膨胀和假深刻。
3. 公开写作再补对象感、现场、机制和合适的结尾。
4. 新发现的套话先进入候选日志，重复出现后人工晋升到活库。

## 结构

- `SKILL.md`：触发、场景、流程、输出模式、基线和候选收集规则。
- `references/ai-bingzao.md`：AI 病灶识别表。
- `references/ai-cliche-library.md`：已确认的 AI 空话套话活库，只用于识别。
- `references/broadcast-style.md`：广播站和口播文风。
- `references/kuaidao-voice.md`：从虎嗅专栏提炼的快刀青衣文风。
- `scripts/cliche-log.mjs`：候选模板去重、计数和筛选。
- `scripts/validate.mjs`：规则冲突和收集脚本回归检查。
- `evals/cases.md`：人工和模型前向测试样本。

## 安装

把运行文件一起安装，不能只复制 `SKILL.md`：

```text
SKILL.md
agents/
references/
scripts/
```

本机 Codex 安装位置：`~/.codex/skills/qu-ai-wei/`。

## 持续收集空话套话

候选默认写入 `~/.qu-ai-wei/ai-cliche-candidates.json`。广播站工作流使用：

```bash
node scripts/cliche-log.mjs add \
  --pattern "抽象骨架" \
  --family "病灶族" \
  --action "默认动作" \
  --source "文本类型" \
  --file "/Users/luojilab/Personal/01-写作/00-广播站/.qu-ai-wei-baselines/ai-cliche-candidates.json"
```

查看累计 3 次以上的候选：

```bash
node scripts/cliche-log.mjs list --min-count 3 --file "/path/to/ai-cliche-candidates.json"
```

候选只保存抽象骨架，不保存原文长句、姓名、日期、数字、引用和私人信息。达到阈值以后仍需人工复核，再写入 `references/ai-cliche-library.md`。

## 校验

```bash
node scripts/validate.mjs
python3 /path/to/skill-creator/scripts/quick_validate.py .
```

## 语料状态

`kuaidao-voice.md` 基于虎嗅专栏语料提炼：早期以 2013 至 2016 年文章为主，近年以 2025 年为重点，2026 年作为延续参照；当前专栏语料未发现 2024 年文章。

# qu-ai-wei · 去 AI 味

给中文文本做去 AI 味、空话套话清理和“快刀青衣”文风轻改的 Codex / Claude skill。

默认只改局部词句，保留结构、篇幅、节奏和作者声音。整句删除、压缩、重排或重写，需要用户明确授权。表达编辑不等于事实核查，也不承诺通过 AI 检测器。

处理顺序：

1. 保住事实、数字、术语、引用、责任主体、否定、条件、归因和作者已有经历。
2. 在当次授权范围内清理套话；轻改时整句删除和重排只列建议。
3. 文风调整只使用已有材料，不补造现场、机制、因果或作者感受。
4. 新发现的套话先进入候选日志，重复出现后人工晋升到活库。

## 结构

- `SKILL.md`：触发、场景、流程、输出模式、基线和候选收集规则。
- `references/ai-bingzao.md`：AI 病灶识别表。
- `references/ai-cliche-library.md`：已确认的 AI 空话套话活库，只用于识别。
- `references/broadcast-style.md`：广播站和口播文风。
- `references/kuaidao-voice.md`：从虎嗅专栏提炼的快刀青衣文风。
- `references/file-workflow.md`：文件保护、广播站基线和候选收集流程。
- `scripts/cliche-log.mjs`：候选模板去重、计数和筛选。
- `scripts/validate.mjs`：技能结构、规则和脚本单元回归检查。
- `scripts/check-preservation.mjs`：实际改稿输出的机械保留检查。
- `tests/`：19 个自拟输入、独立审阅清单、校验器单元测试与回归说明。
- `evals/cases.md`：补充场景样本，遵循同一编辑边界。

## 安装

把运行文件一起安装，不能只复制 `SKILL.md`：

```text
SKILL.md
agents/
references/
scripts/
tests/
```

本机 Codex 安装位置：`~/.codex/skills/qu-ai-wei/`。

## 持续收集空话套话

候选默认写入 `~/.qu-ai-wei/ai-cliche-candidates.json`。需要使用已有项目日志时显式指定路径：

```bash
node scripts/cliche-log.mjs add \
  --pattern "抽象骨架" \
  --family "病灶族" \
  --action "默认动作" \
  --source "文本类型" \
  --file "/path/to/project/.qu-ai-wei-baselines/ai-cliche-candidates.json"
```

查看累计 3 次以上的候选：

```bash
node scripts/cliche-log.mjs list --min-count 3 --file "/path/to/ai-cliche-candidates.json"
```

候选只保存抽象骨架，不保存原文长句、姓名、日期、数字、引用和私人信息。达到阈值以后仍需人工复核，再写入 `references/ai-cliche-library.md`。

## 校验

```bash
node scripts/validate.mjs
node --test tests/check-preservation.test.mjs
```

以上只验证结构和脚本。实际改稿须按 [回归说明](tests/README.md) 由独立执行者运行 19 个输入，再做机械检查和逐项语义审阅；不把自动测试通过当作改稿质量保证。

## 本地与 GitHub 同步

维护时同时检查源仓库、活动安装目录和 GitHub `main`，以最后一次已验证的远端提交为共同基线，不按修改时间盲目覆盖。

1. 先读取 Git 状态并获取远端更新。只有一侧变化时同步该侧；同一文件两侧冲突、来源不明或混有其他任务改动时，保留现场并请求确认，不强推、不重置。
2. 只同步技能规则、运行脚本、自拟测试及仓库说明。真实稿件、语料、基线、候选日志、测试输出、凭证和本机配置均留在本地。
3. 审查差异和隐私，再运行静态及单元检查。改写规则或行为样本变化时，还须运行独立前向测试及语义审阅。
4. 经当次或明确持续授权后提交、推送，再回读 GitHub 提交和文件内容，并核对安装目录的共享文件逐字一致。失败时不声称同步完成。

仓库的持续集成会在推送及拉取请求时运行静态与单元检查。定时同步由维护者在自己的环境配置；安装本技能不会自动获得 GitHub 写入权限，也不会自动晋升套话候选。定时检查无变化时保持安静，仅报告成功同步、失败或需要人工处理的冲突。

## 语料状态

`kuaidao-voice.md` 基于虎嗅专栏语料提炼：早期以 2013 至 2016 年文章为主，近年以 2025 年为重点，2026 年作为延续参照；当前专栏语料未发现 2024 年文章。

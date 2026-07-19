---
name: one-sentence-self-profile
description: Analyze a one-sentence personal description into structured self-profile signals including Schwartz values, Aaker personality dimensions, emotion, behavior patterns, and happiness level. Use when Codex is asked to infer a person's values, personality, emotional state, behavior style, or wellbeing from a brief self-description, diary sentence, profile sentence, or short Chinese/English personal statement.
---

# One Sentence Self Profile

## Overview

Use this skill to turn one short personal sentence into a cautious, structured self-profile. The output should be useful for reflection, diary tagging, or product-persona analysis, not for diagnosis.

For the detailed psychological reference, read `references/psychology-frameworks.md` when the task requires Aaker or Schwartz mapping detail.

## Boundaries

- Treat all conclusions as evidence-based hypotheses from limited text.
- Do not present mental-health diagnosis, clinical risk judgment, or fixed personality verdicts.
- If the sentence is too short or ambiguous, lower confidence and use neutral fallback labels.
- Preserve the user's language unless they request another language.

## Workflow

1. Validate the input is one short personal description or diary-like sentence.
2. Extract observable cues: people, activities, time, emotion words, agency, social context, goal orientation, conflict, reward.
3. Infer five dimensions:
   - values: map to Schwartz value signals.
   - personality: map to Aaker five personality dimensions where useful.
   - emotion: current emotional tone and stability.
   - behavior: observable action pattern.
   - happiness: likely wellbeing level from the sentence.
4. Add confidence per dimension: high, medium, low.
5. Include textual evidence for every inference.
6. Add a short caveat when the sentence cannot support strong inference.

## Output Format

Return concise Markdown by default:

```markdown
一句话画像：...

| 维度 | 判断 | 证据 | 置信度 |
|---|---|---|---|
| 价值观 | ... | ... | ... |
| 性格 | ... | ... | ... |
| 情感 | ... | ... | ... |
| 行为 | ... | ... | ... |
| 幸福感 | ... | ... | ... |

综合判断：...
注意：以上为基于一句话文本的复盘假设，不等同于稳定人格或心理诊断。
```

For applications that need machine-readable output, return JSON:

```json
{
  "summary": "",
  "values": [{"label": "", "schwartz_dimension": "", "evidence": "", "confidence": ""}],
  "personality": [{"label": "", "aaker_dimension": "", "evidence": "", "confidence": ""}],
  "emotion": {"label": "", "stability": "", "evidence": "", "confidence": ""},
  "behavior": [{"label": "", "evidence": "", "confidence": ""}],
  "happiness": {"level": "", "evidence": "", "confidence": ""},
  "caveat": "基于一句话文本的复盘假设，不等同于心理诊断。"
}
```

## Fallback Labels

- 性格：无明确性格倾向。
- 价值观：无明确价值观倾向。
- 情感：情绪中性或情绪线索不足。
- 行为：行为线索不足。
- 幸福感：幸福度中性。

## Example

Input:

```text
今天和朋友出去逛街了，还吃了饭，工作日晚上下班无事。
```

Output:

| 维度 | 判断 | 证据 | 置信度 |
|---|---|---|---|
| 价值观 | 重视陪伴、享受生活 | “和朋友”“逛街”“吃饭”显示社交陪伴和生活体验 | 中 |
| 性格 | 偏外向、亲和 | 主动与朋友进行线下活动 | 中 |
| 情感 | 情绪稳定 | 句子无冲突、焦虑、低落线索，语气平稳 | 中 |
| 行为 | 社交休闲、工作后放松 | 下班后安排逛街吃饭 | 高 |
| 幸福感 | 偏高 | 有朋友陪伴、休闲和饮食满足 | 中 |

综合判断：这个人当天呈现出稳定、轻松、偏社交的生活状态，价值上更看重陪伴与日常体验。

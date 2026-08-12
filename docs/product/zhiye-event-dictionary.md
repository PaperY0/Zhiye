# 知野首轮试点事件字典（草案）

状态：事件草案，待产品、工程与隐私评审

日期：2026-08-02

## 1. 通用字段

每个事件至少包含：

```text
eventId, eventName, occurredAt, actorType, actorId,
schoolId, classId, subject, grade, objectType, objectId,
result, failureCode, idempotencyKey, schemaVersion
```

禁止字段：课堂原文、题图、音频内容、完整普通消息正文、保护性反馈正文、模型隐藏推理。

## 2. 核心事件

| 事件名 | 触发条件 | 主体 | 对象 | 成功结果 | 失败/取消 |
| --- | --- | --- | --- | --- | --- |
| `lesson_review_opened` | 教师打开课堂复盘 | 教师 | 课堂 | `opened` | `not_found` |
| `lesson_artifact_confirmed` | 教师确认复习卡内容 | 教师 | 课堂资料 | `confirmed` | `validation_failed` / `cancelled` |
| `lesson_published` | 课堂资料发布成功 | 教师 | 课堂资料 | `published` | `permission_denied` / `conflict` |
| `student_recap_viewed` | 学生打开已发布复习卡 | 学生 | 复习卡 | `viewed` | `not_published` / `permission_denied` |
| `student_learning_loop_completed` | 学生完成自检或答疑收束 | 学生 | 学习闭环 | `completed` | `abandoned` / `needs_help` |
| `class_insight_viewed` | 教师打开班级困惑聚合 | 教师 | 班级信号 | `viewed` | `not_available` |
| `parent_summary_opened` | 绑定家长打开审核摘要 | 家长 | 摘要 | `opened` | `not_published` / `not_bound` |
| `feedback_routed` | 普通反馈/保护反馈完成分流 | 学生/教师 | 反馈案件 | `routed` | `invalid_input` / `needs_human_review` |
| `safeguarding_case_updated` | 负责人分配、转交、跟进或关闭 | 保护负责人 | 保护案件 | `updated` | `permission_denied` / `conflict` |

## 3. 事件与指标映射

- 教师采用率：`lesson_published`
- 学生学习闭环率：`student_recap_viewed` → `student_learning_loop_completed`
- 教师热力图查看率：`class_insight_viewed`
- 家长摘要阅读率：`parent_summary_opened`
- 保护流程审计：`feedback_routed`、`safeguarding_case_updated`

## 4. 事件生命周期

- 事件写入失败不能阻塞核心学习动作，但必须进入可重试队列并标记 `event_write_failed`。
- 事件重试必须复用 `idempotencyKey`，不能重复增加指标分子。
- 删除或导出个人数据时只处理允许范围内的事件元数据；保护和审计留痕按试点协议保留。

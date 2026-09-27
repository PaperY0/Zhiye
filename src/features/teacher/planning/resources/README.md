# 教辅资源包接口

备课页会自动加载 `packs/*.json`，无需修改页面或注册表代码。新增教辅时，复制现有文件，填写以下结构即可：

```json
{
  "id": "publisher-math-g5-2027-spring",
  "title": "教材名称 · 五年级下册",
  "publisher": "出版社",
  "subject": "数学",
  "grade": "五年级",
  "volume": "下册",
  "edition": "2027 春新版",
  "description": "版本与适用范围",
  "sourceUrl": "https://出版社或正式教材目录地址",
  "units": [{
    "id": "u1",
    "title": "一 单元名称",
    "topics": [{
      "id": "topic-1",
      "title": "课题",
      "objective": "可观察的教学目标",
      "teachingHint": "教学提示",
      "misconception": "常见误区",
      "activity": "课堂活动",
      "check": "课堂检验方式"
    }]
  }]
}
```

`catalog.ts` 用 Zod 校验字段、资源 ID 与课题 ID，并提供 `teachingAids`、`findTeachingAid()`、`getTeachingAidTopic()` 三个读取接口。构建时文件会打包进前端，离线也可用。课题可应用到备课输入和教案；AI 只接收当前选中课题的简短提示，不会收到整个资源包。

当前两个资源包均是原创备课提示，不包含教材正文、习题或配图。上册按 2026 秋新教材单元组织；下册按 2026 春使用版本组织。更换正式教材版本时，新增对应资源包，保留旧包供已有教案读取；正式教学前请核对学校使用的印次和实际目录。

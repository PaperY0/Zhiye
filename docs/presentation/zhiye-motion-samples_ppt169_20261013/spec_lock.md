<!-- ppt-master-schema: spec-lock/v1 -->
# Execution Lock

## canvas
- viewBox: 0 0 1280 720
- format: PPT 16:9

## communication
- primary_language: zh-CN
- audience: 比赛评委
- objective: 5 分钟内让评委理解问题、解决方案与验证结果
- core_message: 课堂记录转为可审核教学材料，学习反馈带回下一课
- consumption_mode: presentation

## mode
- mode: custom
- mode_behavior: 按已确认的 12 页顺序，问题、闭环、产品、机制、验收、试用计划、收束。

## visual_style
- visual_style: custom
- visual_style_behavior: 复用知野网页的山谷插画、浅灰绿底、暖白圆角主面板、深墨绿标题、鼠尾草绿状态与麦穗金强调。保持大留白，产品截图与原生说明并置。

## colors
- background: #F4F7F3
- secondary_bg: #FFFEFA
- primary: #172019
- accent: #526F59
- secondary_accent: #C9A660
- body_text: #294B30
- secondary_text: #56675C
- divider: #DCE8D5

## typography
- font_family: Noto Sans SC, Arial, Microsoft YaHei
- title_family: Noto Sans SC, Arial, Microsoft YaHei
- body_family: Noto Sans SC, Arial, Microsoft YaHei
- cover_family: Ma Shan Zheng, Arial, Microsoft YaHei
- body: 28
- caption: 24
- title: 52
- lead: 34
- annotation: 20
- footnote: 16
- cover: 108
- display: 144

## icons
- library: none
- inventory: none

## page_rhythm
- P01: anchor
- P02: dense
- P03: anchor

## pptx_structure
- mode: flat

## images
- zhiye-kite-valley: images/zhiye-kite-valley.png | source=user | crop=adaptive
- shot-workspace: images/shot-workspace.jpg | source=user | crop=no-crop

## forbidden
- `mask`, `<style>`, `class`, external CSS, `<foreignObject>`, `textPath`, `@font-face`, `<animate*>`, `<set>`, `<script>` / event attributes, `<iframe>`
- HTML named entities in text; write typography as raw Unicode and escape XML reserved characters

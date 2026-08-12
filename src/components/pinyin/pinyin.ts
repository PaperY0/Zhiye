import { clsx } from "clsx"

const PINYIN_MAP: Record<string, string> = {
  学生端: "xué shēng duān",
  家长端: "jiā zhǎng duān",
  教师端: "jiào shī duān",
  管理端: "guǎn lǐ duān",
  知野学习空间: "zhī yě xué xí kōng jiān",
  知野家校空间: "zhī yě jiā xiào kōng jiān",
  知野教学工作台: "zhī yě jiào xué gōng zuò tái",
  知野管理中心: "zhī yě guǎn lǐ zhōng xīn",
  首页: "shǒu yè",
  摘要: "zhāi yào",
  答疑: "dá yí",
  学习: "xué xí",
  拍照答疑: "pāi zhào dá yí",
  知识点学习: "zhī shí diǎn xué xí",
  错题本: "cuò tí běn",
  任务: "rèn wù",
  消息: "xiāo xī",
  历史记录: "lì shǐ jì lù",
  学习摘要: "xué xí zhāi yào",
  联系老师: "lián xì lǎo shī",
  管理概览: "guǎn lǐ gài lǎn",
  工作台: "gōng zuò tái",
  课堂: "kè táng",
  班级洞察: "bān jí dòng chá",
  备课与测验: "bèi kè yǔ cè yàn",
  学生档案: "xué shēng dàng àn",
  设置: "shè zhì",
  保护性反馈: "bǎo hù xìng fǎn kuì",
  审计记录: "shěn jì jì lù",
  学校设置: "xué xiào shè zhì",
  返回上一页: "fǎn huí shàng yī yè",
  下一步: "xià yī bù",
  继续学习: "jì xù xué xí",
  需要提示吗: "xū yào tí shì ma",
  今日复习卡: "jīn rì fù xí kǎ",
  联系李老师: "lián xì lǐ lǎo shī",
  今天也按自己的节奏来: "jīn tiān yě àn zì jǐ de jié zòu lái",
  我的待办: "wǒ de dài bàn",
  我的错题: "wǒ de cuò tí",
  我的进度: "wǒ de jìn dù",
  今天的小目标: "jīn tiān de xiǎo mù biāo",
  联系老师完成绑定: "lián xì lǎo shī wán chéng bǎng dìng",
  家庭学习陪伴: "jiā tíng xué xí péi bàn",
  已确认的可追溯信息: "yǐ què rèn de kě zhuī sù xìn xī",
  本周陪伴重点: "běn zhōu péi bàn zhòng diǎn",
  一步一步来: "yí bù yí bù lái",
}

export function cn(...inputs: Array<string | false | null | undefined>) {
  return clsx(inputs)
}

export function getPinyin(text: string): string | undefined {
  return PINYIN_MAP[text]
}

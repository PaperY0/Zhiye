import { clsx } from "clsx"

const PINYIN_MAP: Record<string, string> = {
  首页: "shǒu yè",
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
}

export function cn(...inputs: Array<string | false | null | undefined>) {
  return clsx(inputs)
}

export function getPinyin(text: string): string | undefined {
  return PINYIN_MAP[text]
}


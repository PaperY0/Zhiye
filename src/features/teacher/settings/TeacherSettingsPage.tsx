import { useState, type ReactNode } from "react"
import {
  Bell,
  BookOpen,
  Bot,
  Database,
  Languages,
  LockKeyhole,
  Save,
  School,
  ShieldCheck,
  UserRound,
} from "lucide-react"
import { GlassSurface } from "../../../components/shared/GlassSurface"
import { StatusChip } from "../../../components/shared/StatusChip"
import {
  ToastRegion,
  type ToastMessage,
} from "../../../components/shared/ToastRegion"

type TeacherSettings = {
  teacherName: string
  teacherTitle: string
  currentClass: string
  textbook: string
  chapter: string
  additionalScope: string
  aiDetail: string
  includeEvidence: boolean
  includeLifeExamples: boolean
  requireReviewBeforePublish: boolean
  speechLanguage: string
  readAloudVoice: string
  lessonReadyNotification: boolean
  taskDueNotification: boolean
  parentMessageNotification: boolean
  safetyNotification: boolean
  recordingRetention: string
  generatedContentRetention: string
  parentTeacherMessages: boolean
  studentLearningEvidence: boolean
  hideStudentRankings: boolean
}

const initialSettings: TeacherSettings = {
  teacherName: "李老师",
  teacherTitle: "五年级数学教师",
  currentClass: "五年级（2）班",
  textbook: "人教版",
  chapter: "分数的意义和性质",
  additionalScope: "重点覆盖约分、通分与分数基本性质。",
  aiDetail: "平衡",
  includeEvidence: true,
  includeLifeExamples: true,
  requireReviewBeforePublish: true,
  speechLanguage: "普通话",
  readAloudVoice: "温和女声",
  lessonReadyNotification: true,
  taskDueNotification: true,
  parentMessageNotification: true,
  safetyNotification: true,
  recordingRetention: "7 天",
  generatedContentRetention: "本学期",
  parentTeacherMessages: true,
  studentLearningEvidence: true,
  hideStudentRankings: true,
}

const inputClassName =
  "mt-2 min-h-11 w-full rounded-2xl border border-white/80 bg-white/65 px-4 py-2.5 text-sm font-semibold text-[#193025] shadow-[inset_0_1px_0_rgba(255,255,255,.95)] outline-none transition focus:border-[#719174] focus:ring-4 focus:ring-[#86a988]/15"

const labelClassName = "text-sm font-bold text-[#344d3d]"

function SettingsSection({
  title,
  description,
  icon,
  children,
}: {
  title: string
  description: string
  icon: ReactNode
  children: ReactNode
}) {
  return (
    <GlassSurface
      aria-label={title}
      className="rounded-[28px] border border-white/80 bg-white/48 p-5 shadow-[0_20px_55px_rgba(45,77,55,.08)] sm:p-6"
      role="region"
      weight="card"
    >
      <div className="mb-6 flex items-start gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#e5efe1] text-[#4e7358] shadow-[inset_0_1px_0_rgba(255,255,255,.9)]">
          {icon}
        </span>
        <div>
          <h2
            className="text-lg font-black tracking-[-0.02em] text-[#17251c]"
            id={`settings-${title}`}
          >
            {title}
          </h2>
          <p className="mt-1 text-sm leading-6 text-[#6b7d70]">{description}</p>
        </div>
      </div>
      {children}
    </GlassSurface>
  )
}

function ToggleRow({
  checked,
  description,
  label,
  onChange,
}: {
  checked: boolean
  description: string
  label: string
  onChange(checked: boolean): void
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-white/75 bg-white/45 px-4 py-3.5 transition hover:bg-white/65">
      <span>
        <span className="block text-sm font-bold text-[#263b2d]">{label}</span>
        <span className="mt-1 block text-xs leading-5 text-[#708176]">
          {description}
        </span>
      </span>
      <span className="relative shrink-0">
        <input
          aria-label={label}
          checked={checked}
          className="peer sr-only"
          onChange={(event) => onChange(event.target.checked)}
          type="checkbox"
        />
        <span className="block h-7 w-12 rounded-full bg-[#d5ddd5] shadow-inner transition peer-checked:bg-[#587b60] peer-focus-visible:ring-4 peer-focus-visible:ring-[#6f9475]/25" />
        <span className="absolute left-1 top-1 size-5 rounded-full bg-white shadow-sm transition peer-checked:translate-x-5" />
      </span>
    </label>
  )
}

export function TeacherSettingsPage() {
  const [settings, setSettings] = useState<TeacherSettings>(initialSettings)
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  function updateSetting<Key extends keyof TeacherSettings>(
    key: Key,
    value: TeacherSettings[Key],
  ) {
    setSettings((current) => ({ ...current, [key]: value }))
  }

  function saveSettings() {
    setToasts([
      {
        id: "teacher-settings-saved",
        title: "设置已保存到当前原型",
        description: "这些修改仅保存在页面内存中，刷新页面后不会保留。",
        tone: "success",
      },
    ])
  }

  return (
    <div className="relative mx-auto w-full max-w-[1500px] px-4 pb-28 pt-5 sm:px-6 lg:px-8">
      <header className="mb-7 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-3 flex items-center gap-2">
            <StatusChip tone="info">教师端</StatusChip>
            <StatusChip tone="neutral">本地原型设置</StatusChip>
          </div>
          <h1 className="text-3xl font-black tracking-[-0.045em] text-[#132219] sm:text-4xl">
            教师设置
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#66796d] sm:text-base">
            配置班级教学范围、AI
            辅助方式、通知和数据边界。所有选择都由教师确认后生效。
          </p>
        </div>
        <button
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#15251b] px-6 text-sm font-black text-white shadow-[0_12px_28px_rgba(20,40,27,.18)] transition hover:-translate-y-0.5 hover:bg-[#223b2a] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#66886d]/30"
          onClick={saveSettings}
          type="button"
        >
          <Save aria-hidden="true" size={18} />
          保存设置
        </button>
      </header>

      <div className="mb-6 flex items-start gap-3 rounded-[22px] border border-[#d8c691]/45 bg-[#fff8df]/70 px-4 py-3.5 text-sm leading-6 text-[#67582d] shadow-[inset_0_1px_0_rgba(255,255,255,.8)]">
        <ShieldCheck aria-hidden="true" className="mt-0.5 shrink-0" size={19} />
        <p>
          <strong>原型说明：</strong>
          设置仅保存在当前页面状态，刷新页面后不会保留，也不会上传或改变真实学校数据。
        </p>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <SettingsSection
          description="维护当前教师身份与主要授课班级。"
          icon={<UserRound aria-hidden="true" size={21} />}
          title="教师资料与班级"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={labelClassName}>
              教师姓名
              <input
                className={inputClassName}
                onChange={(event) =>
                  updateSetting("teacherName", event.target.value)
                }
                type="text"
                value={settings.teacherName}
              />
            </label>
            <label className={labelClassName}>
              教师身份
              <input
                className={inputClassName}
                onChange={(event) =>
                  updateSetting("teacherTitle", event.target.value)
                }
                type="text"
                value={settings.teacherTitle}
              />
            </label>
            <label className={`${labelClassName} sm:col-span-2`}>
              当前班级
              <select
                className={inputClassName}
                onChange={(event) =>
                  updateSetting("currentClass", event.target.value)
                }
                value={settings.currentClass}
              >
                <option>五年级（2）班</option>
                <option>五年级（1）班</option>
                <option>五年级（3）班</option>
              </select>
            </label>
          </div>
        </SettingsSection>

        <SettingsSection
          description="限定生成内容所使用的教材版本和章节范围。"
          icon={<BookOpen aria-hidden="true" size={21} />}
          title="教材与教学范围"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={labelClassName}>
              数学教材版本
              <select
                className={inputClassName}
                onChange={(event) =>
                  updateSetting("textbook", event.target.value)
                }
                value={settings.textbook}
              >
                <option>人教版</option>
                <option>北师大版</option>
                <option>苏教版</option>
              </select>
            </label>
            <label className={labelClassName}>
              当前教学章节
              <select
                className={inputClassName}
                onChange={(event) =>
                  updateSetting("chapter", event.target.value)
                }
                value={settings.chapter}
              >
                <option>分数的意义和性质</option>
                <option>分数加减法</option>
                <option>小数乘法</option>
                <option>单位换算</option>
              </select>
            </label>
            <label className={`${labelClassName} sm:col-span-2`}>
              补充范围说明
              <textarea
                className={`${inputClassName} min-h-24 resize-y`}
                onChange={(event) =>
                  updateSetting("additionalScope", event.target.value)
                }
                value={settings.additionalScope}
              />
            </label>
          </div>
        </SettingsSection>

        <SettingsSection
          description="控制 AI 草稿的展开程度、证据引用和发布边界。"
          icon={<Bot aria-hidden="true" size={21} />}
          title="AI 生成偏好"
        >
          <label className={labelClassName}>
            AI 内容详细程度
            <select
              className={inputClassName}
              onChange={(event) =>
                updateSetting("aiDetail", event.target.value)
              }
              value={settings.aiDetail}
            >
              <option>精简</option>
              <option>平衡</option>
              <option>详细</option>
            </select>
          </label>
          <div className="mt-4 grid gap-3">
            <ToggleRow
              checked={settings.includeEvidence}
              description="在建议旁展示对应转写、练习或提问依据。"
              label="生成时附课堂证据"
              onChange={(checked) => updateSetting("includeEvidence", checked)}
            />
            <ToggleRow
              checked={settings.includeLifeExamples}
              description="优先使用适合五年级学生理解的真实生活情境。"
              label="加入生活化例子"
              onChange={(checked) =>
                updateSetting("includeLifeExamples", checked)
              }
            />
            <ToggleRow
              checked={settings.requireReviewBeforePublish}
              description="AI 生成内容始终先作为草稿，由教师确认后发布。"
              label="发布前必须教师审核"
              onChange={(checked) =>
                updateSetting("requireReviewBeforePublish", checked)
              }
            />
          </div>
        </SettingsSection>

        <SettingsSection
          description="设置课堂转写识别范围和学生端朗读音色。"
          icon={<Languages aria-hidden="true" size={21} />}
          title="语言与方言"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={labelClassName}>
              语音识别语言
              <select
                className={inputClassName}
                onChange={(event) =>
                  updateSetting("speechLanguage", event.target.value)
                }
                value={settings.speechLanguage}
              >
                <option>普通话</option>
                <option>普通话与四川话</option>
                <option>普通话与粤语</option>
              </select>
            </label>
            <label className={labelClassName}>
              学生端朗读音色
              <select
                className={inputClassName}
                onChange={(event) =>
                  updateSetting("readAloudVoice", event.target.value)
                }
                value={settings.readAloudVoice}
              >
                <option>温和女声</option>
                <option>清晰男声</option>
                <option>活力童声</option>
              </select>
            </label>
          </div>
          <p className="mt-4 rounded-2xl bg-[#edf4eb]/75 px-4 py-3 text-xs leading-5 text-[#5c7262]">
            方言选项只改变原型中的识别偏好展示，不会采集真实音频。
          </p>
        </SettingsSection>

        <SettingsSection
          description="选择需要提醒的教学、沟通和保护性事件。"
          icon={<Bell aria-hidden="true" size={21} />}
          title="通知"
        >
          <div className="grid gap-3">
            <ToggleRow
              checked={settings.lessonReadyNotification}
              description="课堂转写和复习卡草稿准备完成时提醒。"
              label="课堂初稿完成提醒"
              onChange={(checked) =>
                updateSetting("lessonReadyNotification", checked)
              }
            />
            <ToggleRow
              checked={settings.taskDueNotification}
              description="任务临近截止且仍有学生未完成时提醒。"
              label="任务到期提醒"
              onChange={(checked) =>
                updateSetting("taskDueNotification", checked)
              }
            />
            <ToggleRow
              checked={settings.parentMessageNotification}
              description="收到家长新消息时在教师端显示提示。"
              label="家长消息提醒"
              onChange={(checked) =>
                updateSetting("parentMessageNotification", checked)
              }
            />
            <ToggleRow
              checked={settings.safetyNotification}
              description="保护性反馈始终优先提醒，不受普通通知静音影响。"
              label="保护性反馈优先提醒"
              onChange={(checked) =>
                updateSetting("safetyNotification", checked)
              }
            />
          </div>
        </SettingsSection>

        <SettingsSection
          description="预览不同类型数据在产品中的建议保留周期。"
          icon={<Database aria-hidden="true" size={21} />}
          title="数据留存"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={labelClassName}>
              课堂录音留存时间
              <select
                className={inputClassName}
                onChange={(event) =>
                  updateSetting("recordingRetention", event.target.value)
                }
                value={settings.recordingRetention}
              >
                <option>处理后立即删除</option>
                <option>7 天</option>
                <option>30 天</option>
              </select>
            </label>
            <label className={labelClassName}>
              AI 生成内容留存时间
              <select
                className={inputClassName}
                onChange={(event) =>
                  updateSetting("generatedContentRetention", event.target.value)
                }
                value={settings.generatedContentRetention}
              >
                <option>30 天</option>
                <option>本学期</option>
                <option>本学年</option>
              </select>
            </label>
          </div>
          <div className="mt-4 rounded-2xl border border-[#e7d9a9]/60 bg-[#fff9e7]/75 px-4 py-3 text-xs leading-5 text-[#6f6137]">
            当前选项仅用于高保真演示。真实留存周期应由学校政策、监护人授权与适用法规共同决定。
          </div>
        </SettingsSection>

        <SettingsSection
          description="明确学生、家长和不同角色可看到的内容边界。"
          icon={<LockKeyhole aria-hidden="true" size={21} />}
          title="隐私与角色切换"
        >
          <div className="grid gap-3">
            <ToggleRow
              checked={settings.parentTeacherMessages}
              description="家长只看到教师主动发布的留言，不显示学生完整对话。"
              label="允许家长查看教师留言"
              onChange={(checked) =>
                updateSetting("parentTeacherMessages", checked)
              }
            />
            <ToggleRow
              checked={settings.studentLearningEvidence}
              description="教师可以查看与教学有关的课堂、练习和任务事实。"
              label="展示可追溯学习证据"
              onChange={(checked) =>
                updateSetting("studentLearningEvidence", checked)
              }
            />
            <ToggleRow
              checked={settings.hideStudentRankings}
              description="洞察页面使用知识信号，不对学生进行公开排名。"
              label="隐藏学生排名"
              onChange={(checked) =>
                updateSetting("hideStudentRankings", checked)
              }
            />
          </div>
          <div className="mt-4 flex items-start gap-3 rounded-2xl bg-[#edf3ee]/80 px-4 py-3.5">
            <School
              aria-hidden="true"
              className="mt-0.5 shrink-0 text-[#58735f]"
              size={18}
            />
            <p className="text-xs leading-5 text-[#5d7163]">
              角色切换只用于体验不同端的原型页面，不会更改真实账号权限。教师、学生、家长和管理员的数据可见范围仍应分别授权。
            </p>
          </div>
        </SettingsSection>
      </div>

      <ToastRegion
        label="设置通知"
        onDismiss={(id) =>
          setToasts((current) => current.filter((toast) => toast.id !== id))
        }
        toasts={toasts}
      />
    </div>
  )
}

export default TeacherSettingsPage

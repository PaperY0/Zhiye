import {
  type DesignSystem,
  type Page,
  type SlideMeta,
  type SlideTransition,
  Step,
  Steps,
  useIsActivePage,
  useSlidePageNumber,
} from '@open-slide/core';
import type { CSSProperties, ReactNode } from 'react';

import insightsShot from './assets/shot-insights.jpg';
import lessonDetailShot from './assets/shot-lesson-detail.jpg';
import reviewShot from './assets/shot-review.jpg';
import workspaceShot from './assets/shot-workspace.jpg';
import kiteValley from './assets/zhiye-kite-valley.png';

/* ------------------------------------------------------------------ *
 * Webfonts — 知野前端同款：Noto Sans SC + Ma Shan Zheng 书法
 * ------------------------------------------------------------------ */

const FONT_HREF =
  'https://fonts.googleapis.com/css2?family=Ma+Shan+Zheng&family=Noto+Sans+SC:wght@500;700;900&display=swap';
const FONT_LINK_ID = 'osd-webfont-zhiye-roadshow';

if (typeof document !== 'undefined') {
  let link = document.getElementById(FONT_LINK_ID) as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement('link');
    link.id = FONT_LINK_ID;
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }
  if (link.href !== FONT_HREF) link.href = FONT_HREF;
}

/* ------------------------------------------------------------------ *
 * 氛围动效 — 复刻前端 LivingLandscapeBackdrop 的呼吸山谷
 * ------------------------------------------------------------------ */

const AMBIENT_CSS = `
@keyframes zhiye-breathe {
  0%,100% { transform: scale(1.035) translate3d(-.25%,0,0); }
  50%     { transform: scale(1.085) translate3d(.3%,-.55%,0); }
}
@keyframes zhiye-clouds {
  0%,100% { transform: translate3d(-3%,0,0); opacity: .25; }
  50%     { transform: translate3d(4%,-1%,0); opacity: .48; }
}
@keyframes zhiye-sun {
  0%,100% { opacity: .15; transform: scale(.94); }
  50%     { opacity: .5;  transform: scale(1.08); }
}
@keyframes zhiye-river {
  0%,100% { opacity: .08; transform: translate3d(-4%,0,0) skewX(-8deg); }
  50%     { opacity: .32; transform: translate3d(5%,-1%,0) skewX(-8deg); }
}
@keyframes zhiye-kite-a {
  0%,100% { transform: translate3d(0,0,0) rotate(-8deg); }
  48%     { transform: translate3d(22px,-20px,0) rotate(10deg); }
}
@keyframes zhiye-kite-b {
  0%,100% { transform: translate3d(0,0,0) rotate(6deg); }
  52%     { transform: translate3d(-28px,17px,0) rotate(-8deg); }
}
@keyframes zhiye-rise {
  from { opacity: 0; transform: translateY(18px); }
  to   { opacity: 1; transform: translateY(0); }
}
`;

const AMBIENT_STYLE_ID = 'osd-ambient-zhiye-roadshow';

if (typeof document !== 'undefined') {
  let style = document.getElementById(AMBIENT_STYLE_ID);
  if (!style) {
    style = document.createElement('style');
    style.id = AMBIENT_STYLE_ID;
    document.head.appendChild(style);
  }
  if (style.textContent !== AMBIENT_CSS) style.textContent = AMBIENT_CSS;
}

/* ------------------------------------------------------------------ *
 * Design tokens — 直接取自知野前端 theme.css
 * ------------------------------------------------------------------ */

export const design: DesignSystem = {
  palette: { bg: '#F4F7F3', text: '#172019', accent: '#526F59' },
  fonts: {
    display:
      '"Noto Sans SC", "PingFang SC", "Microsoft YaHei", ui-sans-serif, system-ui, sans-serif',
    body: '"Noto Sans SC", "PingFang SC", "Microsoft YaHei", ui-sans-serif, system-ui, sans-serif',
  },
  typeScale: { hero: 190, body: 34 },
  radius: 20,
};

/** 调色板其余角色：DesignSystem 形状之外的补充色 */
const ink = {
  /** 正文 #294B30 */
  body: '#294B30',
  /** 次要文字 #56675C */
  secondary: '#56675C',
  /** 暖白面板 #FFFEFA */
  panel: '#FFFEFA',
  /** 鼠尾草绿 #526F59 */
  sage: '#526F59',
  /** 鼠尾草绿浅底 #E7EFE3 */
  sageSoft: '#E7EFE3',
  /** 麦穗金 #C9A660 */
  gold: '#C9A660',
  /** 麦穗金浅底 #EEE3C9 */
  goldSoft: '#EEE3C9',
  /** 分隔线 #DCE8D5 */
  divider: '#DCE8D5',
  /** 深墨绿 #172019 */
  deep: '#172019',
} as const;

/** 封面 / 结尾的书法字体 */
const fontHand = '"Ma Shan Zheng", "KaiTi", "STKaiti", cursive';

const EASE_OUT = 'cubic-bezier(0, 0, 0.2, 1)';
const EASE_IN = 'cubic-bezier(0.4, 0, 1, 1)';
const HOLD: Keyframe[] = [{ opacity: 1 }, { opacity: 1 }];

const fill: CSSProperties = {
  width: '100%',
  height: '100%',
  fontFamily: 'var(--osd-font-body)',
};

const PAD_X = 120;

/* ------------------------------------------------------------------ *
 * 共用零件
 * ------------------------------------------------------------------ */

const Eyebrow = ({
  children,
  color = ink.sage,
}: {
  children: ReactNode;
  color?: string;
}) => (
  <div
    style={{
      fontSize: 28,
      fontWeight: 900,
      letterSpacing: '0.24em',
      lineHeight: 1.2,
      color,
    }}
  >
    {children}
  </div>
);

const Heading = ({ children, size = 68 }: { children: ReactNode; size?: number }) => (
  <h2
    style={{
      margin: 0,
      fontFamily: 'var(--osd-font-display)',
      fontSize: size,
      fontWeight: 900,
      lineHeight: 1.2,
      letterSpacing: '0.01em',
      color: 'var(--osd-text)',
    }}
  >
    {children}
  </h2>
);

/** 内容页外壳：浅灰绿底 + 固定内边距 + 页脚 */
const PageShell = ({ children }: { children: ReactNode }) => (
  <div
    style={{
      ...fill,
      position: 'relative',
      boxSizing: 'border-box',
      background: 'var(--osd-bg)',
      color: 'var(--osd-text)',
      padding: `104px ${PAD_X}px 128px`,
      display: 'flex',
      flexDirection: 'column',
    }}
  >
    {children}
    <Footer />
  </div>
);

const Footer = () => {
  const { current, total } = useSlidePageNumber();
  return (
    <div
      style={{
        position: 'absolute',
        left: PAD_X,
        right: PAD_X,
        bottom: 52,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: 24,
        fontWeight: 700,
        letterSpacing: '0.12em',
        color: ink.secondary,
      }}
    >
      <span>知野 · 课堂复盘数字员工</span>
      <span style={{ fontVariantNumeric: 'tabular-nums' }}>
        {String(current).padStart(2, '0')} / {String(total).padStart(2, '0')}
      </span>
    </div>
  );
};

/** 带序号与说明的条目行 */
const Point = ({
  title,
  desc,
  titleSize = 34,
}: {
  title: string;
  desc: string;
  titleSize?: number;
}) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    <div
      style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: 14,
        fontSize: titleSize,
        fontWeight: 800,
        lineHeight: 1.6,
        color: 'var(--osd-text)',
      }}
    >
      <span style={{ color: 'var(--osd-accent)', fontSize: titleSize * 0.72 }}>—</span>
      <span>{title}</span>
    </div>
    <div
      style={{
        fontSize: 26,
        fontWeight: 500,
        lineHeight: 1.4,
        color: ink.secondary,
        paddingLeft: 14 + titleSize * 0.72,
      }}
    >
      {desc}
    </div>
  </div>
);

/* ------------------------------------------------------------------ *
 * 山谷氛围层 — 封面与结尾共用
 * ------------------------------------------------------------------ */

const LivingLandscape = () => {
  const active = useIsActivePage();
  const anim = (name: string, dur: string) =>
    active ? `${name} ${dur} ease-in-out infinite` : 'none';

  return (
    <div
      aria-hidden="true"
      style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}
    >
      <img
        alt=""
        src={kiteValley}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          animation: anim('zhiye-breathe', '22s'),
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse 36% 13% at 18% 32%, rgba(255,255,255,.82), transparent 72%), radial-gradient(ellipse 34% 12% at 77% 27%, rgba(255,255,255,.7), transparent 75%)',
          filter: 'blur(14px)',
          animation: anim('zhiye-clouds', '18s'),
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(circle at 67% 22%, rgba(255,248,204,.84), transparent 17%)',
          mixBlendMode: 'screen',
          animation: anim('zhiye-sun', '9s'),
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: '18%',
          right: '18%',
          bottom: 0,
          height: '47%',
          background:
            'linear-gradient(108deg, transparent 18%, rgba(255,255,255,.9) 48%, transparent 76%)',
          filter: 'blur(8px)',
          mixBlendMode: 'soft-light',
          animation: anim('zhiye-river', '6s'),
        }}
      />
      <svg
        viewBox="0 0 42 55"
        fill="none"
        style={{
          position: 'absolute',
          top: '31%',
          left: '63%',
          width: 38,
          filter: 'drop-shadow(0 4px 5px rgba(38,61,69,.18))',
          animation: anim('zhiye-kite-a', '9s'),
        }}
      >
        <path d="M21 2 39 22 21 42 3 22 21 2Z" fill="#F6B84A" fillOpacity=".88" />
        <path d="M21 2v40M3 22h36" stroke="#D86B67" strokeWidth="1.3" />
        <path
          d="M21 42c-3 5 5 5 1 10s6 5 2 10"
          stroke="#D86B67"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
      </svg>
      <svg
        viewBox="0 0 42 55"
        fill="none"
        style={{
          position: 'absolute',
          top: '38%',
          right: '18%',
          width: 30,
          filter: 'drop-shadow(0 4px 5px rgba(38,61,69,.18))',
          animation: anim('zhiye-kite-b', '11s'),
        }}
      >
        <path d="M21 2 39 22 21 42 3 22 21 2Z" fill="#78C8A6" fillOpacity=".82" />
        <path d="M21 2v40M3 22h36" stroke="#4A9B8E" strokeWidth="1.3" />
        <path
          d="M21 42c3 5-5 5-1 10s-6 5-2 10"
          stroke="#4A9B8E"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
      </svg>
      {/* 白色薄纱：把山谷压浅，让深墨绿文字站得住 */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(180deg, rgba(255,255,255,.88) 0%, rgba(255,255,255,.52) 34%, rgba(255,255,255,.1) 58%, rgba(255,255,255,.66) 100%)',
        }}
      />
    </div>
  );
};

/** 暖白圆角卡片 — 前端 workspace-task-stage 的同款语言 */
const StageCard = ({
  children,
  width,
  style,
}: {
  children: ReactNode;
  width?: number;
  style?: CSSProperties;
}) => (
  <div
    style={{ position: 'relative', boxSizing: 'border-box', width: width, background: ink.panel, border: `1px solid rgba(48,79,55,.10)`, borderRadius: 'var(--osd-radius)', padding: '56px 64px', boxShadow: '0 10px 30px rgba(49,76,56,.045)', display: 'flex', flexDirection: 'column', ...style, backgroundColor: undefined, translate: '0px -167px' }}
  >
    {children}
  </div>
);

/* ================================================================== *
 * 01 · 封面
 * ================================================================== */

const Cover: Page = () => (
  <div
    style={{
      ...fill,
      position: 'relative',
      overflow: 'hidden',
      background: '#EAF2E6',
    }}
  >
    <LivingLandscape />
    <div
      style={{
        ...fill,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: `0 ${PAD_X}px`,
        boxSizing: 'border-box',
      }}
    >
      <StageCard width={860} style={{ alignItems: 'center', textAlign: 'center' }}>
        <Eyebrow>{'\n'}</Eyebrow>
        <div
          style={{ marginTop: 24, fontFamily: fontHand, fontSize: 'var(--osd-size-hero)', lineHeight: 1, color: 'var(--osd-text)' }}
        ><span style={{ fontSize: '268px' }}>知野</span></div>
        <div style={{ marginTop: 20, width: 96, height: 2, background: ink.sage }} />
        <div
          style={{
            marginTop: 24,
            fontSize: 44,
            fontWeight: 700,
            lineHeight: 1.4,
            color: 'var(--osd-text)',
          }}
        >
          让每一节课，成为下一次教学的依据
        </div>
        <div
          style={{
            marginTop: 14,
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: '0.16em',
            lineHeight: 1.4,
            color: ink.secondary,
          }}
        >
          课堂复盘数字员工 · 参赛路演
        </div>
      </StageCard>
    </div>
  </div>
);

/* ================================================================== *
 * 02 · 课后场景
 * ================================================================== */

/** 2×2 任务卡 */
const TaskCard = ({
  index,
  title,
  desc,
}: {
  index: string;
  title: string;
  desc: string;
}) => (
  <div
    style={{
      boxSizing: 'border-box',
      height: 208,
      background: ink.panel,
      border: `1px solid rgba(48,79,55,.10)`,
      borderRadius: 'var(--osd-radius)',
      padding: '32px 40px',
      boxShadow: '0 10px 30px rgba(49,76,56,.045)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      gap: 12,
    }}
  >
    <div
      style={{
        fontSize: 26,
        fontWeight: 900,
        letterSpacing: '0.16em',
        color: 'var(--osd-accent)',
      }}
    >
      {index}
    </div>
    <div style={{ fontSize: 38, fontWeight: 800, lineHeight: 1.3, color: 'var(--osd-text)' }}>
      {title}
    </div>
    <div style={{ fontSize: 26, fontWeight: 500, lineHeight: 1.4, color: ink.secondary }}>
      {desc}
    </div>
  </div>
);

const Scene: Page = () => (
  <PageShell>
    <Eyebrow>问题现场</Eyebrow>
    <div style={{ height: 26 }} />
    <Heading>一节课结束，教学支持还没有结束</Heading>
    <div style={{ height: 24 }} />
    <div style={{ fontSize: 40, fontWeight: 500, lineHeight: 1.5, color: ink.body }}>
      课后整理、补讲与跟进，都落在同一位教师身上。
    </div>
    <div style={{ height: 56 }} />
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 48,
      }}
    >
      <Steps>
        <Step>
          <TaskCard index="01" title="整理课堂重点" desc="从整节课里挑出真正要复习的内容" />
        </Step>
        <Step>
          <TaskCard index="02" title="准备补讲材料" desc="把学生不懂的地方变成能讲的材料" />
        </Step>
        <Step>
          <TaskCard index="03" title="跟进学生疑问" desc="谁卡在哪一步，需要逐人回应" />
        </Step>
        <Step>
          <TaskCard index="04" title="反复回看记录" desc="同一节课被翻来覆去地听和找" />
        </Step>
      </Steps>
    </div>
  </PageShell>
);

/* ================================================================== *
 * 03 · 三个断点
 * ================================================================== */

const BreakColumn = ({
  role,
  statement,
}: {
  role: string;
  statement: string;
}) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
    <div
      style={{
        display: 'inline-flex',
        alignSelf: 'flex-start',
        alignItems: 'center',
        height: 44,
        padding: '0 20px',
        borderRadius: 999,
        background: ink.sageSoft,
        fontSize: 28,
        fontWeight: 900,
        letterSpacing: '0.14em',
        color: '#3F5A46',
      }}
    >
      {role}
    </div>
    <div
      style={{
        fontSize: 38,
        fontWeight: 700,
        lineHeight: 1.5,
        color: 'var(--osd-text)',
      }}
    >
      {statement}
    </div>
  </div>
);

const Breakpoints: Page = () => (
  <PageShell>
    <Eyebrow>问题结构</Eyebrow>
    <div style={{ height: 26 }} />
    <Heading>教学支持的三个断点</Heading>
    <div style={{ height: 24 }} />
    <div style={{ fontSize: 36, fontWeight: 500, lineHeight: 1.6, color: ink.body }}>
      记录、学习支持与反馈之间，缺少连续利用。
    </div>
    <div style={{ height: 60 }} />
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 56,
      }}
    >
      <Steps>
        <Step>
          <BreakColumn role="对教师" statement="复盘与材料准备挤占精力，课后时间被重复劳动占满。" />
        </Step>
        <Step>
          <BreakColumn role="对学生" statement="卡在某一步时，需要适合当前理解程度的提示和练习。" />
        </Step>
        <Step>
          <BreakColumn role="对后续教学" statement="作业与提问分散各处，难以成为下一课的依据。" />
        </Step>
      </Steps>
    </div>
    <div style={{ height: 56 }} />
    <div
      style={{
        boxSizing: 'border-box',
        background: ink.sageSoft,
        borderRadius: 'var(--osd-radius)',
        padding: '32px 44px',
        fontSize: 34,
        fontWeight: 800,
        lineHeight: 1.5,
        color: '#3F5A46',
      }}
    >
      课堂记录，没有变成持续学习支持的依据。
    </div>
  </PageShell>
);

/* ================================================================== *
 * 04 · 完整闭环
 * ================================================================== */

const ChainCard = ({
  step,
  label,
  desc,
  accent,
}: {
  step: string;
  label: string;
  desc: string;
  accent?: boolean;
}) => (
  <div
    style={{
      boxSizing: 'border-box',
      height: 260,
      background: accent ? ink.goldSoft : ink.panel,
      border: `1px solid ${accent ? 'rgba(201,166,96,.42)' : 'rgba(48,79,55,.10)'}`,
      borderRadius: 'var(--osd-radius)',
      padding: '28px',
      boxShadow: accent
        ? '0 10px 30px rgba(201,166,96,.16)'
        : '0 10px 30px rgba(49,76,56,.045)',
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
    }}
  >
    <div
      style={{
        fontSize: 44,
        fontWeight: 900,
        lineHeight: 1.2,
        color: accent ? '#8A6A24' : 'var(--osd-accent)',
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      {step}
    </div>
    <div style={{ fontSize: 32, fontWeight: 800, lineHeight: 1.4, color: 'var(--osd-text)' }}>
      {label}
    </div>
    <div style={{ fontSize: 24, fontWeight: 500, lineHeight: 1.4, color: ink.secondary }}>
      {desc}
    </div>
  </div>
);

const Loop: Page = () => (
  <PageShell>
    <Eyebrow>解决方案</Eyebrow>
    <div style={{ height: 26 }} />
    <Heading>课堂到下一课的完整闭环</Heading>
    <div style={{ height: 24 }} />
    <div style={{ fontSize: 36, fontWeight: 500, lineHeight: 1.5, color: ink.body }}>
      教师审核，连接 AI 复盘与学生学习。
    </div>
    <div style={{ height: 72 }} />
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 40 }}>
      <Steps>
        <Step>
          <ChainCard step="01" label="课堂记录" desc="录音与补讲目标一起提交" />
        </Step>
        <Step>
          <ChainCard step="02" label="AI 整理" desc="本机转写，生成四项草稿" />
        </Step>
        <Step>
          <ChainCard step="03" label="教师审核" desc="核对、修改、确认发布" accent />
        </Step>
        <Step>
          <ChainCard step="04" label="学生学习" desc="复习卡、任务与答疑" />
        </Step>
        <Step>
          <ChainCard step="05" label="反馈回流" desc="完成情况回到教师端" />
        </Step>
      </Steps>
    </div>
    <div style={{ height: 72 }} />
    <Steps>
      <Step>
        <div
          style={{
            fontSize: 32,
            fontWeight: 800,
            lineHeight: 1.5,
            color: 'var(--osd-text)',
          }}
        >
          AI 承担整理，教师保留教学判断。
        </div>
      </Step>
    </Steps>
  </PageShell>
);

/* ================================================================== *
 * 05–08 · 产品证据页（截图 + 说明）
 * ================================================================== */

const EvidencePage = ({
  eyebrow,
  title,
  shot,
  caption,
  children,
}: {
  eyebrow: string;
  title: string;
  shot: string;
  caption: string;
  children: ReactNode;
}) => (
  <PageShell>
    <Eyebrow>{eyebrow}</Eyebrow>
    <div style={{ height: 26 }} />
    <Heading>{title}</Heading>
    <div style={{ height: 24 }} />
    <div style={{ display: 'flex', gap: 60, alignItems: 'flex-start' }}>
      <div
        style={{
          width: 660,
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
        }}
      >
        {children}
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <img
          alt={caption}
          src={shot}
          style={{
            width: '100%',
            display: 'block',
            borderRadius: 'var(--osd-radius)',
            border: `1px solid rgba(48,79,55,.10)`,
            boxShadow: '0 10px 30px rgba(49,76,56,.08)',
          }}
        />
        <div
          style={{
            marginTop: 16,
            fontSize: 24,
            fontWeight: 500,
            lineHeight: 1.4,
            color: ink.secondary,
          }}
        >
          {caption}
        </div>
      </div>
    </div>
  </PageShell>
);

const Outputs: Page = () => (
  <EvidencePage
    eyebrow="产品成果"
    title="录下课堂，生成可用的草稿"
    shot={workspaceShot}
    caption="教师工作台 · 待确认的一节课，AI 初稿已就绪"
  >
    <Point title="提交录音与补讲目标" desc="两个输入共同驱动结构化生成" />
    <Point title="学生复习卡草稿" desc="承接课堂重点与自检问题，可直接编辑" />
    <Point title="教师课堂报告" desc="整理课堂依据与下一节课建议" />
    <Point title="补讲教案与练习" desc="把教学建议衔接成可执行任务" />
  </EvidencePage>
);

const Evidence: Page = () => (
  <EvidencePage
    eyebrow="可追溯性"
    title="每条建议，都有课堂依据"
    shot={lessonDetailShot}
    caption="课堂详情 · 原始转写、复习卡、报告与进度同页核对"
  >
    <Point title="原始转写可核对" desc="带说话人与时间区间的原话" />
    <Point title="事实与推断分开" desc="课堂证据与 AI 建议不混在一起" />
    <Point title="教师核实后取舍" desc="采纳、修改或不用，由教师决定" />
    <Point title="发布前逐条对照" desc="材料质量仍需要教师检查" />
  </EvidencePage>
);

const Review: Page = () => (
  <EvidencePage
    eyebrow="关键节点"
    title="教师审核，才抵达学生"
    shot={reviewShot}
    caption="审核与发布 · 学生端在发布前明确提示不可查看"
  >
    <Point title="AI 初稿可以编辑" desc="复习卡内容直接修改，草稿自动保存" />
    <Point title="发布前一次确认" desc="弹窗明示学生将看到什么" />
    <Point title="学生只看已发布内容" desc="未发布时提示暂不可查看" />
    <Point title="转写与报告不公开" desc="只对教师可见" />
  </EvidencePage>
);

const Feedback: Page = () => (
  <EvidencePage
    eyebrow="反馈回流"
    title="学生学习，再回到下一课"
    shot={insightsShot}
    caption="班级洞察 · 任务完成情况与疑问的班级级聚合"
  >
    <Point title="复习卡与课后任务" desc="巩固课堂重点与自检问题" />
    <Point title="分层提示与思路复述" desc="先提示，再讲解，再变式练习" />
    <Point title="班级聚合学习信号" desc="完成情况与疑问汇总到教师端" />
    <Point title="下一课草稿不自动推送" desc="如何使用仍由教师决定" />
  </EvidencePage>
);

/* ================================================================== *
 * 09 · 工具编排
 * ================================================================== */

const ChainRow = ({
  stage,
  title,
  desc,
  status,
  accent,
}: {
  stage: string;
  title: string;
  desc: string;
  status: string;
  accent?: boolean;
}) => (
  <div
    style={{
      boxSizing: 'border-box',
      height: 84,
      display: 'flex',
      alignItems: 'center',
      gap: 32,
      background: accent ? ink.goldSoft : ink.panel,
      border: `1px solid ${accent ? 'rgba(201,166,96,.42)' : 'rgba(48,79,55,.10)'}`,
      borderRadius: 'var(--osd-radius)',
      padding: '0 40px',
    }}
  >
    <div
      style={{
        width: 128,
        flexShrink: 0,
        fontSize: 26,
        fontWeight: 900,
        letterSpacing: '0.12em',
        color: accent ? '#8A6A24' : 'var(--osd-accent)',
      }}
    >
      {stage}
    </div>
    <div
      style={{
        width: 232,
        flexShrink: 0,
        fontSize: 32,
        fontWeight: 800,
        lineHeight: 1.4,
        color: 'var(--osd-text)',
      }}
    >
      {title}
    </div>
    <div style={{ flex: 1, fontSize: 28, fontWeight: 500, lineHeight: 1.4, color: ink.secondary }}>
      {desc}
    </div>
    <div
      style={{
        flexShrink: 0,
        display: 'inline-flex',
        alignItems: 'center',
        height: 44,
        padding: '0 22px',
        borderRadius: 999,
        background: accent ? 'rgba(201,166,96,.28)' : ink.sageSoft,
        fontSize: 24,
        fontWeight: 900,
        letterSpacing: '0.08em',
        color: accent ? '#8A6A24' : '#3F5A46',
      }}
    >
      {status}
    </div>
  </div>
);

const Orchestration: Page = () => (
  <PageShell>
    <Eyebrow>技术机制</Eyebrow>
    <div style={{ height: 26 }} />
    <Heading>有状态、有依据的工具编排</Heading>
    <div style={{ height: 24 }} />
    <div style={{ fontSize: 36, fontWeight: 500, lineHeight: 1.5, color: ink.body }}>
      一条多步工作流，每步保留状态与错误原因。
    </div>
    <div style={{ height: 56 }} />
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <Steps>
        <Step>
          <ChainRow
            stage="STEP 01"
            title="本地转写"
            desc="FunASR 在本机处理音频，输出带时间戳的文本"
            status="已完成"
          />
        </Step>
        <Step>
          <ChainRow
            stage="STEP 02"
            title="证据提取"
            desc="从课堂文本中提取可引用的事实片段"
            status="已完成"
          />
        </Step>
        <Step>
          <ChainRow
            stage="STEP 03"
            title="结构化生成"
            desc="生成复习卡、课堂报告、教案与练习草稿"
            status="等待审核"
          />
        </Step>
        <Step>
          <ChainRow
            stage="STEP 04"
            title="教师审核"
            desc="教师核对、修改并确认后才发布，不自动推送"
            status="人工节点"
            accent
          />
        </Step>
      </Steps>
    </div>
    <div style={{ height: 48 }} />
    <div
      style={{
        boxSizing: 'border-box',
        background: ink.sageSoft,
        borderRadius: 'var(--osd-radius)',
        padding: '28px 44px',
        fontSize: 32,
        fontWeight: 700,
        lineHeight: 1.5,
        color: '#3F5A46',
      }}
    >
      音频与题图留在本机，只有所需文本进入大模型；失败步骤可重试。
    </div>
  </PageShell>
);

/* ================================================================== *
 * 10 · 验证结果
 * ================================================================== */

const BigNumber = ({ value, label }: { value: string; label: string }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
    <div
      style={{
        fontFamily: 'var(--osd-font-display)',
        fontSize: 116,
        fontWeight: 900,
        lineHeight: 1,
        color: '#F4F7F3',
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      {value}
    </div>
    <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: '0.1em', color: ink.gold }}>
      {label}
    </div>
  </div>
);

const PendingItem = ({ children }: { children: ReactNode }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
    <span
      style={{
        width: 10,
        height: 10,
        flexShrink: 0,
        borderRadius: '50%',
        background: ink.gold,
      }}
    />
    <span style={{ fontSize: 28, fontWeight: 700, lineHeight: 1.5, color: 'var(--osd-text)' }}>
      {children}
    </span>
  </div>
);

const Verification: Page = () => (
  <PageShell>
    <Eyebrow>验证结果</Eyebrow>
    <div style={{ height: 26 }} />
    <Heading>工程验收已通过，真实课堂效果待验证</Heading>
    <div style={{ height: 24 }} />
    <div style={{ fontSize: 36, fontWeight: 500, lineHeight: 1.6, color: ink.body }}>
      历史验收覆盖工程流程与异常边界；真实课堂的成效还没有形成数据。
    </div>
    <div style={{ height: 48 }} />
    <div style={{ display: 'flex', gap: 60, alignItems: 'stretch' }}>
      {/* 深墨绿大数字分区 */}
      <div
        style={{
          boxSizing: 'border-box',
          width: 1020,
          background: ink.deep,
          borderRadius: 'var(--osd-radius)',
          padding: '48px 56px',
          display: 'flex',
          flexDirection: 'column',
          gap: 32,
        }}
      >
        <div
          style={{
            fontSize: 24,
            fontWeight: 900,
            letterSpacing: '0.2em',
            color: 'rgba(244,247,243,.6)',
          }}
        >
          DAY 08 历史验收记录
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <BigNumber value="181" label="前端测试通过" />
          <div style={{ width: 1, height: 120, background: 'rgba(244,247,243,.16)' }} />
          <BigNumber value="63" label="本地 AI 测试通过" />
          <div style={{ width: 1, height: 120, background: 'rgba(244,247,243,.16)' }} />
          <BigNumber value="4" label="类失败边界覆盖" />
        </div>
      </div>
      {/* 暖白待验证分区 */}
      <StageCard style={{ flex: 1, padding: '48px 56px', display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div
          style={{
            fontSize: 26,
            fontWeight: 900,
            letterSpacing: '0.16em',
            color: '#8A6A24',
          }}
        >
          尚未形成数据
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <PendingItem>端到端耗时</PendingItem>
          <PendingItem>转写可读性</PendingItem>
          <PendingItem>证据一致性</PendingItem>
          <PendingItem>教师修改量</PendingItem>
        </div>
      </StageCard>
    </div>
    <div style={{ height: 48 }} />
    <div style={{ fontSize: 30, fontWeight: 700, lineHeight: 1.5, color: ink.secondary }}>
      我们不把尚未验证的效果，写成已经取得的结果。
    </div>
  </PageShell>
);

/* ================================================================== *
 * 11 · 落地计划
 * ================================================================== */

const PlanPanel = ({
  label,
  labelColor,
  background,
  borderColor,
  children,
}: {
  label: string;
  labelColor: string;
  background: string;
  borderColor: string;
  children: ReactNode;
}) => (
  <div
    style={{
      boxSizing: 'border-box',
      flex: 1,
      background,
      border: `1px solid ${borderColor}`,
      borderRadius: 'var(--osd-radius)',
      padding: '48px 56px',
      display: 'flex',
      flexDirection: 'column',
      gap: 24,
    }}
  >
    <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: '0.16em', color: labelColor }}>
      {label}
    </div>
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: 18,
      }}
    >
      {children}
    </div>
  </div>
);

const NextStep: Page = () => (
  <PageShell>
    <Eyebrow>落地计划</Eyebrow>
    <div style={{ height: 26 }} />
    <Heading>下一步：小规模教师试用</Heading>
    <div style={{ height: 24 }} />
    <div style={{ fontSize: 36, fontWeight: 500, lineHeight: 1.6, color: ink.body }}>
      先用获准且脱敏的课堂音频，完成一次真实流程验收。
    </div>
    <div style={{ height: 48 }} />
    <div style={{ display: 'flex', gap: 60, alignItems: 'stretch' }}>
      <PlanPanel
        label="当前边界"
        labelColor="var(--osd-accent)"
        background={ink.panel}
        borderColor="rgba(48,79,55,.10)"
      >
        <Point title="同一浏览器内四端联动" desc="跨设备共享尚未接入" titleSize={30} />
        <Point title="正式账号认证未接入" desc="角色切换用于演示" titleSize={30} />
        <Point title="数据库契约已就绪" desc="前端暂未连接" titleSize={30} />
      </PlanPanel>
      <PlanPanel
        label="试用计划"
        labelColor="#8A6A24"
        background={ink.goldSoft}
        borderColor="rgba(201,166,96,.42)"
      >
        <Point title="授权脱敏音频试跑" desc="完成端到端真实流程" titleSize={30} />
        <Point title="教师审核对照" desc="比较 AI 草稿与教师修改" titleSize={30} />
        <Point title="持续学习反馈" desc="小规模班级，观察回流质量" titleSize={30} />
      </PlanPanel>
    </div>
    <div style={{ height: 48 }} />
    <div
      style={{
        boxSizing: 'border-box',
        background: ink.sageSoft,
        borderRadius: 'var(--osd-radius)',
        padding: '28px 44px',
        fontSize: 32,
        fontWeight: 700,
        lineHeight: 1.5,
        color: '#3F5A46',
      }}
    >
      待测指标：端到端耗时 · 转写可读性 · 证据一致性 · 教师修改量
    </div>
  </PageShell>
);

/* ================================================================== *
 * 12 · 结尾
 * ================================================================== */

const Closing: Page = () => (
  <div
    style={{
      ...fill,
      position: 'relative',
      overflow: 'hidden',
      background: '#EAF2E6',
    }}
  >
    <LivingLandscape />
    <div
      style={{
        ...fill,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: `0 ${PAD_X}px`,
        boxSizing: 'border-box',
      }}
    >
      <StageCard width={1240} style={{ alignItems: 'center', textAlign: 'center' }}>
        <Eyebrow>知野 · 课堂复盘数字员工</Eyebrow>
        <div
          style={{
            marginTop: 28,
            fontFamily: fontHand,
            fontSize: 76,
            lineHeight: 1.2,
            color: 'var(--osd-text)',
          }}
        >
          让每一间课堂，长出自己的回响
        </div>
        <div style={{ marginTop: 24, width: 96, height: 2, background: ink.sage }} />
        <div
          style={{
            marginTop: 24,
            fontSize: 34,
            fontWeight: 700,
            lineHeight: 1.5,
            color: ink.body,
          }}
        >
          让 AI 承担整理，让教师保留判断，让课堂记录继续支持孩子的学习。
        </div>
        <div
          style={{
            marginTop: 14,
            fontSize: 30,
            fontWeight: 900,
            letterSpacing: '0.28em',
            color: 'var(--osd-accent)',
          }}
        >
          知其所学，野望生长
        </div>
      </StageCard>
    </div>
  </div>
);

/* ------------------------------------------------------------------ *
 * 转场 — 全套同一 DNA：RISE，封面 / 结尾用 SETTLE
 * ------------------------------------------------------------------ */

export const transition: SlideTransition = {
  duration: 260,
  easing: EASE_OUT,
  exit: { duration: 260, easing: EASE_IN, keyframes: HOLD },
  enter: {
    duration: 260,
    easing: EASE_OUT,
    keyframes: [
      { opacity: 0, transform: 'translateY(6px)' },
      { opacity: 1, transform: 'translateY(0)' },
    ],
  },
};

Cover.transition = {
  duration: 280,
  exit: { duration: 280, easing: EASE_IN, keyframes: HOLD },
  enter: {
    duration: 280,
    easing: EASE_OUT,
    keyframes: [
      { opacity: 0, transform: 'translateY(12px)', filter: 'blur(4px)' },
      { opacity: 1, transform: 'translateY(0)', filter: 'blur(0)' },
    ],
  },
};

Closing.transition = {
  duration: 280,
  exit: { duration: 280, easing: EASE_IN, keyframes: HOLD },
  enter: {
    duration: 280,
    easing: EASE_OUT,
    keyframes: [
      { opacity: 0, transform: 'translateY(12px)', filter: 'blur(4px)' },
      { opacity: 1, transform: 'translateY(0)', filter: 'blur(0)' },
    ],
  },
};

/* ------------------------------------------------------------------ *
 * Meta / Notes / Export
 * ------------------------------------------------------------------ */

export const meta: SlideMeta = {
  title: '知野 · 课堂复盘数字员工 — 参赛路演',
  createdAt: '2026-10-15T11:19:32.674Z',
};

export const notes: (string | undefined)[] = [
  `各位评委好，我们的项目叫知野，是面向乡村小学教师的课堂复盘数字员工。
它从一节课的记录出发，把内容整理成教师可以审核、学生可以使用的材料，让每一节课成为下一次教学的依据。`,

  `一节课结束，教学支持还没有结束。
乡村小学教师还要整理课堂重点、准备补讲材料、跟进学生疑问。这些工作要反复回看课堂记录，也要把零散信息变成明确的教学行动。
知野从这个具体环节切入，让课后整理的成果进入教师工作台。`,

  `我们关注三个相互关联的断点。
对教师，复盘和材料准备挤占精力；对学生，遇到不会的步骤时需要适合当前理解程度的提示；对后续教学，作业和提问分散，难以连续利用。
我们希望让课堂记录成为持续学习支持的依据。`,

  `为此，知野把流程连接起来。
教师提交课堂录音与教学目标，AI 转写并生成草稿，教师核对、修改、确认发布，学生再复习、练习和提问。学习反馈回到教师端，支持下一次补讲。
整个流程里，AI 承担整理，教师保留教学判断。`,

  `具体来看，教师输入课堂录音和补讲目标，系统生成可以继续编辑的教学草稿。
学生复习卡承接课堂重点和自检问题，教师课堂报告整理课堂依据与教学建议，还可以衔接补讲教案和练习。
我们的设计重点是让生成成果真正进入后续教学流程。`,

  `生成之后，教师首先要判断建议是否有依据。
知野保留原始转写供教师核对，并把课堂事实与 AI 推断分开呈现。教师在课堂详情里查看转写、复习卡、报告和进度，核实建议与证据的关联，再决定是否采用。
这个机制提供了可追溯的审核入口，材料质量仍需要教师检查。`,

  `教师审核是课堂内容到达学生之前的关键节点。
AI 初稿可以编辑，教师可以核对、修改和取舍，并在发布前确认。未发布时，学生端明确提示复习卡不可查看。
只有教师确认发布后，学生才获得复习卡；课堂转写和教师报告不会公开。生成与发布分开，教师对最终教学内容保留决定权。`,

  `发布之后，学生用复习卡和任务巩固课堂内容，答疑流程通过分层提示、思路复述和变式练习支持理解。
学生的完成情况汇总到教师端班级洞察，形成班级聚合的学习信号，再支持下一课的教师草稿。这个草稿不会自动推送，仍由教师决定如何使用。`,

  `这些能力背后是一条有状态、有依据的工具工作流。
本地 FunASR 把音频转成文本，系统依据课堂文本提取证据，完成结构化生成，随后等待教师审核。每步保留状态和错误原因，并提供失败步骤的重试路径。
本地模式下，音频与题图由本机处理，只有所需文本进入大模型。`,

  `验证方面，项目 Day 08 的历史验收记录显示：181 项前端测试、63 项本地 AI 测试通过，类型检查和生产构建也通过；四类失败边界已覆盖。
需要说明的是，真实课堂的耗时、教师减负和学习提升仍待验证，我们没有把这些效果写成已经取得的结果。`,

  `当前版本是同一浏览器内四端联动的演示原型，跨设备共享和正式账号认证尚未接入。
下一步先用获准且脱敏的课堂音频完成真实流程验收，再开展小规模教师审核对照和持续反馈。我们会测量端到端耗时、转写可读性、证据一致性和教师修改量，用真实试用判断项目的价值。`,

  `知野希望让每一间课堂长出自己的回响。
让 AI 承担整理，让教师保留判断，让课堂记录继续支持孩子的学习。
知其所学，野望生长。谢谢各位评委。`,
];

export default [Cover, Scene, Breakpoints, Loop, Outputs, Evidence, Review, Feedback, Orchestration, Verification, NextStep, Closing] satisfies Page[];

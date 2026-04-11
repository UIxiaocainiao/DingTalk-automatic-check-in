import {
  Activity,
  AlarmClockCheck,
  BadgeCheck,
  BellRing,
  Bot,
  Bug,
  CalendarRange,
  CheckCheck,
  CirclePlay,
  Clock3,
  Cog,
  FileClock,
  FolderCog,
  Gauge,
  ListChecks,
  Menu,
  MoonStar,
  Play,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  SquareTerminal,
  Stethoscope,
  SunMedium,
  TriangleAlert,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Badge } from "./components/ui/badge";
import { Button } from "./components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./components/ui/card";
import { Input } from "./components/ui/input";
import { Separator } from "./components/ui/separator";
import { cn } from "./lib/utils";

const navItems = [
  { id: "overview", label: "总览面板", icon: Gauge },
  { id: "actions", label: "快捷操作", icon: Stethoscope },
  { id: "windows", label: "今日排期", icon: CalendarRange },
  { id: "config", label: "基础配置", icon: FolderCog },
  { id: "logs", label: "执行日志", icon: FileClock },
  { id: "guards", label: "校验规则", icon: ShieldCheck },
];

const metrics = [
  {
    label: "当前任务状态",
    value: "运行中",
    note: "调度器已激活，等待下一个随机时间",
    icon: Activity,
  },
  {
    label: "设备状态",
    value: "已连接",
    note: "serial: emulator-5554",
    icon: Smartphone,
  },
  {
    label: "下一次上午执行",
    value: "08:43",
    note: "今日已抽取，支持重新生成",
    icon: AlarmClockCheck,
  },
  {
    label: "最近成功执行",
    value: "昨天 18:09",
    note: "最近一次工作日校验正常",
    icon: BadgeCheck,
  },
];

const priorities = [
  {
    title: "下一步最可能操作",
    value: "08:43 上午打卡已完成",
    note: "建议先确认下午窗口，再决定是否试运行一次。",
    icon: CheckCheck,
  },
  {
    title: "当前风险提醒",
    value: "工作日接口依赖在线",
    note: "如网络不稳定，可临时关闭工作日校验后保存。",
    icon: TriangleAlert,
  },
  {
    title: "最近变更影响",
    value: "轮询间隔 30 秒",
    note: "属于高频配置项，保存后建议立即执行自检。",
    icon: BellRing,
  },
];

const quickChecklist = [
  "确认设备已连接且 ADB 已授权",
  "核对今天上午 / 下午随机执行时间",
  "变更关键配置后先执行一键自检",
];

const configGroups = [
  {
    title: "设备与应用",
    description: "先配置识别对象，再校验状态文件落点。",
    fields: [
      { label: "设备序列号 serial", value: "emulator-5554", helper: "用于绑定具体 ADB 设备" },
      { label: "应用包名 package", value: "com.alibaba.android.rimet" },
      { label: "应用名称 app_label", value: "钉钉" },
      { label: "状态文件路径 state_file", value: "./runtime/state.json" },
    ],
  },
  {
    title: "调度与服务",
    description: "控制节奏、工作日判断与接口容错。",
    fields: [
      { label: "启动后停留时长", value: "4 秒" },
      { label: "轮询间隔 poll_interval", value: "30 秒", helper: "建议设置下限保护，避免过高轮询" },
      { label: "工作日接口地址", value: "https://holiday.dreace.top?date=YYYY-MM-DD" },
      { label: "接口超时时间", value: "3000 ms" },
    ],
  },
];

const toggles = [
  "scrcpy 观察模式 已开启",
  "成功通知 已开启",
  "工作日校验 已开启",
];

const windowsData = [
  {
    title: "上午窗口",
    note: "系统会在这个区间内随机抽取一个执行时刻。",
    start: "08:35",
    end: "08:55",
    selected: "08:43",
    completed: "2026-04-09",
  },
  {
    title: "下午窗口",
    note: "随机逻辑与上午一致，支持独立控制。",
    start: "18:05",
    end: "18:30",
    selected: "18:17",
    completed: "2026-04-09",
  },
];

const actions = [
  { label: "一键自检", style: "default", icon: Stethoscope },
  { label: "查看排期", style: "secondary", icon: FileClock },
  { label: "刷新设备状态", style: "secondary", icon: RefreshCw },
  { label: "启动任务", style: "secondary", icon: Play },
  { label: "停止任务", style: "ghost", icon: CirclePlay },
  { label: "调试模式", style: "secondary", icon: Bug },
  { label: "试运行一次", style: "secondary", icon: Bot },
];

const statusTags = ["任务 运行中", "scrcpy 运行中", "今天是工作日"];

const statusRows = [
  ["设备状态", "已连接 / 已授权", true],
  ["上午下一次执行时间", "2026-04-10 08:43"],
  ["下午下一次执行时间", "2026-04-10 18:17"],
  ["最近一次成功执行时间", "2026-04-09 18:09"],
  ["最近一次工作日校验结果", "HTTP 200 / true"],
];

const logs = [
  {
    time: "08:43",
    title: "上午自动打卡执行完成",
    detail: "启动应用 > 进入工作台 > 完成打卡 > 发送通知",
    status: "成功",
  },
  {
    time: "07:58",
    title: "工作日接口检查",
    detail: "GET /workday 返回 true，响应耗时 182ms",
    status: "成功",
  },
  {
    time: "昨天 18:09",
    title: "下午自动打卡执行完成",
    detail: "随机窗口命中 18:17，动作链路整体正常",
    status: "成功",
  },
  {
    time: "昨天 07:30",
    title: "ADB 授权提醒",
    detail: "检测到设备重新连接，授权状态恢复正常",
    status: "已处理",
  },
];

const guards = [
  ["设备未连接提醒", "保存前阻断启动动作", true],
  ["ADB 未授权提醒", "显示明确授权步骤"],
  ["工作日接口异常提示", "超时与失败次数聚合展示"],
  ["时间窗口合法性校验", "开始时间必须早于结束时间"],
  ["轮询与超时参数下限", "防止设置过低造成压力"],
  ["关键配置变更二次确认", "serial / package / state_file 变更需确认", true],
];

const timeline = [
  "07:58 工作日校验通过",
  "08:43 上午随机执行完成",
  "17:50 设备状态复检正常",
  "18:17 下午随机计划待执行",
];

const initialConfigState = Object.fromEntries(
  configGroups.flatMap((group) => group.fields.map((field) => [field.label, field.value])),
);

const initialWindowState = Object.fromEntries(
  windowsData.flatMap((item) => [
    [`${item.title}-start`, item.start],
    [`${item.title}-end`, item.end],
    [`${item.title}-selected`, item.selected],
    [`${item.title}-completed`, item.completed],
  ]),
);

function statusTone(value) {
  if (/(成功|已连接|已授权|已校验|运行中|工作日|已同步)/.test(value)) return "success";
  if (/(提醒|未保存|处理中|待执行|试运行|重新抽取|风险)/.test(value)) return "warning";
  return "secondary";
}

function parseNumber(value) {
  const parsed = Number.parseInt(String(value).replace(/[^\d]/g, ""), 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function App() {
  const [theme, setTheme] = useState(() => {
    const saved =
      typeof window !== "undefined" ? window.localStorage.getItem("console-theme") : null;
    if (saved === "dark" || saved === "light") return saved;
    if (typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches) {
      return "dark";
    }
    return "light";
  });
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("overview");
  const [pendingAction, setPendingAction] = useState("");
  const [configValues, setConfigValues] = useState(initialConfigState);
  const [savedConfigValues, setSavedConfigValues] = useState(initialConfigState);
  const [windowValues, setWindowValues] = useState(initialWindowState);
  const [savedWindowValues, setSavedWindowValues] = useState(initialWindowState);
  const [feedback, setFeedback] = useState({
    type: "default",
    title: "当前配置已同步",
    detail: "建议优先关注今日排期与设备状态，再决定是否执行高频动作。",
  });

  const quickActionSet = useMemo(
    () =>
      new Set([
        "保存配置",
        "启动任务",
        "自检",
        "一键自检",
        "刷新设备状态",
        "试运行一次",
        "重新抽取",
      ]),
    [],
  );

  const dirtyCount = useMemo(() => {
    const configDirty = Object.keys(configValues).filter(
      (key) => configValues[key] !== savedConfigValues[key],
    ).length;
    const windowDirty = Object.keys(windowValues).filter(
      (key) => windowValues[key] !== savedWindowValues[key],
    ).length;
    return configDirty + windowDirty;
  }, [configValues, savedConfigValues, windowValues, savedWindowValues]);

  const validation = useMemo(() => {
    const next = {};
    const add = (key, message) => {
      next[key] = message;
    };

    if (!String(configValues["设备序列号 serial"] || "").trim()) {
      add("设备序列号 serial", "设备序列号不能为空。");
    }
    if (!String(configValues["应用包名 package"] || "").trim()) {
      add("应用包名 package", "应用包名不能为空。");
    }
    if (!String(configValues["应用名称 app_label"] || "").trim()) {
      add("应用名称 app_label", "应用名称不能为空。");
    }
    if (!String(configValues["状态文件路径 state_file"] || "").trim()) {
      add("状态文件路径 state_file", "状态文件路径不能为空。");
    }

    const launchDelay = parseNumber(configValues["启动后停留时长"]);
    if (launchDelay === null || launchDelay < 1) {
      add("启动后停留时长", "启动后停留时长至少为 1 秒。");
    }

    const pollInterval = parseNumber(configValues["轮询间隔 poll_interval"]);
    if (pollInterval === null || pollInterval < 15) {
      add("轮询间隔 poll_interval", "轮询间隔建议不低于 15 秒。");
    }

    const timeout = parseNumber(configValues["接口超时时间"]);
    if (timeout === null || timeout < 1000) {
      add("接口超时时间", "接口超时时间建议不低于 1000 ms。");
    }

    const workdayUrl = String(configValues["工作日接口地址"] || "").trim();
    if (!/^https?:\/\//.test(workdayUrl)) {
      add("工作日接口地址", "工作日接口地址必须以 http:// 或 https:// 开头。");
    }

    windowsData.forEach((item) => {
      const startKey = `${item.title}-start`;
      const endKey = `${item.title}-end`;
      const start = String(windowValues[startKey] || "").trim();
      const end = String(windowValues[endKey] || "").trim();
      if (!/^\d{2}:\d{2}$/.test(start)) add(startKey, "时间格式应为 HH:MM。");
      if (!/^\d{2}:\d{2}$/.test(end)) add(endKey, "时间格式应为 HH:MM。");
      if (/^\d{2}:\d{2}$/.test(start) && /^\d{2}:\d{2}$/.test(end) && start >= end) {
        add(endKey, "结束时间必须晚于开始时间。");
      }
    });

    return next;
  }, [configValues, windowValues]);

  const validationIssues = useMemo(
    () => Object.entries(validation).map(([key, message]) => ({ key, message })),
    [validation],
  );

  const hasBlockingIssues = validationIssues.length > 0;

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    window.localStorage.setItem("console-theme", theme);
  }, [theme]);

  useEffect(() => {
    const sectionIds = navItems.map((item) => item.id);
    const elements = sectionIds.map((id) => document.getElementById(id)).filter(Boolean);

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visible[0]?.target?.id) {
          setActiveSection(visible[0].target.id);
        }
      },
      { rootMargin: "-15% 0px -55% 0px", threshold: [0.2, 0.35, 0.6] },
    );

    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!mobileNavOpen) return undefined;

    const closeOnEscape = (event) => {
      if (event.key === "Escape") setMobileNavOpen(false);
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [mobileNavOpen]);

  useEffect(() => {
    if (feedback.type === "default") return undefined;

    const timer = window.setTimeout(() => {
      setFeedback({
        type: "default",
        title: dirtyCount > 0 ? `当前有 ${dirtyCount} 项未保存变更` : "当前配置已同步",
        detail:
          dirtyCount > 0
            ? "建议先保存配置，再执行自检或试运行，避免状态与参数不一致。"
            : "建议优先关注今日排期与设备状态，再决定是否执行高频动作。",
      });
    }, 2200);

    return () => window.clearTimeout(timer);
  }, [feedback.type, dirtyCount]);

  const handleConfigChange = (label, value) => {
    setConfigValues((current) => ({ ...current, [label]: value }));
  };

  const handleWindowChange = (title, key, value) => {
    setWindowValues((current) => ({ ...current, [`${title}-${key}`]: value }));
  };

  const isConfigFieldDirty = (label) => configValues[label] !== savedConfigValues[label];
  const isWindowFieldDirty = (title, key) =>
    windowValues[`${title}-${key}`] !== savedWindowValues[`${title}-${key}`];

  const handleAction = (label) => {
    if (!quickActionSet.has(label)) return;

    if ((label === "保存配置" || label === "启动任务") && hasBlockingIssues) {
      setFeedback({
        type: "warning",
        title: "请先修复阻断问题",
        detail: `当前还有 ${validationIssues.length} 项校验问题，修复后才能继续保存或启动任务。`,
      });
      return;
    }

    setPendingAction(label);

    if (label === "保存配置") {
      window.setTimeout(() => {
        setSavedConfigValues(configValues);
        setSavedWindowValues(windowValues);
        setFeedback({
          type: "success",
          title: "配置已保存",
          detail: "本地配置快照已更新，建议继续执行一键自检确认配置生效。",
        });
      }, 320);
    } else if (label === "重新抽取") {
      setWindowValues((current) => ({
        ...current,
        "上午窗口-selected": "08:47",
        "下午窗口-selected": "18:12",
      }));
      setFeedback({
        type: "warning",
        title: "今日计划已重新抽取",
        detail: "上午调整为 08:47，下午调整为 18:12。请确认窗口范围是否仍然合理。",
      });
    } else {
      const messages = {
        启动任务: ["success", "任务已加入执行队列", "当前为前端模拟反馈，后续可以直接接入 run 命令。"],
        自检: ["success", "环境自检已完成", "ADB、设备连接和工作日接口状态均已通过本地模拟校验。"],
        一键自检: ["success", "环境自检已完成", "ADB、设备连接和工作日接口状态均已通过本地模拟校验。"],
        刷新设备状态: ["success", "设备状态已刷新", "当前设备已连接，授权状态正常，可继续执行任务。"],
        试运行一次: ["warning", "试运行已触发", "建议先确认下午窗口，再观察本次动作日志是否符合预期。"],
      };
      const [type, title, detail] = messages[label] ?? [
        "default",
        `${label} 已处理`,
        "当前为前端交互原型反馈，可在下一步接入真实命令执行。",
      ];
      setFeedback({ type, title, detail });
    }

    window.setTimeout(() => {
      setPendingAction((current) => (current === label ? "" : current));
    }, 900);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="surface-grid pointer-events-none fixed inset-0 opacity-60 dark:opacity-40" />

      <div
        className={cn(
          "fixed inset-0 z-30 bg-black/30 backdrop-blur-sm transition-opacity lg:hidden",
          mobileNavOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        aria-hidden={!mobileNavOpen}
        onClick={() => setMobileNavOpen(false)}
      />

      <div className="mx-auto min-h-screen max-w-[1600px] lg:grid lg:grid-cols-[280px_minmax(0,1fr)]">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b bg-background/90 px-4 py-3 backdrop-blur lg:hidden">
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Console
            </p>
            <h1 className="truncate text-sm font-semibold">自动打卡控制台</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => setTheme((value) => (value === "light" ? "dark" : "light"))}>
              {theme === "light" ? <MoonStar /> : <SunMedium />}
            </Button>
            <Button variant="outline" size="icon" onClick={() => setMobileNavOpen((value) => !value)}>
              {mobileNavOpen ? <X /> : <Menu />}
            </Button>
          </div>
        </header>

        <aside
          className={cn(
            "sidebar-scrollbar fixed inset-y-0 left-0 z-40 flex w-[280px] flex-col overflow-y-auto border-r bg-background/95 px-4 py-6 backdrop-blur transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0",
            mobileNavOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="space-y-6">
            <div className="fade-up space-y-3" style={{ "--delay": "40ms" }}>
              <Badge variant="outline" className="rounded-md">
                DINGTALK CHECK-IN
              </Badge>
              <div className="space-y-2">
                <h2 className="text-xl font-semibold tracking-tight">自动打卡任务控制台</h2>
                <p className="text-sm leading-6 text-muted-foreground">
                  使用 `shadcn/ui` 组件体系重构后台控制台，优先缩短状态判断、执行动作和配置编辑路径。
                </p>
              </div>
            </div>

            <nav className="fade-up space-y-1.5" style={{ "--delay": "100ms" }}>
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className={cn(
                      "flex h-10 items-center gap-3 rounded-md border px-3 text-sm transition-colors",
                      activeSection === item.id
                        ? "border-border bg-accent text-accent-foreground"
                        : "border-transparent text-muted-foreground hover:border-border hover:bg-accent hover:text-accent-foreground",
                    )}
                    onClick={() => setMobileNavOpen(false)}
                  >
                    <Icon className="size-4" />
                    <span>{item.label}</span>
                  </a>
                );
              })}
            </nav>

            <Card className="fade-up" style={{ "--delay": "160ms" }}>
              <CardHeader className="pb-4">
                <CardTitle className="text-sm">今日概览</CardTitle>
                <CardDescription>优先看状态和执行窗口</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <SummaryRow label="工作日状态" value="已校验" />
                <SummaryRow label="设备连接" value="1 台已连接" />
                <SummaryRow label="随机计划" value="08:43 / 18:17" emphasized />
              </CardContent>
            </Card>
          </div>

          <div className="mt-auto space-y-3 pt-6">
            <Button
              variant="outline"
              className="fade-up w-full justify-start"
              style={{ "--delay": "220ms" }}
              onClick={() => setTheme((value) => (value === "light" ? "dark" : "light"))}
            >
              {theme === "light" ? <MoonStar /> : <SunMedium />}
              <span>{theme === "light" ? "切换深色模式" : "切换浅色模式"}</span>
            </Button>
            <div className="fade-up space-y-1 text-xs text-muted-foreground" style={{ "--delay": "260ms" }}>
              <p>版本 v0.4.0</p>
              <p>{theme === "light" ? "shadcn/ui · Light" : "shadcn/ui · Dark"}</p>
            </div>
          </div>
        </aside>

        <main className="min-w-0 px-4 pb-28 pt-4 sm:px-6 lg:px-8 lg:py-8">
          <div className="space-y-6">
            <section id="overview" className="fade-up" style={{ "--delay": "60ms" }}>
              <Card className="overflow-hidden">
                <CardHeader className="gap-5 border-b bg-muted/40">
                  <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                    <div className="space-y-3">
                      <Badge variant="outline" className="rounded-md">
                        AUTOMATION CONSOLE
                      </Badge>
                      <div className="space-y-2">
                        <CardTitle className="text-2xl sm:text-3xl">自动打卡任务配置与运行控制台</CardTitle>
                        <CardDescription className="max-w-3xl">
                          按 `shadcn/ui` 的卡片、表单、标签和导航语言重构，让状态浏览、配置编辑和动作执行更清晰。
                        </CardDescription>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <ActionButton
                        variant="default"
                        icon={Cog}
                        isPending={pendingAction === "保存配置"}
                        disabled={hasBlockingIssues}
                        onClick={() => handleAction("保存配置")}
                      >
                        保存配置
                      </ActionButton>
                      <ActionButton
                        variant="secondary"
                        icon={Play}
                        isPending={pendingAction === "启动任务"}
                        disabled={hasBlockingIssues}
                        onClick={() => handleAction("启动任务")}
                      >
                        启动任务
                      </ActionButton>
                      <ActionButton
                        variant="ghost"
                        icon={Stethoscope}
                        isPending={pendingAction === "自检"}
                        onClick={() => handleAction("自检")}
                      >
                        自检
                      </ActionButton>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6 pt-6">
                  <FeedbackBanner feedback={feedback} dirtyCount={dirtyCount} hasBlockingIssues={hasBlockingIssues}>
                    {dirtyCount > 0 ? (
                      <ActionButton
                        variant="default"
                        icon={Cog}
                        isPending={pendingAction === "保存配置"}
                        disabled={hasBlockingIssues}
                        onClick={() => handleAction("保存配置")}
                      >
                        立即保存
                      </ActionButton>
                    ) : null}
                  </FeedbackBanner>

                  {hasBlockingIssues ? (
                    <Card className="border-red-200 bg-red-50/80 dark:border-red-900/40 dark:bg-red-950/20">
                      <CardHeader className="pb-4">
                        <div className="flex flex-wrap items-center gap-3">
                          <Badge variant="destructive">阻断项 {validationIssues.length}</Badge>
                          <CardTitle className="text-sm">保存与启动前需要先修复以下问题</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {validationIssues.map((issue) => (
                          <div key={issue.key} className="flex items-start gap-2 text-sm text-foreground">
                            <TriangleAlert className="mt-0.5 size-4 text-red-500" />
                            <span>{issue.message}</span>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  ) : null}

                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {metrics.map((item, index) => (
                      <MetricCard key={item.label} item={item} delay={`${120 + index * 60}ms`} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </section>

            <section className="grid gap-4 xl:grid-cols-[1.3fr_0.9fr]">
              <div className="space-y-4">
                {priorities.map((item, index) => (
                  <Card key={item.title} className="fade-up card-hover" style={{ "--delay": `${120 + index * 60}ms` }}>
                    <CardContent className="flex items-start gap-4 p-5">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-full border bg-muted/40">
                        <item.icon className="size-4" />
                      </div>
                      <div className="space-y-1.5">
                        <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                          {item.title}
                        </p>
                        <h3 className="text-sm font-semibold leading-6">{item.value}</h3>
                        <p className="text-sm leading-6 text-muted-foreground">{item.note}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card className="fade-up" style={{ "--delay": "240ms" }}>
                <CardHeader>
                  <CardTitle>操作顺序建议</CardTitle>
                  <CardDescription>按这个顺序使用页面，能减少误操作和重复滚动。</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {quickChecklist.map((item, index) => (
                    <div
                      key={item}
                      className="flex items-start gap-3 rounded-lg border bg-muted/30 px-3 py-3 text-sm"
                    >
                      <Badge variant="outline" className="rounded-md">
                        {index + 1}
                      </Badge>
                      <p className="leading-6 text-muted-foreground">{item}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </section>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_380px]">
              <div className="space-y-6">
                <section id="actions" className="fade-up" style={{ "--delay": "160ms" }}>
                  <Card>
                    <CardHeader className="flex flex-col gap-4 border-b sm:flex-row sm:items-center sm:justify-between">
                      <div className="space-y-1.5">
                        <CardTitle>快捷运维操作</CardTitle>
                        <CardDescription>把最常用的动作前置到首屏中段，避免先进入配置再返回执行。</CardDescription>
                      </div>
                      <Badge variant="outline">高频</Badge>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-6">
                      <div className="flex flex-wrap gap-2">
                        {actions.map((item, index) => (
                          <ActionButton
                            key={item.label}
                            variant={item.style}
                            icon={item.icon}
                            className="fade-up"
                            style={{ "--delay": `${220 + index * 40}ms` }}
                            isPending={pendingAction === item.label}
                            onClick={() => handleAction(item.label)}
                          >
                            {item.label}
                          </ActionButton>
                        ))}
                      </div>
                      <div className="flex items-center gap-3 rounded-lg border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                        <SquareTerminal className="size-4 shrink-0" />
                        <p>建议流程：保存配置后先执行自检，再刷新设备状态，最后试运行一次。</p>
                      </div>
                    </CardContent>
                  </Card>
                </section>

                <section id="windows" className="fade-up" style={{ "--delay": "220ms" }}>
                  <Card>
                    <CardHeader className="flex flex-col gap-4 border-b sm:flex-row sm:items-center sm:justify-between">
                      <div className="space-y-1.5">
                        <CardTitle>今日排期与时间窗口</CardTitle>
                        <CardDescription>把今日计划和窗口编辑合并在一起，方便边看边改。</CardDescription>
                      </div>
                      <Badge variant="secondary">今日优先</Badge>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-6">
                      <div className="grid gap-3 lg:grid-cols-3">
                        <MiniPanel title="今日随机计划" value="08:43 / 18:17" detail="上午已完成，下午待执行。" />
                        <MiniPanel title="最近完成日期" value="2026-04-09" detail="两个窗口都已正常落库。" />
                        <div className="rounded-xl border bg-muted/30 p-4">
                          <div className="flex h-full flex-col justify-center gap-2">
                            <ActionButton
                              variant="default"
                              icon={RefreshCw}
                              isPending={pendingAction === "重新抽取"}
                              onClick={() => handleAction("重新抽取")}
                            >
                              重新抽取
                            </ActionButton>
                            <Button variant="ghost">恢复默认</Button>
                          </div>
                        </div>
                      </div>

                      <div className="grid gap-4 lg:grid-cols-2">
                        {windowsData.map((item, index) => (
                          <Card
                            key={item.title}
                            className="fade-up card-hover bg-muted/20"
                            style={{ "--delay": `${260 + index * 60}ms` }}
                          >
                            <CardHeader>
                              <CardTitle>{item.title}</CardTitle>
                              <CardDescription>{item.note}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <Field
                                label="开始时间"
                                value={windowValues[`${item.title}-start`]}
                                onChange={(event) => handleWindowChange(item.title, "start", event.target.value)}
                                dirty={isWindowFieldDirty(item.title, "start")}
                                error={validation[`${item.title}-start`]}
                              />
                              <Field
                                label="结束时间"
                                value={windowValues[`${item.title}-end`]}
                                onChange={(event) => handleWindowChange(item.title, "end", event.target.value)}
                                dirty={isWindowFieldDirty(item.title, "end")}
                                error={validation[`${item.title}-end`]}
                              />
                              <Separator />
                              <SummaryRow label="今日已抽取" value={windowValues[`${item.title}-selected`]} emphasized />
                              <SummaryRow label="最近完成日期" value={windowValues[`${item.title}-completed`]} />
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </section>

                <section id="config" className="fade-up" style={{ "--delay": "280ms" }}>
                  <Card>
                    <CardHeader className="flex flex-col gap-4 border-b sm:flex-row sm:items-center sm:justify-between">
                      <div className="space-y-1.5">
                        <CardTitle>基础配置编辑</CardTitle>
                        <CardDescription>配置区降到后半段，按照“设备与应用”到“调度与服务”的顺序编辑。</CardDescription>
                      </div>
                      <Badge variant="outline">低频</Badge>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-6">
                      <div className="grid gap-4 lg:grid-cols-2">
                        {configGroups.map((group) => (
                          <Card key={group.title} className="bg-muted/20">
                            <CardHeader>
                              <CardTitle>{group.title}</CardTitle>
                              <CardDescription>{group.description}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              {group.fields.map((field) => (
                                <Field
                                  key={field.label}
                                  label={field.label}
                                  value={configValues[field.label]}
                                  onChange={(event) => handleConfigChange(field.label, event.target.value)}
                                  dirty={isConfigFieldDirty(field.label)}
                                  error={validation[field.label]}
                                  helper={field.helper}
                                />
                              ))}
                            </CardContent>
                          </Card>
                        ))}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {toggles.map((item) => (
                          <Badge key={item} variant="outline" className="rounded-md">
                            {item}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </section>
              </div>

              <div className="space-y-6">
                <section className="fade-up" style={{ "--delay": "180ms" }}>
                  <Card>
                    <CardHeader className="flex flex-col gap-4 border-b sm:flex-row sm:items-center sm:justify-between">
                      <div className="space-y-1.5">
                        <CardTitle>运行状态面板</CardTitle>
                        <CardDescription>右侧固定承接状态、提醒和日志，方便连续扫读。</CardDescription>
                      </div>
                      <Badge variant="outline">实时</Badge>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-6">
                      <div className="flex flex-wrap gap-2">
                        {statusTags.map((item) => (
                          <Badge key={item} variant={statusTone(item)} className="rounded-md">
                            {item}
                          </Badge>
                        ))}
                      </div>
                      <div className="space-y-3">
                        {statusRows.map(([label, value, emphasized]) => (
                          <SummaryRow key={label} label={label} value={value} emphasized={emphasized} />
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </section>

                <section className="fade-up" style={{ "--delay": "220ms" }}>
                  <Card>
                    <CardHeader className="flex flex-col gap-4 border-b sm:flex-row sm:items-center sm:justify-between">
                      <div className="space-y-1.5">
                        <CardTitle>待处理提醒</CardTitle>
                        <CardDescription>把风险项抬到日志前面，让用户先处理阻断项。</CardDescription>
                      </div>
                      <Badge variant="warning">提醒</Badge>
                    </CardHeader>
                    <CardContent className="space-y-3 pt-6">
                      <AlertRow
                        icon={TriangleAlert}
                        title="工作日接口依赖在线"
                        detail="如果接口连续超时，建议临时关闭工作日校验，并在保存后执行自检。"
                      />
                      <AlertRow
                        icon={BellRing}
                        title="关键配置修改需二次确认"
                        detail="serial、package、state_file 变更会影响执行链路，建议在保存前复核。"
                      />
                      <AlertRow
                        icon={ListChecks}
                        title="建议先做自检再试运行"
                        detail="先检查设备状态和权限，再触发单次动作，能减少误报。"
                      />
                    </CardContent>
                  </Card>
                </section>

                <section id="logs" className="fade-up" style={{ "--delay": "260ms" }}>
                  <Card>
                    <CardHeader>
                      <CardTitle>日志与执行记录</CardTitle>
                      <CardDescription>结构化展示最近执行过程，更适合排障与运营查看。</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {logs.map((log) => (
                        <Card key={`${log.time}-${log.title}`} className="card-hover bg-muted/20">
                          <CardContent className="grid gap-3 p-4 sm:grid-cols-[auto_1fr_auto] sm:items-center">
                            <Badge variant="outline" className="rounded-md">
                              {log.time}
                            </Badge>
                            <div className="space-y-1">
                              <p className="text-sm font-semibold">{log.title}</p>
                              <p className="text-sm leading-6 text-muted-foreground">{log.detail}</p>
                            </div>
                            <Badge variant={statusTone(log.status)} className="rounded-md">
                              {log.status}
                            </Badge>
                          </CardContent>
                        </Card>
                      ))}
                    </CardContent>
                  </Card>
                </section>

                <section className="fade-up" style={{ "--delay": "300ms" }}>
                  <Card>
                    <CardHeader>
                      <CardTitle>每日执行时间线</CardTitle>
                      <CardDescription>帮助快速判断抽取时间、执行结果与异常落点。</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {timeline.map((item, index) => (
                        <div key={item}>
                          <div className="flex items-start gap-3 text-sm">
                            <Badge variant="outline" className="rounded-md">
                              {index + 1}
                            </Badge>
                            <p className={cn("leading-6 text-muted-foreground", index === 1 && "font-medium text-foreground")}>
                              {item}
                            </p>
                          </div>
                          {index < timeline.length - 1 ? <Separator className="mt-3" /> : null}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </section>

                <section id="guards" className="fade-up" style={{ "--delay": "340ms" }}>
                  <Card>
                    <CardHeader>
                      <CardTitle>异常提醒与校验保护</CardTitle>
                      <CardDescription>把规则区放到最后，作为深度排障和保存前确认。</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {guards.map(([label, value, emphasized], index) => (
                        <div key={label} className="space-y-4">
                          <SummaryRow label={label} value={value} emphasized={emphasized} />
                          {index < guards.length - 1 ? <Separator /> : null}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </section>
              </div>
            </div>
          </div>
        </main>

        <div className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-3 gap-2 border-t bg-background/95 px-4 py-3 backdrop-blur lg:hidden">
          <ActionButton
            variant="ghost"
            icon={Stethoscope}
            className="w-full"
            isPending={pendingAction === "自检"}
            onClick={() => handleAction("自检")}
          >
            自检
          </ActionButton>
          <ActionButton
            variant="secondary"
            icon={RefreshCw}
            className="w-full"
            isPending={pendingAction === "刷新设备状态"}
            onClick={() => handleAction("刷新设备状态")}
          >
            刷新
          </ActionButton>
          <ActionButton
            variant="default"
            icon={Play}
            className="w-full"
            isPending={pendingAction === "启动任务"}
            disabled={hasBlockingIssues}
            onClick={() => handleAction("启动任务")}
          >
            启动
          </ActionButton>
        </div>
      </div>
    </div>
  );
}

function ActionButton({ icon: Icon, children, isPending = false, className, ...props }) {
  return (
    <Button className={cn("gap-2", className)} {...props}>
      <Icon className={cn(isPending && "animate-spin")} />
      <span>{isPending ? "处理中" : children}</span>
    </Button>
  );
}

function SummaryRow({ label, value, emphasized = false }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border bg-muted/20 px-3 py-2.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={cn("max-w-[60%] text-right text-sm text-muted-foreground", emphasized && "font-medium text-foreground")}>
        {value}
      </span>
    </div>
  );
}

function MetricCard({ item, delay }) {
  const tone = statusTone(item.value);
  return (
    <Card className="fade-up card-hover bg-muted/20" style={{ "--delay": delay }}>
      <CardContent className="space-y-4 p-5">
        <div className="flex size-10 items-center justify-center rounded-lg border bg-background">
          <item.icon className="size-4" />
        </div>
        <div className="space-y-1.5">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">{item.label}</p>
          <div className="flex items-center gap-2">
            <h3 className="text-2xl font-semibold tracking-tight">{item.value}</h3>
            <Badge variant={tone} className="rounded-md">
              {tone === "success" ? "正常" : tone === "warning" ? "关注" : "信息"}
            </Badge>
          </div>
          <p className="text-sm leading-6 text-muted-foreground">{item.note}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function FeedbackBanner({ feedback, dirtyCount, hasBlockingIssues, children }) {
  const toneClasses =
    feedback.type === "success"
      ? "border-emerald-200 bg-emerald-50/80 dark:border-emerald-900/40 dark:bg-emerald-950/20"
      : feedback.type === "warning" || hasBlockingIssues
        ? "border-amber-200 bg-amber-50/80 dark:border-amber-900/40 dark:bg-amber-950/20"
        : "border-border bg-muted/30";

  return (
    <div className={cn("flex flex-col gap-4 rounded-xl border px-4 py-4 sm:flex-row sm:items-center sm:justify-between", toneClasses)}>
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="rounded-md">
            {dirtyCount > 0 ? `${dirtyCount} 项未保存` : "已同步"}
          </Badge>
          {feedback.type === "success" ? <Badge variant="success">已更新</Badge> : null}
          {(feedback.type === "warning" || hasBlockingIssues) ? <Badge variant="warning">需关注</Badge> : null}
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold">{feedback.title}</p>
          <p className="text-sm leading-6 text-muted-foreground">{feedback.detail}</p>
        </div>
      </div>
      {children ? <div className="shrink-0">{children}</div> : null}
    </div>
  );
}

function Field({ label, dirty, error, helper, ...props }) {
  return (
    <label className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium">{label}</span>
        {dirty ? (
          <Badge variant="outline" className="rounded-md text-[11px]">
            已修改
          </Badge>
        ) : null}
      </div>
      <Input
        className={cn(
          dirty && "border-zinc-400 dark:border-zinc-500",
          error && "border-red-400 focus-visible:ring-red-300 dark:border-red-500 dark:focus-visible:ring-red-900",
        )}
        aria-invalid={Boolean(error)}
        {...props}
      />
      {error ? <p className="text-xs text-red-600 dark:text-red-400">{error}</p> : null}
      {helper ? <p className="text-xs leading-5 text-muted-foreground">{helper}</p> : null}
    </label>
  );
}

function MiniPanel({ title, value, detail }) {
  return (
    <div className="rounded-xl border bg-muted/30 p-4">
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">{title}</p>
      <h3 className="mt-2 text-xl font-semibold tracking-tight">{value}</h3>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">{detail}</p>
    </div>
  );
}

function AlertRow({ icon: Icon, title, detail }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border bg-muted/20 p-4">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-full border bg-background">
        <Icon className="size-4" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-sm leading-6 text-muted-foreground">{detail}</p>
      </div>
    </div>
  );
}

export default App;

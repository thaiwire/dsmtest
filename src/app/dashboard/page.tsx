import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const roleLabels: Record<string, string> = {
  ADMIN: "ผู้ดูแลระบบ",
  MANAGER: "ผู้จัดการ",
  STAFF: "พนักงาน",
  VIEWER: "ผู้เข้าชม",
};

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { department: true },
  });

  const [totalDocuments, activeUsers, activeDepartments, draftDocuments, recentDocuments] =
    await Promise.all([
      prisma.document.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.department.count({ where: { isActive: true } }),
      prisma.document.count({ where: { status: "DRAFT" } }),
      prisma.document.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          documentType: true,
          department: true,
          createdBy: { select: { name: true } },
        },
      }),
    ]);

  const userRole = user?.role ?? session.user.role;
  const displayName = user?.name ?? session.user.name ?? "ผู้ใช้งาน";
  const departmentName = user?.department?.name ?? session.user.departmentName ?? "ไม่ระบุหน่วยงาน";

  const summaryCards = [
    {
      label: "เอกสารทั้งหมด",
      value: totalDocuments,
      detail: "รวมทุกเอกสารในระบบ",
      accent: "bg-blue-500/10 text-blue-700",
    },
    {
      label: "พนักงานที่ใช้งาน",
      value: activeUsers,
      detail: "คนในองค์กร",
      accent: "bg-emerald-500/10 text-emerald-700",
    },
    {
      label: "หน่วยงาน",
      value: activeDepartments,
      detail: "แยกตามภาคส่วน",
      accent: "bg-violet-500/10 text-violet-700",
    },
    {
      label: "เอกสารร่าง",
      value: draftDocuments,
      detail: "ต้องทบทวนก่อนเผยแพร่",
      accent: "bg-amber-500/10 text-amber-700",
    },
  ];

  return (
    <AppShell
      userLabel={displayName}
      userId={user?.id ?? session.user.id}
      isAdmin={userRole === "ADMIN"}
      role={userRole}
    >
      <div className="space-y-6">
        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">ภาพรวมระบบ</p>
            <h1 className="mt-1 text-3xl font-bold text-slate-900">Dashboard</h1>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
            <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700">
              {roleLabels[userRole] ?? userRole}
            </span>
            <span className="rounded-full bg-blue-50 px-3 py-1 font-medium text-blue-700">
              {departmentName}
            </span>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => (
            <div key={card.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${card.accent}`}>
                {card.label}
              </div>
              <div className="mt-4 text-3xl font-bold text-slate-900">{card.value}</div>
              <p className="mt-2 text-sm text-slate-500">{card.detail}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">เอกสารล่าสุด</h2>
              <Link href="/documents" className="text-sm font-medium text-blue-600 hover:text-blue-700">
                ดูทั้งหมด
              </Link>
            </div>

            <div className="space-y-3">
              {recentDocuments.length === 0 ? (
                <p className="rounded-xl bg-slate-50 px-4 py-6 text-sm text-slate-500">
                  ยังไม่มีเอกสารในระบบ
                </p>
              ) : (
                recentDocuments.map((document) => (
                  <div
                    key={document.id}
                    className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-slate-800">{document.title}</p>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                          {document.documentType.name}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-slate-500">
                        {document.documentNumber} • {document.department.name}
                      </p>
                    </div>

                    <div className="text-left md:text-right">
                      <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
                        {document.status}
                      </span>
                      <p className="mt-2 text-xs text-slate-500">
                        โดย {document.createdBy.name} • {new Intl.DateTimeFormat("th-TH", { dateStyle: "medium" }).format(new Date(document.createdAt))}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <aside className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">เมนูด่วน</h2>
              <div className="mt-4 space-y-3">
                <Link
                  href="/documents"
                  className="block rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-blue-700"
                >
                  ดูเอกสารทั้งหมด
                </Link>
                <Link
                  href="/documents/new"
                  className="block rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  สร้างเอกสารใหม่
                </Link>
                {userRole === "ADMIN" && (
                  <Link
                    href="/admin/users"
                    className="block rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    จัดการผู้ใช้งาน
                  </Link>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">ข้อมูลส่วนตัว</h2>
              <dl className="mt-4 space-y-3 text-sm text-slate-600">
                <div className="flex justify-between gap-3">
                  <dt>ชื่อ</dt>
                  <dd className="font-medium text-slate-800">{displayName}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>บทบาท</dt>
                  <dd className="font-medium text-slate-800">{roleLabels[userRole] ?? userRole}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>หน่วยงาน</dt>
                  <dd className="font-medium text-slate-800">{departmentName}</dd>
                </div>
              </dl>
            </div>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
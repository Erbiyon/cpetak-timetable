"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AddCurriculumCustom from "@/components/add-curriculum/add-curriculum-custom";
import EditCurriculumCustom from "@/components/edit-curriculum/edit-curriculum-custom";
import DeleteCurriculumCustom from "@/components/delete-curriculum/delete-curriculum-custom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  BookOpenText,
  GraduationCap,
  Layers,
  FileQuestion,
} from "lucide-react";

interface CurriculumItem {
  id: number;
  id_sub: string;
  subject_name: string;
  credit: number;
  lacture_credit: number;
  lab_credit: number;
  out_credit: number;
  curriculum_type: string;
}

const CURRICULUM_TABS = [
  {
    id: "all",
    label: "ทั้งหมด",
    indicatorColor: "bg-zinc-500",
    borderStyle: "border-border hover:border-zinc-400 dark:hover:border-zinc-600",
    badgeBg: "bg-secondary text-secondary-foreground",
    description: "แสดงรายการโครงสร้างรายวิชาทั้งหมดของทุกระดับการศึกษา",
  },
  {
    id: "dve",
    label: "หลักสูตร ปวส.",
    typeFilter: "DVE",
    indicatorColor: "bg-amber-500",
    borderStyle: "border-amber-300/80 dark:border-amber-800/80 hover:border-amber-500 dark:hover:border-amber-400",
    badgeBg: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
    description: "แสดงรายการวิชาในหลักสูตรประกาศนียบัตรวิชาชีพชั้นสูง (ปวส.) ทั้ง ปวช. และ ม.6",
    defaultCurriculumType: "DVE",
  },
  {
    id: "bachelor",
    label: "หลักสูตรปริญญาตรี",
    typeFilter: "BACHELOR",
    indicatorColor: "bg-indigo-500",
    borderStyle: "border-indigo-300/80 dark:border-indigo-800/80 hover:border-indigo-500 dark:hover:border-indigo-400",
    badgeBg: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800",
    description: "แสดงรายการวิชาในหลักสูตรวิศวกรรมศาสตรบัณฑิต (4 ปี และ เทียบโอน 3 ปี)",
    defaultCurriculumType: "BACHELOR",
  },
];

export default function CurriculumPage() {
  const [curriculum, setCurriculum] = useState<CurriculumItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const fetchCurriculum = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/curriculum");
      const data = await response.json();
      if (Array.isArray(data)) {
        setCurriculum(data);
      } else {
        setCurriculum([]);
      }
    } catch (error) {
      console.error("Error fetching curriculum data:", error);
      setCurriculum([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCurriculum();
  }, []);

  const filterCurriculum = (items: CurriculumItem[]) => {
    if (!searchQuery.trim()) return items;

    const query = searchQuery.toLowerCase();
    return items.filter(
      (item) =>
        item.id_sub.toLowerCase().includes(query) ||
        item.subject_name.toLowerCase().includes(query),
    );
  };

  // สถิติสรุปตามระดับหลักสูตร
  const totalCount = curriculum.length;
  const dveCount = curriculum.filter((item) => item.curriculum_type === "DVE").length;
  const bachelorCount = curriculum.filter(
    (item) => item.curriculum_type === "BACHELOR" || item.curriculum_type === "FOUR_YEAR" || item.curriculum_type === "TRANSFER",
  ).length;

  return (
    <div className="container mx-auto px-4 py-8 space-y-6 animate-in fade-in-50 duration-500">
      {/* 1. Academic Header: โครงสร้างหลักสูตร */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-xs transition-all">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="border-border bg-muted/60 text-foreground font-medium text-xs px-2.5 py-0.5"
              >
                สาขาวิศวกรรมคอมพิวเตอร์
              </Badge>
              <Badge variant="secondary" className="font-normal text-xs bg-secondary text-secondary-foreground">
                ฐานข้อมูลหลักสูตร
              </Badge>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl font-sans">
              โครงสร้างหลักสูตร
            </h1>
            <p className="text-sm text-muted-foreground font-sans">
              จัดการรายวิชา หน่วยกิต และสัดส่วนชั่วโมงบรรยาย/ปฏิบัติในหลักสูตรการศึกษา
            </p>
          </div>
        </div>
      </div>

      {/* 2. Stat Summary Cards with Distinctive Semantic Borders */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Subjects */}
        <Card className="border border-border bg-card shadow-xs hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground font-sans">
              รายวิชาทั้งหมดในหลักสูตร
            </CardTitle>
            <div className="p-2 rounded-md bg-secondary text-foreground">
              <BookOpenText className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-foreground font-sans">
              {isLoading ? <Skeleton className="h-8 w-14" /> : totalCount}
              <span className="text-xs font-normal text-muted-foreground ml-1.5">วิชา</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2 font-sans">
              รวมทุกระดับการศึกษาของสาขาวิชา
            </p>
          </CardContent>
        </Card>

        {/* DVE Subjects */}
        <Card className="border border-amber-300/80 dark:border-amber-800/80 hover:border-amber-500 dark:hover:border-amber-400 bg-card shadow-xs transition-colors">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              <CardTitle className="text-sm font-medium text-muted-foreground font-sans">
                หลักสูตร ปวส.
              </CardTitle>
            </div>
            <div className="p-2 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/50">
              <Layers className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-foreground font-sans">
              {isLoading ? <Skeleton className="h-8 w-14" /> : dveCount}
              <span className="text-xs font-normal text-muted-foreground ml-1.5">วิชา</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2 font-sans">
              วิชาสำหรับ ปวส. (ปวช.) และ ปวส. (ม.6)
            </p>
          </CardContent>
        </Card>

        {/* Bachelor Subjects */}
        <Card className="border border-indigo-300/80 dark:border-indigo-800/80 hover:border-indigo-500 dark:hover:border-indigo-400 bg-card shadow-xs transition-colors">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-indigo-500" />
              <CardTitle className="text-sm font-medium text-muted-foreground font-sans">
                หลักสูตรปริญญาตรี
              </CardTitle>
            </div>
            <div className="p-2 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/50">
              <GraduationCap className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-foreground font-sans">
              {isLoading ? <Skeleton className="h-8 w-14" /> : bachelorCount}
              <span className="text-xs font-normal text-muted-foreground ml-1.5">วิชา</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2 font-sans">
              วิชาสำหรับ 4 ปี และ เทียบโอน 3 ปี
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 3. Search Bar and Tabs Navigation */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="ค้นหารหัสวิชา หรือชื่อวิชา..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 font-sans border-border bg-card"
          />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
          <TabsList className="grid grid-cols-3 w-full sm:w-[360px] bg-secondary p-1 border border-border">
            <TabsTrigger value="all" className="text-xs font-sans">
              ทั้งหมด ({totalCount})
            </TabsTrigger>
            <TabsTrigger value="dve" className="text-xs font-sans">
              ปวส. ({dveCount})
            </TabsTrigger>
            <TabsTrigger value="bachelor" className="text-xs font-sans">
              ปริญญาตรี ({bachelorCount})
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* 4. Curriculum Content Table Container */}
      {CURRICULUM_TABS.map((tab) => {
        if (activeTab !== tab.id) return null;

        const filteredList = filterCurriculum(
          tab.typeFilter
            ? curriculum.filter((item) => {
                if (tab.typeFilter === "DVE") return item.curriculum_type === "DVE";
                return (
                  item.curriculum_type === "BACHELOR" ||
                  item.curriculum_type === "FOUR_YEAR" ||
                  item.curriculum_type === "TRANSFER"
                );
              })
            : curriculum,
        );

        return (
          <Card key={tab.id} className={`shadow-xs border bg-card transition-all duration-200 ${tab.borderStyle}`}>
            <CardHeader className="pb-4 border-b border-border">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${tab.indicatorColor}`} />
                    <CardTitle className="text-lg font-semibold font-sans">
                      {tab.label}
                    </CardTitle>
                    <Badge variant="outline" className={`text-xs font-normal ${tab.badgeBg}`}>
                      {filteredList.length} วิชา
                    </Badge>
                  </div>
                  <CardDescription className="text-xs text-muted-foreground mt-1 font-sans">
                    {tab.description}
                  </CardDescription>
                </div>
                <CardAction>
                  <AddCurriculumCustom
                    onSuccess={fetchCurriculum}
                    defaultCurriculumType={tab.defaultCurriculumType || "DVE"}
                  />
                </CardAction>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 hover:bg-muted/40 border-b border-border">
                      <TableHead className="font-semibold text-foreground text-xs w-[120px] font-sans">รหัสวิชา</TableHead>
                      <TableHead className="font-semibold text-foreground text-xs font-sans">ชื่อรายวิชา</TableHead>
                      <TableHead className="font-semibold text-foreground text-xs text-center w-[90px] font-sans">หน่วยกิต</TableHead>
                      <TableHead className="font-semibold text-foreground text-xs text-center w-[110px] font-sans">ชั่วโมงบรรยาย</TableHead>
                      <TableHead className="font-semibold text-foreground text-xs text-center w-[110px] font-sans">ชั่วโมงปฏิบัติ</TableHead>
                      <TableHead className="font-semibold text-foreground text-xs text-center w-[110px] font-sans">ชั่วโมงนอกเวลา</TableHead>
                      <TableHead className="font-semibold text-foreground text-xs text-center w-[110px] font-sans">ระดับหลักสูตร</TableHead>
                      <TableHead className="font-semibold text-foreground text-xs text-right w-[140px] pr-6 font-sans">ดำเนินการ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      Array.from({ length: 4 }).map((_, idx) => (
                        <TableRow key={idx} className="border-b border-border/60">
                          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                          <TableCell className="text-center"><Skeleton className="h-4 w-8 mx-auto" /></TableCell>
                          <TableCell className="text-center"><Skeleton className="h-4 w-8 mx-auto" /></TableCell>
                          <TableCell className="text-center"><Skeleton className="h-4 w-8 mx-auto" /></TableCell>
                          <TableCell className="text-center"><Skeleton className="h-4 w-8 mx-auto" /></TableCell>
                          <TableCell className="text-center"><Skeleton className="h-5 w-16 mx-auto rounded-full" /></TableCell>
                          <TableCell className="text-right pr-6"><Skeleton className="h-7 w-20 ml-auto" /></TableCell>
                        </TableRow>
                      ))
                    ) : filteredList.length > 0 ? (
                      filteredList.map((item) => (
                        <TableRow
                          key={item.id}
                          className="hover:bg-muted/30 transition-colors border-b border-border/60"
                        >
                          <TableCell className="font-medium text-xs font-sans text-foreground">
                            {item.id_sub}
                          </TableCell>
                          <TableCell className="text-xs font-sans text-foreground">
                            {item.subject_name}
                          </TableCell>
                          <TableCell className="text-xs text-center font-semibold font-sans text-foreground">
                            {item.credit}
                          </TableCell>
                          <TableCell className="text-xs text-center text-muted-foreground font-sans">
                            {item.lacture_credit}
                          </TableCell>
                          <TableCell className="text-xs text-center text-muted-foreground font-sans">
                            {item.lab_credit}
                          </TableCell>
                          <TableCell className="text-xs text-center text-muted-foreground font-sans">
                            {item.out_credit}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant="outline"
                              className={`text-[10px] font-normal ${
                                item.curriculum_type === "DVE"
                                  ? "border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300 bg-amber-500/10"
                                  : "border-indigo-300 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 bg-indigo-500/10"
                              }`}
                            >
                              {item.curriculum_type === "DVE" ? "ปวส." : "ปริญญาตรี"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right pr-6">
                            <div className="flex items-center justify-end gap-1.5">
                              <EditCurriculumCustom curriculum={item} onSuccess={fetchCurriculum} />
                              <DeleteCurriculumCustom curriculum={item} onSuccess={fetchCurriculum} />
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                          <FileQuestion className="h-8 w-8 mx-auto mb-2 text-muted-foreground/60" />
                          <div className="text-sm font-semibold text-foreground font-sans">
                            {searchQuery ? "ไม่พบรายวิชาที่ตรงกับคำค้นหา" : "ยังไม่มีข้อมูลรายวิชาในส่วนนี้"}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1 font-sans">
                            {searchQuery
                              ? `คำค้นหา "${searchQuery}" ไม่ตรงกับรหัสวิชาหรือชื่อวิชาใด ๆ`
                              : "สามารถเริ่มต้นเพิ่มวิชาลงในหลักสูตรได้โดยคลิกปุ่ม 'เพิ่มวิชา' ด้านบน"}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

export default function CurriculumPage() {
  const [curriculum, setCurriculum] = useState<CurriculumItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCurriculum = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/curriculum");
      const data = await response.json();
      setCurriculum(data);
    } catch (error) {
      console.error("Error fetching curriculum data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCurriculum();
  }, []);

  return (
    <div>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">หลักสูตร</h1>

        <Tabs defaultValue="dve" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="dve">ปวส.</TabsTrigger>
            <TabsTrigger value="bachelor">ปริญญาตรี</TabsTrigger>
          </TabsList>

          <TabsContent value="dve" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>จัดการวิชาในหลักสูตร ปวส.</CardTitle>
                <CardDescription className="dark:text-gray-400 text-black">
                  แสดงรายการวิชาในหลักสูตรประกาศนียบัตรวิชาชีพชั้นสูง (ปวส.)
                </CardDescription>
                <CardAction>
                  <AddCurriculumCustom onSuccess={fetchCurriculum} />
                </CardAction>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>รหัสวิชา</TableHead>
                        <TableHead>ชื่อวิชา</TableHead>
                        <TableHead>หน่วยกิต</TableHead>
                        <TableHead>ชั่วโมงบรรยาย</TableHead>
                        <TableHead>ชั่วโมงปฏิบัติ</TableHead>
                        <TableHead>ชั่วโมงนอกเวลา</TableHead>
                        <TableHead>ดำเนินการ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-4">
                            กำลังโหลดข้อมูล...
                          </TableCell>
                        </TableRow>
                      ) : curriculum.filter(
                          (item) => item.curriculum_type === "DVE"
                        ).length > 0 ? (
                        curriculum
                          .filter((item) => item.curriculum_type === "DVE")
                          .map((item) => (
                            <TableRow key={item.id}>
                              <TableCell>{item.id_sub}</TableCell>
                              <TableCell>{item.subject_name}</TableCell>
                              <TableCell>{item.credit}</TableCell>
                              <TableCell>{item.lacture_credit}</TableCell>
                              <TableCell>{item.lab_credit}</TableCell>
                              <TableCell>{item.out_credit}</TableCell>
                              <TableCell>
                                <div className="flex gap-2">
                                  <EditCurriculumCustom
                                    curriculum={item}
                                    onSuccess={fetchCurriculum}
                                  />
                                  <DeleteCurriculumCustom
                                    curriculum={item}
                                    onSuccess={fetchCurriculum}
                                  />
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={7}
                            className="text-center py-4 text-muted-foreground"
                          >
                            ยังไม่มีวิชาในหลักสูตรปวส.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bachelor" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>จัดการวิชาในหลักสูตรปริญญาตรี</CardTitle>
                <CardDescription className="dark:text-gray-400 text-black">
                  แสดงรายการวิชาในหลักสูตรปริญญาตรี
                </CardDescription>
                <CardAction>
                  <AddCurriculumCustom
                    onSuccess={fetchCurriculum}
                    defaultCurriculumType="BACHELOR"
                  />
                </CardAction>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>รหัสวิชา</TableHead>
                        <TableHead>ชื่อวิชา</TableHead>
                        <TableHead>หน่วยกิต</TableHead>
                        <TableHead>ชั่วโมงบรรยาย</TableHead>
                        <TableHead>ชั่วโมงปฏิบัติ</TableHead>
                        <TableHead>ชั่วโมงนอกเวลา</TableHead>
                        <TableHead>ดำเนินการ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-4">
                            กำลังโหลดข้อมูล...
                          </TableCell>
                        </TableRow>
                      ) : curriculum.filter(
                          (item) => item.curriculum_type === "BACHELOR"
                        ).length > 0 ? (
                        curriculum
                          .filter((item) => item.curriculum_type === "BACHELOR")
                          .map((item) => (
                            <TableRow key={item.id}>
                              <TableCell>{item.id_sub}</TableCell>
                              <TableCell>{item.subject_name}</TableCell>
                              <TableCell>{item.credit}</TableCell>
                              <TableCell>{item.lacture_credit}</TableCell>
                              <TableCell>{item.lab_credit}</TableCell>
                              <TableCell>{item.out_credit}</TableCell>
                              <TableCell>
                                <div className="flex gap-2">
                                  <EditCurriculumCustom
                                    curriculum={item}
                                    onSuccess={fetchCurriculum}
                                  />
                                  <DeleteCurriculumCustom
                                    curriculum={item}
                                    onSuccess={fetchCurriculum}
                                  />
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={7}
                            className="text-center py-4 text-muted-foreground"
                          >
                            ยังไม่มีวิชาในหลักสูตรปริญญาตรี
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

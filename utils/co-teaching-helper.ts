import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function checkCoTeachingGroup(subjectId: number) {
   const group = await prisma.coTeaching_tb.findFirst({
      where: {
         plans: {
            some: { id: subjectId }
         }
      },
      include: {
         plans: {
            select: {
               id: true,
               planType: true,
               yearLevel: true,
               subjectCode: true,
               termYear: true
            }
         }
      }
   });

   return group ? {
      groupKey: group.groupKey,
      planIds: group.plans.map(p => p.id),
      plans: group.plans
   } : null;
}

export function generateCoTeachingGroupKey(subjectCode: string, termYear: string, partNumber?: number): string {

   const termMatch = termYear.match(/(\d+)\/(\d+)/);

   if (!termMatch) {
      throw new Error(`Invalid termYear format: ${termYear}`);
   }

   const termNumber = termMatch[1];
   const year = termMatch[2];


   if (partNumber !== undefined) {
      return `${subjectCode}-${partNumber}-${termNumber}/${year}`;
   }


   return `${subjectCode}-${termNumber}/${year}`;
}

export async function handleCoTeachingSplit(
   originalGroupKey: string,
   newPlanIds: { part1Ids: number[], part2Ids: number[] },
   subjectCode: string,
   termYear: string,
   partNumbers: { part1: number, part2: number }
) {
   try {

      const originalGroup = await prisma.coTeaching_tb.findUnique({
         where: { groupKey: originalGroupKey },
         include: { plans: true }
      });

      if (originalGroup) {
         const allOldPlanIds = [...newPlanIds.part1Ids, ...newPlanIds.part2Ids];

         await prisma.coTeaching_tb.update({
            where: { id: originalGroup.id },
            data: {
               plans: {
                  disconnect: allOldPlanIds.map(id => ({ id }))
               }
            }
         });


         const updatedGroup = await prisma.coTeaching_tb.findUnique({
            where: { id: originalGroup.id },
            include: { plans: true }
         });

         if (updatedGroup && updatedGroup.plans.length === 0) {
            await prisma.coTeaching_tb.delete({
               where: { id: originalGroup.id }
            });
         }
      }


      const part1GroupKey = generateCoTeachingGroupKey(subjectCode, termYear, partNumbers.part1);
      await prisma.coTeaching_tb.create({
         data: {
            groupKey: part1GroupKey,
            plans: {
               connect: newPlanIds.part1Ids.map(id => ({ id }))
            }
         }
      });


      const part2GroupKey = generateCoTeachingGroupKey(subjectCode, termYear, partNumbers.part2);
      await prisma.coTeaching_tb.create({
         data: {
            groupKey: part2GroupKey,
            plans: {
               connect: newPlanIds.part2Ids.map(id => ({ id }))
            }
         }
      });

      return {
         success: true,
         newGroupKeys: {
            part1: part1GroupKey,
            part2: part2GroupKey
         }
      };
   } catch (error) {
      console.error("Error handling co-teaching split:", error);
      throw error;
   }
}

export async function handleCoTeachingMerge(
   subjectCode: string,
   termYear: string,
   mergedPlanIds: number[]
) {
   try {
      // หาวิชาทั้งหมดที่ต้องรวมกลับ (ทุกชั้นปี ทุก planType ที่เป็นส่วนแบ่งของวิชานี้)
      const allRelatedPlans = await prisma.plans_tb.findMany({
         where: {
            subjectCode: subjectCode,
            termYear: termYear,
            planType: {
               in: ["TRANSFER", "FOUR_YEAR"]
            },
            OR: [
               {
                  subjectName: {
                     contains: `${subjectCode} (ส่วนที่` // วิชาที่แบ่งแล้ว
                  }
               },
               {
                  id: { in: mergedPlanIds } // วิชาที่ส่งมา
               }
            ]
         }
      });

      console.log("All related plans found:", allRelatedPlans.map(p => ({
         id: p.id,
         planType: p.planType,
         yearLevel: p.yearLevel,
         subjectName: p.subjectName
      })));

      // หา groups ทั้งหมดที่เกี่ยวข้องกับวิชานี้ (รวมทุกส่วนแบ่ง)
      const relatedGroups = await prisma.coTeaching_tb.findMany({
         where: {
            OR: [
               {
                  plans: {
                     some: {
                        subjectCode: subjectCode,
                        termYear: termYear
                     }
                  }
               },
               {
                  groupKey: {
                     startsWith: `${subjectCode}-`
                  }
               },
               {
                  groupKey: {
                     contains: `/${termYear}`
                  }
               }
            ]
         },
         include: {
            plans: {
               where: {
                  subjectCode: subjectCode,
                  termYear: termYear
               }
            }
         }
      });

      console.log("Related groups found:", relatedGroups.map(g => ({
         id: g.id,
         groupKey: g.groupKey,
         planCount: g.plans.length,
         plans: g.plans.map(p => ({ id: p.id, planType: p.planType, yearLevel: p.yearLevel, subjectName: p.subjectName }))
      })));

      console.log("Input mergedPlanIds:", mergedPlanIds);

      // ลบ groups เดิมทั้งหมดที่เกี่ยวข้องกับวิชานี้
      for (const group of relatedGroups) {
         await prisma.coTeaching_tb.delete({
            where: { id: group.id }
         });
      }

      // สร้าง group ใหม่สำหรับวิชาที่รวมแล้ว โดยใช้วิชาที่รวมแล้วทั้งหมด
      const originalGroupKey = generateCoTeachingGroupKey(subjectCode, termYear);
      await prisma.coTeaching_tb.create({
         data: {
            groupKey: originalGroupKey,
            plans: {
               connect: mergedPlanIds.map(id => ({ id }))
            }
         }
      });

      console.log("Created new co-teaching group:", {
         groupKey: originalGroupKey,
         mergedPlanIds: mergedPlanIds
      });

      return {
         success: true,
         newGroupKey: originalGroupKey
      };
   } catch (error) {
      console.error("Error handling co-teaching merge:", error);
      throw error;
   }
}

export async function findCoTeachingSubjects(subjectCode: string, termYear: string) {
   const subjects = await prisma.plans_tb.findMany({
      where: {
         subjectCode: subjectCode,
         termYear: termYear,
         planType: {
            in: ["TRANSFER", "FOUR_YEAR"]
         }
      },
      include: {
         room: true,
         teacher: true
      }
   });

   return subjects;
}
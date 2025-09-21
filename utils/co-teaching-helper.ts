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

      const relatedGroups = await prisma.coTeaching_tb.findMany({
         where: {
            OR: [
               {
                  plans: {
                     some: {
                        id: { in: mergedPlanIds }
                     }
                  }
               },
               {
                  groupKey: {
                     startsWith: `${subjectCode}-`
                  }
               }
            ]
         },
         include: { plans: true }
      });


      for (const group of relatedGroups) {
         await prisma.coTeaching_tb.delete({
            where: { id: group.id }
         });
      }


      const originalGroupKey = generateCoTeachingGroupKey(subjectCode, termYear);
      await prisma.coTeaching_tb.create({
         data: {
            groupKey: originalGroupKey,
            plans: {
               connect: mergedPlanIds.map(id => ({ id }))
            }
         }
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
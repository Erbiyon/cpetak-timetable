import { useEffect, useState } from "react";

export default function CoTeachingInfo({ subjectId }: { subjectId: number }) {
    const [info, setInfo] = useState<string | null>(null);

    function getPlanTypeText(planType: string) {
        switch (planType) {
            case "TRANSFER": return "เทียบโอน";
            case "FOUR_YEAR": return "4 ปี";
            case "DVE-MSIX": return "ปวส. (ม.6)";
            case "DVE-LVC": return "ปวส. (ปวช.)";
            default: return planType;
        }
    }

    useEffect(() => {
        const fetchCoTeaching = async () => {
            const res = await fetch(`/api/subject/co-teaching/check?subjectId=${subjectId}`);
            if (res.ok) {
                const data = await res.json();
                if (data.planIds && data.planIds.length > 1) {

                    const otherSubjects = data.details?.filter((s: any) => s.id !== subjectId) || [];
                    if (otherSubjects.length > 0) {
                        setInfo(
                            otherSubjects
                                .map((s: any) => `${getPlanTypeText(s.planType)} ${s.yearLevel}`)
                                .join(", ")
                        );
                    } else {
                        setInfo("สอนร่วม");
                    }
                } else {
                    setInfo(null);
                }
            }
        };
        fetchCoTeaching();
    }, [subjectId]);

    if (!info) return <div> </div>;
    return <div className="text-green-700 dark:text-green-300">สอนร่วมกับ {info}</div>;
}
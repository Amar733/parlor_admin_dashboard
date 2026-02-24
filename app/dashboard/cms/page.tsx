// "use client";
// import { redirect } from "next/navigation";

// export default function CMSPage() {
//   redirect("/dashboard/cms/topbar");
// }



/////////////////////////////////////
/* can */






"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePermission } from "@/hooks/use-permission";

export default function CMSPage() {
  const router = useRouter();
  const { can } = usePermission();

  useEffect(() => {
    // Check permission to view CMS
    // const allowed = can("view", "/cms");
    const allowed = can("view", "/dashboard/cms");

    if (allowed) {
      // If user has CMS access, go to topbar page
      router.push("/dashboard/cms/topbar");
    } else {
      //  If not allowed, can itself handles redirect to /dashboard
      return;
    }
  }, [can, router]);

  // Optional loading state or fallback UI
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <p className="text-muted-foreground">Checking CMS permissions...</p>
    </div>
  );
}























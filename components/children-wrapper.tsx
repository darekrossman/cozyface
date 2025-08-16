"use client";

import { useSelectedLayoutSegment } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function ChildrenWrapper({ children }: { children: React.ReactNode }) {
  const seg = useSelectedLayoutSegment("modal");
  const ref = useRef<HTMLDivElement>(null);
  const [isModal, setIsModal] = useState(false);
  const [currentScrollY, setCurrentScrollY] = useState(0);

  useEffect(() => {
    if (seg !== null) {
      console.log(document.getElementById("main")?.scrollTop);
      setCurrentScrollY(document.getElementById("main")?.scrollTop ?? 0);
      setIsModal(true);
    } else {
      setIsModal(false);
    }
  }, [seg]);

  useEffect(() => {
    if (!isModal) {
      document.getElementById("main")?.scrollTo({ top: currentScrollY });
    }
  }, [isModal]);

  return (
    <div ref={ref} className={`${isModal ? "fixed" : "contents"}`}>
      {children}
    </div>
  );
}

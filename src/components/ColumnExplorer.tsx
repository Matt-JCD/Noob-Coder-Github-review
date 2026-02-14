"use client";

import { useRef, useEffect } from "react";
import { useExplorer } from "@/context/ExplorerContext";
import FolderColumn from "./FolderColumn";
import FileDetail from "./FileDetail";

export default function ColumnExplorer() {
  const { state } = useExplorer();
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevColumnCount = useRef(state.columns.length);

  // Auto-scroll right when new columns appear
  useEffect(() => {
    if (
      state.columns.length > prevColumnCount.current ||
      state.fileDetail
    ) {
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTo({
            left: scrollRef.current.scrollWidth,
            behavior: "smooth",
          });
        }
      }, 50);
    }
    prevColumnCount.current = state.columns.length;
  }, [state.columns.length, state.fileDetail]);

  if (state.columns.length === 0) return null;

  return (
    <div
      ref={scrollRef}
      className="flex-1 flex overflow-x-auto overflow-y-hidden"
    >
      {state.columns.map((column, depth) => (
        <FolderColumn key={`${column.path}-${depth}`} column={column} depth={depth} />
      ))}
      <FileDetail />
    </div>
  );
}

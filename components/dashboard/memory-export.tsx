"use client";

import { useState } from "react";
import { IconDownload, IconLoader2 } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";

export function MemoryExport() {
  const [isExporting, setIsExporting] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const handleExport = async () => {
    setIsExporting(true);
    setDownloadUrl(null);

    try {
      const res = await fetch("/api/memories/export", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setDownloadUrl(data.url);
      }
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setIsExporting(false);
    }
  };

  if (downloadUrl) {
    return (
      <Button variant="outline" size="sm" className="inline-flex items-center">
        <a href={downloadUrl} target="_blank" rel="noopener noreferrer" className="flex items-center">
          <IconDownload className="mr-2 h-3 w-3" />
          Download Export
        </a>
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={isExporting}
    >
      {isExporting ? (
        <IconLoader2 className="mr-2 h-3 w-3 animate-spin" />
      ) : (
        <IconDownload className="mr-2 h-3 w-3" />
      )}
      Export to S3
    </Button>
  );
}
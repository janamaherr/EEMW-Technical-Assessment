import type { Metadata } from "next";
import { UploadForm } from "@/components/documents/upload-form";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = { title: "Upload" };

export default function UploadPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Upload a document"
        description="Add a new document with its metadata. You can upload new versions later."
      />
      <UploadForm />
    </div>
  );
}

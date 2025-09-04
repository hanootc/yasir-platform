import { useState, useRef } from "react";
import type { ReactNode } from "react";
import Uppy from "@uppy/core";
import { Dashboard } from "@uppy/react";
import "@uppy/core/dist/style.min.css";
import "@uppy/dashboard/dist/style.min.css";
import AwsS3 from "@uppy/aws-s3";
import type { UploadResult } from "@uppy/core";
import { Button } from "@/components/ui/button";

interface ObjectUploaderProps {
  maxNumberOfFiles?: number;
  maxFileSize?: number;
  onGetUploadParameters: () => Promise<{
    method: "PUT";
    url: string;
  }>;
  onComplete?: (
    result: UploadResult<Record<string, unknown>, Record<string, unknown>>
  ) => void;
  buttonClassName?: string;
  children: ReactNode;
}

/**
 * A file upload component that renders as a button and provides a modal interface for
 * file management.
 * 
 * Features:
 * - Renders as a customizable button that opens a file upload modal
 * - Provides a modal interface for:
 *   - File selection
 *   - File preview
 *   - Upload progress tracking
 *   - Upload status display
 * 
 * The component uses Uppy under the hood to handle all file upload functionality.
 * All file management features are automatically handled by the Uppy dashboard modal.
 * 
 * @param props - Component props
 * @param props.maxNumberOfFiles - Maximum number of files allowed to be uploaded
 *   (default: 1)
 * @param props.maxFileSize - Maximum file size in bytes (default: 10MB)
 * @param props.onGetUploadParameters - Function to get upload parameters (method and URL).
 *   Typically used to fetch a presigned URL from the backend server for direct-to-S3
 *   uploads.
 * @param props.onComplete - Callback function called when upload is complete. Typically
 *   used to make post-upload API calls to update server state and set object ACL
 *   policies.
 * @param props.buttonClassName - Optional CSS class name for the button
 * @param props.children - Content to be rendered inside the button
 */
export function ObjectUploader({
  maxNumberOfFiles = 1,
  maxFileSize = 10485760, // 10MB default
  onGetUploadParameters,
  onComplete,
  buttonClassName,
  children,
}: ObjectUploaderProps) {
  const [showModal, setShowModal] = useState(false);
  const [uppy] = useState(() =>
    new Uppy({
      restrictions: {
        maxNumberOfFiles,
        maxFileSize,
      },
      autoProceed: false,
      debug: true,
    })
      .use(AwsS3, {
        shouldUseMultipart: false,
        getUploadParameters: onGetUploadParameters,
      })
      .on("complete", (result) => {
        onComplete?.(result);
        setShowModal(false);
      })
  );

  const handleOpenModal = () => {
    console.log('🔥 Opening upload modal');
    setShowModal(true);
  };

  const handleCloseModal = () => {
    console.log('🔥 Closing upload modal');
    setShowModal(false);
  };

  return (
    <div className="relative">
      <Button type="button" onClick={handleOpenModal} className={buttonClassName}>
        {children}
      </Button>

      {showModal && (
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 z-50 bg-white border rounded-lg shadow-xl w-80 h-80">
          <div className="p-2 border-b flex justify-between items-center">
            <span className="text-sm font-medium">رفع الصور</span>
            <button 
              onClick={handleCloseModal}
              className="text-gray-500 hover:text-gray-700 text-lg font-bold"
            >
              ×
            </button>
          </div>
          <div className="p-2">
            <Dashboard
              uppy={uppy}
              showLinkToFileUploadResult={false}
              showProgressDetails={false}
              height={260}
              width="100%"
              proudlyDisplayPoweredByUppy={false}
              note="يمكنك سحب الملفات هنا أو النقر للاختيار"
            />
          </div>
        </div>
      )}
    </div>
  );
}
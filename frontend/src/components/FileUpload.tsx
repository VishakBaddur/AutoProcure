"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";

interface FileUploadProps {
  onFileUpload: (file: File) => Promise<unknown>;
}

type FileStatus = 'pending' | 'uploading' | 'analyzing' | 'done' | 'error';

interface FileState {
  file: File;
  status: FileStatus;
  result?: unknown;
  error?: string;
}

export default function FileUpload({ onFileUpload }: FileUploadProps) {
  const [files, setFiles] = useState<FileState[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const validFiles: FileState[] = [];
    let foundError = false;
    selectedFiles.forEach((file) => {
      const extension = file.name.toLowerCase().split('.').pop();
      if (extension && ['pdf', 'xlsx', 'xls'].includes(extension)) {
        validFiles.push({ file, status: 'pending' });
      } else {
        setError("Please select only PDF or Excel files");
        foundError = true;
      }
    });
    if (!foundError) setError(null);
    setFiles(validFiles);
  };

  const handleUploadAll = async () => {
    setFiles((prev) => prev.map(f => ({ ...f, status: 'uploading', result: undefined, error: undefined })));
    await Promise.all(
      files.map(async (fileState, idx) => {
        try {
          setFiles(prev => prev.map((f, i) => i === idx ? { ...f, status: 'analyzing' } : f));
          const result = await onFileUpload(fileState.file);
          setFiles(prev => prev.map((f, i) => i === idx ? { ...f, status: 'done', result } : f));
        } catch (err: unknown) {
          const errorMessage = err instanceof Error ? err.message : 'Upload failed';
          setFiles(prev => prev.map((f, i) => i === idx ? { ...f, status: 'error', error: errorMessage } : f));
        }
      })
    );
  };

  return (
    <div className="space-y-4">
      <div className="grid w-full max-w-sm items-center gap-1.5">
        <Label htmlFor="file">Quote Files</Label>
        <Input
          id="file"
          type="file"
          accept=".pdf,.xlsx,.xls"
          multiple
          onChange={handleFileChange}
        />
      </div>
      
      {error && (
        <div className="text-red-600 text-sm">{error}</div>
      )}

      {files.length > 0 && (
        <div className="space-y-2">
          <Button 
            onClick={handleUploadAll} 
            className="w-full"
            disabled={files.some(f => f.status === 'uploading' || f.status === 'analyzing')}
          >
            Analyze {files.length} File{files.length > 1 ? 's' : ''}
          </Button>
          <div className="space-y-2">
            {files.map((f, idx) => (
              <div key={f.file.name + idx} className="border rounded p-2 bg-gray-50">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-800">{f.file.name}</span>
                  <span className="text-xs text-gray-500">{(f.file.size / 1024 / 1024).toFixed(2)} MB</span>
                </div>
                <div className="mt-1">
                  {f.status === 'pending' && <span className="text-gray-500 text-xs">Ready to upload</span>}
                  {f.status === 'uploading' && <span className="text-blue-600 text-xs">Uploading...</span>}
                  {f.status === 'analyzing' && (
                    <div className="flex items-center gap-2 text-xs text-blue-600">
                      <span>Analyzing...</span>
                      <Progress value={75} className="w-24" />
                    </div>
                  )}
                  {f.status === 'done' && <span className="text-green-600 text-xs">Done</span>}
                  {f.status === 'error' && <span className="text-red-600 text-xs">{f.error}</span>}
                </div>
                {Boolean(f.result) && (
                  <div className="mt-2 text-xs text-gray-700 bg-green-50 rounded p-2">
                    Analysis complete. See results above.
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 
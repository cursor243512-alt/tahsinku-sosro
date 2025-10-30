'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileSpreadsheet, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface ExportButtonProps {
  type: 'participants' | 'instructors' | 'attendance' | 'payments';
  label?: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
}

export function ExportButton({ 
  type, 
  label = 'Export ke Sheets',
  variant = 'outline' 
}: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleExport = async () => {
    setIsExporting(true);
    setMessage(null);

    try {
      // Get session token
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Anda harus login terlebih dahulu');
      }

      const response = await fetch(`/api/export/${type}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Export gagal');
      }

      setMessage({
        type: 'success',
        text: data.message || 'Export berhasil!',
      });

      // Clear message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      console.error('Export error:', error);
      setMessage({
        type: 'error',
        text: error.message || 'Terjadi kesalahan saat export',
      });

      // Clear error after 5 seconds
      setTimeout(() => setMessage(null), 5000);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <Button
        onClick={handleExport}
        disabled={isExporting}
        variant={variant}
        className="gap-2"
      >
        {isExporting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Exporting...
          </>
        ) : (
          <>
            <FileSpreadsheet className="h-4 w-4" />
            {label}
          </>
        )}
      </Button>

      {message && (
        <div
          className={`text-sm px-3 py-1 rounded ${
            message.type === 'success'
              ? 'bg-green-100 text-green-800 border border-green-300'
              : 'bg-red-100 text-red-800 border border-red-300'
          }`}
        >
          {message.text}
        </div>
      )}
    </div>
  );
}

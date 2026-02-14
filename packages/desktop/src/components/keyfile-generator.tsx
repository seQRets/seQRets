import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, CreditCard, Download, File, Loader2, RefreshCw, TriangleAlert, Wand2, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Buffer } from 'buffer';
import { saveFileNative, base64ToUint8Array, BIN_FILTERS } from '@/lib/native-save';

interface KeyfileGeneratorProps {
  onKeyfileGenerated: (base64Keyfile: string | null) => void;
  onSmartCardSave?: () => void;
}

const KEYFILE_BYTE_LENGTH = 32; // 256 bits, a standard size for cryptographic keys

export function KeyfileGenerator({ onKeyfileGenerated, onSmartCardSave }: KeyfileGeneratorProps) {
  const [keyfileData, setKeyfileData] = useState<string | null>(null);
  const [isGenerated, setIsGenerated] = useState(false);
  const { toast } = useToast();
  const hasGenerated = useRef(false);

  // Auto-generate keyfile on mount
  useEffect(() => {
    if (hasGenerated.current) return;
    hasGenerated.current = true;
    try {
      const randomBytes = window.crypto.getRandomValues(new Uint8Array(KEYFILE_BYTE_LENGTH));
      const base64Keyfile = Buffer.from(randomBytes).toString('base64');

      setKeyfileData(base64Keyfile);
      onKeyfileGenerated(base64Keyfile);
      setIsGenerated(true);

      toast({
        title: 'Keyfile Generated & Applied',
        description: 'Download the keyfile or save it to a smart card for safekeeping.',
      });
    } catch (e) {
      console.error("Failed to generate random bytes for keyfile:", e);
      toast({
        variant: 'destructive',
        title: 'Generation Failed',
        description: 'Could not generate a secure keyfile. Your browser may not support the required cryptographic functions.',
      });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDownload = async (base64Data: string | null) => {
    if (!base64Data) return;

    try {
      const byteArray = base64ToUint8Array(base64Data);
      const savedPath = await saveFileNative('seqrets-keyfile.bin', BIN_FILTERS, byteArray);
      if (savedPath) {
        toast({
          title: 'Keyfile Saved',
          description: 'Your keyfile "seqrets-keyfile.bin" has been saved. Store it somewhere safe!',
        });
      }
    } catch (e) {
        console.error("Failed to save keyfile:", e);
        toast({
            variant: 'destructive',
            title: 'Save Failed',
            description: 'Could not save the keyfile.',
        });
    }
  };

  const handleReset = () => {
    setKeyfileData(null);
    onKeyfileGenerated(null);
    setIsGenerated(false);
  };

  if (isGenerated && keyfileData) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between w-full p-3 border rounded-lg bg-green-500/10 border-green-500/30">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-green-500" />
            <div className="flex flex-col">
              <span className="text-sm font-medium text-green-700 dark:text-green-300">Keyfile Generated & Applied</span>
              <span className="text-xs text-muted-foreground">`seqrets-keyfile.bin`</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => handleDownload(keyfileData)}>
                <Download className="mr-2 h-4 w-4" /> Download
            </Button>
            {onSmartCardSave && (
              <Button
                variant="outline"
                size="sm"
                onClick={onSmartCardSave}
                className="bg-[#cbc5ba] border-[#cbc5ba] hover:bg-[#b5ad9f] hover:border-[#b5ad9f] dark:bg-[#605c53] dark:text-white dark:border-black dark:hover:bg-[#232122] dark:hover:text-white dark:hover:border-black"
              >
                <CreditCard className="mr-2 h-4 w-4" /> Smart Card
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={handleReset} className="h-8 w-8">
              <X className="h-5 w-5" />
              <span className="sr-only">Remove keyfile</span>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" />
      Generating keyfile...
    </div>
  );
}

    
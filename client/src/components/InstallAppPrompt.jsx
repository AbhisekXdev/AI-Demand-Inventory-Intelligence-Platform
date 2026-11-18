
import { useEffect, useState } from "react";
import { Download, X, Smartphone, Share, PlusSquare } from "lucide-react";

export default function InstallAppPrompt() {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true;

    if (isStandalone) return;

    const dismissed = sessionStorage.getItem("demandiq-install-dismissed");

    if (dismissed) return;

    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);

    if (isIOS) {
      setShowBanner(true);
      return;
    }

    const handleInstallAvailable = (event) => {
      event.preventDefault();
      setInstallPrompt(event);
      setShowBanner(true);
    };

    const handleInstalled = () => {
      setInstallPrompt(null);
      setShowBanner(false);
    };

    window.addEventListener("beforeinstallprompt", handleInstallAvailable);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleInstallAvailable);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) {
      setShowIOSInstructions(true);
      return;
    }

    await installPrompt.prompt();
    const result = await installPrompt.userChoice;

    if (result.outcome === "accepted") {
      setShowBanner(false);
    }

    setInstallPrompt(null);
  };

  const dismissBanner = () => {
    setShowBanner(false);
    sessionStorage.setItem("demandiq-install-dismissed", "true");
  };

  if (!showBanner) return null;

  return (
    <>
      <div className="fixed bottom-5 left-4 right-4 z-[9999] mx-auto max-w-md animate-in slide-in-from-bottom-5">
        <div className="relative rounded-2xl border border-indigo-100 bg-white p-4 shadow-2xl shadow-indigo-950/15">

          <button
            onClick={dismissBanner}
            className="absolute right-3 top-3 rounded-full p-1.5 text-slate-400 hover:bg-slate-100"
            aria-label="Dismiss installation banner"
          >
            <X size={18} />
          </button>

          <div className="flex items-center gap-3 pr-7">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-900 text-white shadow-lg">
              <Smartphone size={25} />
            </div>

            <div>
              <h3 className="font-bold text-slate-900">
                Install DemandIQ App
              </h3>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Get faster access to your inventory dashboard.
              </p>
            </div>
          </div>

          <button
            onClick={handleInstall}
            className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-sm font-bold text-white shadow-lg shadow-indigo-200 transition hover:opacity-90"
          >
            <Download size={17} />
            Install App
          </button>

          <p className="mt-2 text-center text-[10px] text-slate-400">
            Free installation · Secure access
          </p>
        </div>
      </div>

      {showIOSInstructions && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-xl bg-indigo-100 p-3 text-indigo-700">
                <Smartphone size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                Install DemandIQ
              </h3>
            </div>

            <p className="text-sm text-slate-600">
              To add DemandIQ to your iPhone:
            </p>

            <div className="mt-5 space-y-4 text-sm text-slate-700">
              <div className="flex items-center gap-3">
                <Share className="text-indigo-600" />
                <span>1. Open this website in Safari and tap Share.</span>
              </div>

              <div className="flex items-center gap-3">
                <PlusSquare className="text-indigo-600" />
                <span>2. Select Add to Home Screen.</span>
              </div>

              <div className="flex items-center gap-3">
                <Download className="text-indigo-600" />
                <span>3. Tap Add to finish installation.</span>
              </div>
            </div>

            <button
              onClick={() => setShowIOSInstructions(false)}
              className="mt-6 w-full rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}

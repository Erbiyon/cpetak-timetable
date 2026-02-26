import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

class ButtonErrorBoundary extends React.Component<
  { children: React.ReactNode; onReset?: () => void },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode; onReset?: () => void }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Button Error Boundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ButtonErrorDisplay error={this.state.error} />;
    }

    return this.props.children;
  }
}

function ButtonErrorDisplay({ error }: { error: Error | null }) {
  const isMaxUpdateDepthError = error?.message?.includes(
    "Maximum update depth exceeded",
  );

  return (
    <>
      {/* Fixed overlay for error popup */}
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
        <div className="bg-card rounded-lg border border-destructive/20 shadow-lg max-w-md w-full mx-4">
          <div className="p-6">
            <div className="flex flex-col items-center text-center">
              <AlertTriangle className="h-16 w-16 text-destructive mb-4" />

              <h3 className="text-lg font-semibold text-destructive mb-2">
                {isMaxUpdateDepthError ? "เกิดปัญหาแล้วสิ" : "เกิดปัญหาแล้วสิ"}
              </h3>

              <p className="text-sm text-muted-foreground mb-6">
                {isMaxUpdateDepthError
                  ? "ควรหลีกเลี่ยงการลากวิชาไปทับซ้อนกับวิชาอื่น หรือวางลงในคาบที่มีวิชาอยู่แล้ว รวมถึงการลากที่เร็วเกินไปในช่องที่มีวิชาอยู่ด้วย"
                  : "ควรหลีกเลี่ยงการลากวิชาไปทับซ้อนกับวิชาอื่น หรือวางลงในคาบที่มีวิชาอยู่แล้ว รวมถึงการลากที่เร็วเกินไปในช่องที่มีวิชาอยู่ด้วย"}
              </p>

              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-medium"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* Render invisible placeholder to maintain layout */}
      <div className="opacity-0 pointer-events-none">Error occurred</div>
    </>
  );
}

export default ButtonErrorBoundary;

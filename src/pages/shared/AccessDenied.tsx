import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function AccessDenied() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center space-y-4 p-4 text-center">
      <h1 className="text-4xl font-bold">Access Denied</h1>
      <p className="text-muted-foreground max-w-md">
        You don't have permission to view this page. Please contact an administrator if you believe this is a mistake.
      </p>
      <Link to="/dashboard">
        <Button>Return to Dashboard</Button>
      </Link>
    </div>
  );
}

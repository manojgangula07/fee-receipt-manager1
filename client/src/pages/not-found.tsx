import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function NotFound() {
  const { settings, isLoading } = useSettings();
  const schoolName = settings?.schoolName || "School Fee Management";

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center mb-6">
            <AlertCircle className="h-12 w-12 text-red-500 mb-2" />
            <h1 className="text-2xl font-bold text-gray-900">404 Page Not Found</h1>
            <p className="text-gray-500 mt-1">{schoolName}</p>
          </div>

          <p className="mt-4 text-sm text-gray-600 text-center">
            The page you are looking for doesn't exist or has been moved.
          </p>
          
          <div className="mt-6 flex justify-center">
            <Button asChild>
              <Link href="/dashboard">
                Return to Dashboard
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
